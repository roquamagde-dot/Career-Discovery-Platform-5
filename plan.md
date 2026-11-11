# Career Discovery Platform — Full-stack MVP Plan

## Approved scope
Extend the existing English-first Career Discovery MVP with an authenticated API and account-owned persistence. Use the project's Manus-managed server and MySQL database, plus Manus OAuth (the default because no provider was specified). Do not ask the user to provide API keys: OAuth and the managed database are supplied by the platform. The public release remains disabled; implementation and testing stay in the private project Preview.

Keep React + TypeScript + Vite for the browser app and use Express + TypeScript for the API. Use `mysql2` with parameterized SQL and checked-in, versioned, additive SQL migrations. The platform supplies `DATABASE_URL` at server runtime. Store a minimal application user keyed by Manus `openId`, database-backed application sessions as hashed random tokens, and one private workspace row per user. The workspace contains that user's profile, consent, assessment answers, evidence notes and task tags, report history, and roadmap progress. API ownership always comes from the validated session; never accept a user ID from a browser request as authority. Do not store OAuth access tokens.

## Authentication and security
Use Manus OAuth rather than inventing email/password login or an unspecified third-party provider. Browser authorization begins with a short-lived, single-use nonce bound to the browser; verify it before exchanging the code. Preserve the actual browser-visible origin in the callback and redirect only to a fixed in-app location. Use the exact `webdev_app_session` cookie name so Preview auto-login can work. Validate a Preview-injected platform JWT with `MANUS_JWT_SECRET`, HS256, expiry, `appId === MANUS_PROJECT_ID`, and a valid `openId`; resolve that identity to an application user. Normal application sessions use a random opaque token whose hash is stored in MySQL. Store no provider access or refresh tokens.

Application session and OAuth cookies are HTTP-only. For public HTTPS Preview, use `SameSite=None; Secure`; handle plain-HTTP local development separately. Derive cookie security from the browser-visible origin supplied by the frontend, never from `NODE_ENV` or the server's internal request scheme. Protect cookie-authenticated mutations with a same-origin/CSRF check. Validate request bodies and use parameterized SQL. Provide logout and an explicitly confirmed account-data deletion flow that removes only the authenticated user's workspace, sessions, and account record.

The previous browser-only prototype data is not uploaded automatically. It remains in the user's browser until separately cleared. Do not test with real personal answers or seed fake user records. The managed development and published application share one database; run only additive schema migrations, make no destructive database changes, and do not claim database backup or recovery capabilities not provided by the platform.

## Product experience
Retain the landing, method/limitations, privacy, onboarding, assessment, evidence review, report, career, roadmap, dashboard, and settings flows. Add a real login screen and logged-in identity/logout controls. Protect private profile, assessment, report, roadmap, and settings pages behind validated application authentication; show a logged-out state rather than a fake Preview user. Persist the full workspace to the account API, so a user's data remains available after returning from another browser session, while never exposing another account's records.

The assessment and occupational examples remain exploratory drafts, not a validated instrument or verified market database. Never present the product as diagnostic, scientifically validated, or a predictor/guarantee of success. Do not show compatibility percentages or invent unsupported market, salary, licensing, or education claims. Keep interest, self-perception, user-linked evidence, task/skill links, work style, work values, development gaps, and market context distinct. A user-selected task tag contributes only after the note and tag are confirmed and remains self-reported, not verified ability.

## API and serving
Implement `GET /api/health` as an unauthenticated health check; `/api/auth/session`, `/api/auth/start`, `/api/auth/callback`, and `/api/auth/logout`; authenticated `GET/PUT /api/me/workspace`; and authenticated `DELETE /api/account`. Validate the workspace schema and version before saving. The API derives account identity from a validated cookie and returns only that account's data.

For Preview, Express listens on `PORT` (default 3000) and serves the Vite development middleware alongside API routes. Keep the Vite static build contract for `dist`. For a future hybrid publication, the API container is routed at `/api/*` and the static output at the SPA fallback, with the health endpoint unauthenticated. Commit a Dockerfile and matching `deploy`/`routes` declarations so the server is buildable, but do not publish or turn on auto-publishing in this task.

## Design
Keep the approved **Career editorial** style: warm paper and ink-like navy, signal-jade actions, restrained amber for uncertainty; left-aligned reading columns, an assessment progress rail, evidence labels, and paper-like cards. Maintain English/LTR for this release and keep layout/content straightforward to localize. Keep motion restrained and respect reduced-motion preferences.

## Project structure

- `src/main.tsx`, `src/App.tsx` — frontend bootstrap, routes, shell, and auth guards.
- `src/components/` and `src/pages/` — shared UI and product screens, including login.
- `src/data/content.ts` — draft questions, user-selectable task tags, career examples, and roadmap stages.
- `src/features/assessment/engine.ts` and `src/features/matching/matcher.ts` — deterministic assessment and explainable matching logic.
- `src/lib/api.ts`, `PrototypeContext.tsx`, and `storage.ts` — API client, authenticated frontend state, typed payloads, and legacy-local-data detection/clear only; no automatic local-to-server migration.
- `src/styles/global.css` — design tokens, responsive layout, and accessibility behavior.
- `server/index.ts`, `server/auth.ts`, `server/db.ts`, `server/routes/` — Express entrypoint, OAuth/session validation, database access, and owner-scoped API routes.
- `migrations/` — additive SQL schema and migration tracking for users, sessions, and per-user workspace.
- `Dockerfile`, `public/manus-routes.json` — server image contract and website-page manifest. API endpoints are not page-manifest routes.

## Material constraints
The source plan still leaves assessment construct/scoring review, piloting, occupational source coverage/licensing, production retention, jurisdictional privacy/legal review, and launch monitoring unresolved. This build does not silently approve those gates. The database is shared between managed development and any future publication; the site remains unpublished. No external job-data, AI, email, or other third-party API is connected. Account data is now server-stored, so privacy copy must no longer imply that all user data exists only in local browser storage. Do not enter highly sensitive information in this prototype.
