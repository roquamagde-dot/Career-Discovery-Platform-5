import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express, { type Express, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';

const SESSION_COOKIE = 'webdev_app_session';
const NONCE_COOKIE = 'career_oauth_nonce';
const CSRF_COOKIE = 'career_csrf_token';
const CALLBACK_PATH = '/api/auth/callback';
const DASHBOARD_PATH = '/dashboard';
const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;
const OAUTH_NONCE_TTL_SECONDS = 10 * 60;
const MAX_BODY_BYTES = '1mb';

let pool: Pool | undefined;

function database(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  pool = mysql.createPool(connectionString);
  return pool;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

function parseFrontendOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    const isHttps = parsed.protocol === 'https:';
    const isLocalHttp = parsed.protocol === 'http:' && isLocalHostname(parsed.hostname);
    if ((!isHttps && !isLocalHttp) || parsed.origin !== value || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function cookiePolicy(origin: string): { secure: boolean; sameSite: 'None' | 'Lax' } {
  const secure = new URL(origin).protocol === 'https:';
  return { secure, sameSite: secure ? 'None' : 'Lax' };
}

function appendCookie(res: Response, name: string, value: string, origin: string, options: {
  httpOnly?: boolean;
  maxAgeSeconds?: number;
  clear?: boolean;
} = {}): void {
  const policy = cookiePolicy(origin);
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/'];
  if (options.clear) parts.push('Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  else if (options.maxAgeSeconds !== undefined) parts.push(`Max-Age=${options.maxAgeSeconds}`);
  if (options.httpOnly) parts.push('HttpOnly');
  parts.push(`SameSite=${policy.sameSite}`);
  if (policy.secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function readCookies(req: Request): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    try {
      result.set(name, decodeURIComponent(rawValue));
    } catch {
      // Ignore malformed cookies; they cannot authenticate.
    }
  }
  return result;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function decodeBase64UrlJson(value: string): unknown {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 8192) throw new Error('Invalid encoded JSON');
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
}

interface ManusJwtPayload {
  appId: string;
  openId: string;
  exp: number;
}

function verifyPreviewJwt(token: string): ManusJwtPayload | null {
  const secret = process.env.MANUS_JWT_SECRET;
  const projectId = process.env.MANUS_PROJECT_ID;
  if (!secret || !projectId) return null;
  const pieces = token.split('.');
  if (pieces.length !== 3) return null;
  try {
    const header = decodeBase64UrlJson(pieces[0]) as { alg?: unknown; typ?: unknown };
    if (!header || header.alg !== 'HS256') return null;
    const expected = createHmac('sha256', secret).update(`${pieces[0]}.${pieces[1]}`).digest();
    const actual = Buffer.from(pieces[2], 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = decodeBase64UrlJson(pieces[1]) as Partial<ManusJwtPayload>;
    if (payload.appId !== projectId || typeof payload.openId !== 'string' || payload.openId.length < 1 || payload.openId.length > 191) return null;
    if (!Number.isFinite(payload.exp) || Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;
    return { appId: projectId, openId: payload.openId, exp: Number(payload.exp) };
  } catch {
    return null;
  }
}

interface AppUser {
  id: number;
  openId: string;
  displayName: string | null;
  email: string | null;
}

interface AuthContext {
  user: AppUser;
  tokenHash?: string;
  frontendOrigin?: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  open_id: string;
  display_name: string | null;
  email: string | null;
  token_hash?: string;
  frontend_origin?: string;
}

async function upsertUser(openId: string, displayName?: string | null, email?: string | null): Promise<AppUser> {
  const db = database();
  await db.execute(
    `INSERT INTO app_users (open_id, display_name, email)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       display_name = COALESCE(VALUES(display_name), display_name),
       email = COALESCE(VALUES(email), email),
       updated_at = CURRENT_TIMESTAMP`,
    [openId, displayName || null, email || null],
  );
  const [rows] = await db.execute<UserRow[]>(
    'SELECT id, open_id, display_name, email FROM app_users WHERE open_id = ? LIMIT 1',
    [openId],
  );
  const row = rows[0];
  if (!row) throw new Error('User resolution failed');
  return { id: row.id, openId: row.open_id, displayName: row.display_name, email: row.email };
}

async function authenticate(req: Request, frontendOrigin: string): Promise<AuthContext | null> {
  const token = readCookies(req).get(SESSION_COOKIE);
  if (!token || token.length > 8192) return null;

  const jwt = verifyPreviewJwt(token);
  if (jwt) return { user: await upsertUser(jwt.openId) };

  if (token.split('.').length === 3) return null;
  const tokenHash = sha256(token);
  const [rows] = await database().execute<UserRow[]>(
    `SELECT u.id, u.open_id, u.display_name, u.email, s.token_hash, s.frontend_origin
       FROM app_sessions s
       JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()
      LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row || row.frontend_origin !== frontendOrigin) return null;
  return {
    user: { id: row.id, openId: row.open_id, displayName: row.display_name, email: row.email },
    tokenHash: row.token_hash,
    frontendOrigin: row.frontend_origin,
  };
}

function publicRequestOrigin(req: Request): string | null {
  const forwardedProto = req.get('X-Forwarded-Proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('X-Forwarded-Host')?.split(',')[0]?.trim();
  if (forwardedProto && forwardedHost) return parseFrontendOrigin(`${forwardedProto}://${forwardedHost}`);
  const origin = parseFrontendOrigin(req.get('Origin'));
  if (origin) return origin;
  const referer = req.get('Referer');
  if (referer) {
    try { return parseFrontendOrigin(new URL(referer).origin); } catch { return null; }
  }
  return null;
}

function oauthServiceUrl(base: string, endpoint: string): string {
  const parsed = new URL(base);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocalHostname(parsed.hostname))) {
    throw new Error('Invalid OAuth service URL');
  }
  return `${base.replace(/\/+$/, '')}/${endpoint}`;
}

function callbackUrl(origin: string): string {
  return `${origin}${CALLBACK_PATH}`;
}

function getOriginHeader(req: Request): string | null {
  const raw = req.get('Origin');
  return raw ? parseFrontendOrigin(raw) : null;
}

function makeWorkspace() {
  return {
    version: 1 as const,
    assessmentVersion: 'draft-v1.3' as const,
    privacyAccepted: false,
    profile: { name: '', currentStage: '', studyArea: '', activities: '', targetLocation: '' },
    answers: {} as Record<string, unknown>,
    skippedQuestionIds: [] as string[],
    evidenceReviews: {} as Record<string, unknown>,
    sessionStatus: 'not-started' as const,
    roadmapProgress: [] as string[],
    history: [] as unknown[],
  };
}

const safeId = z.string().min(1).max(128);
const answerSchema = z.union([
  z.string().max(5000),
  z.number().finite(),
  z.array(z.string().max(1000)).max(100),
  z.object({ rating: z.number().int().min(1).max(5), example: z.string().max(5000) }).strict(),
]);
const profileSchema = z.object({
  name: z.string().max(200),
  currentStage: z.string().max(200),
  studyArea: z.string().max(300),
  activities: z.string().max(3000),
  targetLocation: z.string().max(300),
}).strict();
const evidenceSchema = z.object({
  note: z.string().max(5000),
  status: z.enum(['needs-review', 'confirmed', 'disputed']),
  taskTags: z.array(z.string().max(100)).max(50).optional(),
}).strict();
const reportSchema = z.object({
  id: safeId,
  completedAt: z.string().datetime({ offset: true }),
  assessmentVersion: z.string().min(1).max(100),
  profile: profileSchema,
  answers: z.record(safeId, answerSchema),
  evidenceReviews: z.record(safeId, evidenceSchema),
}).strict();
const workspaceSchema = z.object({
  version: z.literal(1),
  assessmentVersion: z.literal('draft-v1.3'),
  privacyAccepted: z.boolean(),
  profile: profileSchema,
  answers: z.record(safeId, answerSchema),
  skippedQuestionIds: z.array(safeId).max(300),
  evidenceReviews: z.record(safeId, evidenceSchema),
  sessionStatus: z.enum(['not-started', 'in-progress', 'paused', 'completed']),
  roadmapProgress: z.array(safeId).max(100),
  completedAt: z.string().datetime({ offset: true }).optional(),
  history: z.array(reportSchema).max(100),
}).strict();
const workspacePutSchema = z.object({
  workspace: workspaceSchema,
  expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).strict();

function csrfTokenIsValid(req: Request): boolean {
  const cookieToken = readCookies(req).get(CSRF_COOKIE);
  const headerToken = req.get('X-CSRF-Token');
  return Boolean(cookieToken && headerToken && cookieToken.length <= 256 && constantTimeTextEqual(cookieToken, headerToken));
}

function ensureNoStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

function sendLoginFailure(res: Response): void {
  res.status(401).type('text/plain').send('Login failed.');
}

function createApiRouter(): express.Router {
  const router = express.Router();
  router.use(ensureNoStore);
  router.use(express.json({ limit: MAX_BODY_BYTES, strict: true }));

  router.get('/health', async (_req, res) => {
    try {
      const db = database();
      await db.query('SELECT 1');
      const [migrationRows] = await db.execute<RowDataPacket[]>(
        "SELECT migration_id FROM schema_migrations WHERE migration_id = '0001_initial' LIMIT 1",
      );
      if (!migrationRows.length) throw new Error('Initial schema is not applied');
      await db.query('SELECT id, open_id FROM app_users LIMIT 0');
      await db.query('SELECT token_hash, user_id FROM app_sessions LIMIT 0');
      await db.query('SELECT user_id, revision, schema_version, payload FROM user_workspaces LIMIT 0');
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  router.post('/auth/start', async (req, res) => {
    try {
      const submittedOrigin = parseFrontendOrigin(req.body?.origin);
      const browserOrigin = getOriginHeader(req);
      if (!submittedOrigin || !browserOrigin || browserOrigin !== submittedOrigin) {
        res.status(400).json({ error: 'Invalid origin.' });
        return;
      }
      const portalBase = requiredEnv('MANUS_OAUTH_PORTAL_URL');
      const appId = requiredEnv('MANUS_PROJECT_ID');
      const redirectUri = callbackUrl(submittedOrigin);
      const nonce = randomBytes(32).toString('base64url');
      const state = Buffer.from(JSON.stringify({ redirectUri, nonce })).toString('base64url');
      const nonceCookie = Buffer.from(JSON.stringify({ origin: submittedOrigin, nonce })).toString('base64url');
      appendCookie(res, NONCE_COOKIE, nonceCookie, submittedOrigin, { httpOnly: true, maxAgeSeconds: OAUTH_NONCE_TTL_SECONDS });
      const authUrl = new URL(oauthServiceUrl(portalBase, 'app-auth'));
      authUrl.searchParams.set('appId', appId);
      authUrl.searchParams.set('redirectUri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('responseType', 'code');
      res.status(200).json({ authorizationUrl: authUrl.toString() });
    } catch {
      res.status(500).json({ error: 'Unable to start login.' });
    }
  });

  router.get('/auth/callback', async (req, res) => {
    const cookies = readCookies(req);
    const rawNonceCookie = cookies.get(NONCE_COOKIE);
    const nonceCookieOrigin = (() => {
      try { return (decodeBase64UrlJson(rawNonceCookie ?? '') as { origin?: unknown }).origin; } catch { return undefined; }
    })();
    const clearOrigin = typeof nonceCookieOrigin === 'string' && parseFrontendOrigin(nonceCookieOrigin)
      ? nonceCookieOrigin
      : publicRequestOrigin(req) ?? 'http://localhost';
    appendCookie(res, NONCE_COOKIE, '', clearOrigin, { httpOnly: true, clear: true });
    try {
      const requestPath = new URL(`http://callback.invalid${req.originalUrl}`).pathname;
      if (requestPath !== CALLBACK_PATH || !rawNonceCookie) throw new Error('Invalid callback path or nonce');
      const bound = decodeBase64UrlJson(rawNonceCookie) as { origin?: unknown; nonce?: unknown };
      const stateText = req.query.state;
      const code = req.query.code;
      if (typeof stateText !== 'string' || typeof code !== 'string' || code.length < 1 || code.length > 4096) throw new Error('Invalid callback parameters');
      const state = decodeBase64UrlJson(stateText) as { redirectUri?: unknown; nonce?: unknown };
      if (typeof bound.origin !== 'string' || typeof bound.nonce !== 'string' || typeof state.nonce !== 'string' || typeof state.redirectUri !== 'string') {
        throw new Error('Invalid callback state');
      }
      const origin = parseFrontendOrigin(bound.origin);
      if (!origin || !constantTimeTextEqual(bound.nonce, state.nonce) || state.redirectUri !== callbackUrl(origin)) throw new Error('State binding mismatch');
      const redirect = new URL(state.redirectUri);
      if (redirect.pathname !== CALLBACK_PATH || redirect.origin !== origin || redirect.search || redirect.hash) throw new Error('Invalid redirect URI');
      const observedOrigin = publicRequestOrigin(req);
      if (observedOrigin && observedOrigin !== origin) throw new Error('Callback origin mismatch');

      const appId = requiredEnv('MANUS_PROJECT_ID');
      const apiBase = requiredEnv('MANUS_OAUTH_API_URL');
      const exchangeResponse = await fetch(oauthServiceUrl(apiBase, 'webdev.v1.WebDevAuthPublicService/ExchangeToken'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ clientId: appId, grantType: 'authorization_code', code, redirectUri: state.redirectUri }),
        signal: AbortSignal.timeout(12000),
      });
      if (!exchangeResponse.ok) throw new Error('Token exchange failed');
      const exchange = await exchangeResponse.json() as { accessToken?: unknown };
      if (typeof exchange.accessToken !== 'string' || !exchange.accessToken) throw new Error('Missing access token');
      const userResponse = await fetch(oauthServiceUrl(apiBase, 'webdev.v1.WebDevAuthPublicService/GetUserInfo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ accessToken: exchange.accessToken }),
        signal: AbortSignal.timeout(12000),
      });
      if (!userResponse.ok) throw new Error('Identity lookup failed');
      const identity = await userResponse.json() as { openId?: unknown; name?: unknown; email?: unknown };
      if (typeof identity.openId !== 'string' || identity.openId.length < 1 || identity.openId.length > 191) throw new Error('Invalid identity');
      const displayName = typeof identity.name === 'string' ? identity.name.slice(0, 255) : null;
      const email = typeof identity.email === 'string' ? identity.email.slice(0, 320) : null;
      const user = await upsertUser(identity.openId, displayName, email);
      const sessionToken = randomBytes(32).toString('base64url');
      const tokenHash = sha256(sessionToken);
      const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString().slice(0, 19).replace('T', ' ');
      await database().execute(
        'INSERT INTO app_sessions (token_hash, user_id, expires_at, frontend_origin) VALUES (?, ?, ?, ?)',
        [tokenHash, user.id, expiresAt, origin],
      );
      appendCookie(res, SESSION_COOKIE, sessionToken, origin, { httpOnly: true, maxAgeSeconds: SESSION_TTL_SECONDS });
      appendCookie(res, CSRF_COOKIE, randomBytes(32).toString('base64url'), origin, { maxAgeSeconds: SESSION_TTL_SECONDS });
      res.redirect(302, `${origin}${DASHBOARD_PATH}`);
    } catch {
      sendLoginFailure(res);
    }
  });

  router.get('/auth/session', async (req, res) => {
    try {
      const origin = parseFrontendOrigin(req.get('X-Frontend-Origin'));
      if (!origin) {
        res.status(400).json({ error: 'X-Frontend-Origin is required.' });
        return;
      }
      let csrfToken = readCookies(req).get(CSRF_COOKIE);
      if (!csrfToken || !/^[A-Za-z0-9_-]{32,128}$/.test(csrfToken)) csrfToken = randomBytes(32).toString('base64url');
      appendCookie(res, CSRF_COOKIE, csrfToken, origin, { maxAgeSeconds: SESSION_TTL_SECONDS });
      const auth = await authenticate(req, origin);
      if (!auth) {
        res.status(200).json({ user: null });
        return;
      }
      res.status(200).json({ user: { id: auth.user.id, displayName: auth.user.displayName, email: auth.user.email } });
    } catch {
      res.status(503).json({ error: 'Session unavailable.' });
    }
  });

  router.get('/me/workspace', async (req, res) => {
    try {
      const origin = parseFrontendOrigin(req.get('X-Frontend-Origin'));
      if (!origin) { res.status(400).json({ error: 'X-Frontend-Origin is required.' }); return; }
      const auth = await authenticate(req, origin);
      if (!auth) { res.status(401).json({ error: 'Authentication required.' }); return; }
      const [rows] = await database().execute<RowDataPacket[]>(
        'SELECT revision, schema_version, payload FROM user_workspaces WHERE user_id = ? LIMIT 1',
        [auth.user.id],
      );
      const row = rows[0] as (RowDataPacket & { revision: number; schema_version: number; payload: unknown }) | undefined;
      if (!row) { res.status(200).json({ workspace: makeWorkspace(), revision: 0 }); return; }
      if (row.schema_version !== 1) { res.status(409).json({ error: 'Workspace schema is unsupported.' }); return; }
      const workspace = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      res.status(200).json({ workspace, revision: Number(row.revision) });
    } catch {
      res.status(503).json({ error: 'Workspace unavailable.' });
    }
  });

  router.put('/me/workspace', async (req, res) => {
    try {
      const origin = parseFrontendOrigin(req.get('X-Frontend-Origin'));
      if (!origin || getOriginHeader(req) !== origin) { res.status(403).json({ error: 'Origin check failed.' }); return; }
      const auth = await authenticate(req, origin);
      if (!auth) { res.status(401).json({ error: 'Authentication required.' }); return; }
      if (!csrfTokenIsValid(req)) { res.status(403).json({ error: 'CSRF check failed.' }); return; }
      const parsed = workspacePutSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ error: 'Invalid workspace.' }); return; }
      const serialized = JSON.stringify(parsed.data.workspace);
      if (Buffer.byteLength(serialized, 'utf8') > 1024 * 1024) { res.status(413).json({ error: 'Workspace is too large.' }); return; }
      const { expectedRevision } = parsed.data;
      const db = database();
      if (expectedRevision === 0) {
        try {
          await db.execute(
            'INSERT INTO user_workspaces (user_id, revision, schema_version, payload) VALUES (?, 1, 1, ?)',
            [auth.user.id, serialized],
          );
          res.status(200).json({ revision: 1 });
        } catch (error) {
          if ((error as { code?: string }).code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Workspace revision conflict.' }); return; }
          throw error;
        }
        return;
      }
      const [result] = await db.execute<ResultSetHeader>(
        'UPDATE user_workspaces SET payload = ?, schema_version = 1, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revision = ?',
        [serialized, auth.user.id, expectedRevision],
      );
      if (result.affectedRows !== 1) { res.status(409).json({ error: 'Workspace revision conflict.' }); return; }
      res.status(200).json({ revision: expectedRevision + 1 });
    } catch {
      res.status(503).json({ error: 'Workspace unavailable.' });
    }
  });

  async function requireMutationAuth(req: Request, res: Response): Promise<{ auth: AuthContext; origin: string } | null> {
    const origin = parseFrontendOrigin(req.get('X-Frontend-Origin'));
    if (!origin || getOriginHeader(req) !== origin) { res.status(403).json({ error: 'Origin check failed.' }); return null; }
    const auth = await authenticate(req, origin);
    if (!auth) { res.status(401).json({ error: 'Authentication required.' }); return null; }
    if (!csrfTokenIsValid(req)) { res.status(403).json({ error: 'CSRF check failed.' }); return null; }
    return { auth, origin };
  }

  router.post('/auth/logout', async (req, res) => {
    try {
      const context = await requireMutationAuth(req, res);
      if (!context) return;
      if (context.auth.tokenHash) await database().execute('DELETE FROM app_sessions WHERE token_hash = ?', [context.auth.tokenHash]);
      appendCookie(res, SESSION_COOKIE, '', context.origin, { httpOnly: true, clear: true });
      appendCookie(res, CSRF_COOKIE, '', context.origin, { clear: true });
      res.status(204).end();
    } catch {
      res.status(503).json({ error: 'Logout unavailable.' });
    }
  });

  router.delete('/account', async (req, res) => {
    try {
      const context = await requireMutationAuth(req, res);
      if (!context) return;
      const db = database();
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM user_workspaces WHERE user_id = ?', [context.auth.user.id]);
        await connection.execute('DELETE FROM app_sessions WHERE user_id = ?', [context.auth.user.id]);
        await connection.execute('DELETE FROM app_users WHERE id = ?', [context.auth.user.id]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      appendCookie(res, SESSION_COOKIE, '', context.origin, { httpOnly: true, clear: true });
      appendCookie(res, CSRF_COOKIE, '', context.origin, { clear: true });
      res.status(204).end();
    } catch {
      res.status(503).json({ error: 'Account deletion unavailable.' });
    }
  });

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : 400;
    res.status(status >= 400 && status < 500 ? status : 400).json({ error: 'Invalid request.' });
  });

  router.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  return router;
}

export function mountApi(app: Express): void {
  app.use('/api', createApiRouter());
}

export async function createApp(): Promise<Express> {
  const app = express();
  mountApi(app);
  if (process.env.NODE_ENV !== 'production') {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<{ createServer: (options: unknown) => Promise<{ middlewares: RequestHandler }> }>;
    const viteModule = await dynamicImport('vite');
    const vite = await viteModule.createServer({
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  }
  return app;
}

async function start(): Promise<void> {
  const app = await createApp();
  const port = Number.parseInt(process.env.PORT || '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  app.listen(port, '0.0.0.0', () => console.log(`CareerPath API listening on 0.0.0.0:${port}`));
}

const invokedAsMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedAsMain) {
  void start().catch((error: unknown) => {
    console.error('Server startup failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  });
}
