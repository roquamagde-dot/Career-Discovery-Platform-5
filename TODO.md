# Full-stack MVP outcomes and acceptance criteria

The accepted product scope now includes a private authenticated API and account-owned MySQL persistence. The source plan's psychometric, occupational sourcing, privacy/legal, and public production launch gates remain open and are not represented as completed by this build.

## [x] 1. English-first global product shell and accessible navigation
- The user-facing interface is in English and uses left-to-right layout; preserve a structure that can be localized later.
- Present the product as career discovery and developmental guidance, not a clinical or psychological diagnostic tool.
- Do not claim that the assessment is scientifically validated, psychometrically proven, or a predictor/guarantee of employment or career success.
- Provide responsive navigation and readable pages with semantic headings, labels, visible keyboard focus, adequate contrast, and reduced-motion support.
- Keep authentication screens out of the original local-only prototype; the full-stack build adds a real login screen and must not imply that an account exists until login succeeds.

## [x] 2. Landing, method, limitations, and privacy information
- The landing page explains the value proposition, how discovery works, a primary start action, and privacy reassurance without promising one perfect career.
- The method page explains what is explored and what is not measured, and that interests, self-perceived skills, demonstrated evidence, work style, and work values are distinct signals.
- Make limitations visible: draft questions and recommendations are exploratory, not validated; interest is not ability; confidence is not demonstrated performance; recommendations are hypotheses rather than labels.
- The privacy page accurately states that assessment/profile/evidence/progress data is stored server-side in the authenticated user's own workspace, not in a public or shared user workspace; it does not claim that the product is browser-only, backed up, or production-secure.
- Disclose that the project-managed development and any future published application use the same database, and that routine platform/CDN request data may still exist.
- Mark career, resource, market, and licensing examples as illustrative or not verified unless reliable source evidence is actually included.

## [x] 3. Onboarding and consent
- Explain why information is requested and allow optional profile context to be skipped where possible.
- Let the user choose broad context such as education, activities, interests, and optional target location without inferring ability from demographic identity or sensitive personal attributes.
- Require an affirmative user action before beginning the assessment and explain its purpose, limitations, and pause/resume behavior.

## [x] 4. Deterministic assessment and session controls
- Present one primary question at a time and show informative, non-pressuring progress.
- Include the ten draft anchor prompts in the supplied specification across five dimensions: two interests, two self-perceived skill, two demonstrated ability, two work-style, and two work-value prompts.
- Preserve the distinction between interest, confidence, concrete experience, work style, and values; do not convert confidence into competence.
- Select any follow-up deterministically from a defined evidence or exploration need; do not use AI to set scores, invent evidence, or create arbitrary scored question text.
- Explain why a follow-up is being asked when it may otherwise feel repetitive or personal.
- Permit skip, pause, resume, and answer correction, including eligible follow-up answers. Restore the last saved answer after resume and do not repeat a committed response.
- Persist session state to the authenticated account's own workspace; do not silently use an unauthenticated shared profile.

## [x] 5. Evidence review and correction
- Keep each candidate evidence note traceable to the answer from which it was derived.
- Allow the user to confirm, edit, or dispute an interpretation before it is used in the report.
- Separate user-reported facts from system inferences and external occupational data using distinct visual treatments and plain-language labels.
- Do not attribute a group outcome to the user without an explicit personal-action example.
- Use cautious evidence language: general claims are self-perception only; specific examples may support a skill hypothesis; repeated self-reported examples provide more context and may strengthen a hypothesis but are not independent certification.
- Let users optionally choose a task/skill connection for their own written example. Use that possible connection in matching only after they confirm both the note and tag; label it as self-reported, never as a verified skill.

## [x] 6. Discovery report and uncertainty
- Present the user's profile across interests, self-perceived skills, demonstrated evidence, work style, and work values.
- Separate evidence from inference and include original evidence notes, limitations, and actionable next steps.
- Avoid false precision: do not display numerical compatibility percentages or unsupported numeric ability scores.
- Show provisional/needs-more-evidence status when evidence coverage is weak; insufficient evidence must not be hidden.

## [x] 7. Explainable career exploration
- Present no more than three supported career directions; return fewer than three when the available evidence is insufficient rather than inventing a match to fill the display.
- Explain for each direction why it may be worth exploring, which user signals support it, what development gaps remain, and relevant limitations.
- Keep interest alignment, demonstrated-evidence status, user-confirmed task/skill links, work-style compatibility, and work-values compatibility separate in the underlying rules and explanations. Do not infer occupational skills from unstructured example text.
- Treat teachable skill gaps as development needs, not automatic exclusions; only use a hard eligibility flag for a verified mandatory constraint relevant to a selected jurisdiction.
- Separate career fit from market opportunity and entry feasibility. Show market, licensing, and country-specific data as `Not verified` when no traceable current source is supplied.
- Do not present recommendations as fixed labels or predictions of success.

## [ ] 8. Career details, learning roadmaps, resources, and experiments
- Career detail pages describe sample tasks, related skills, work environment, and geographic scope without inventing current vacancies, salary, licensing, or remote-work claims.
- A roadmap has ordered learning stages, objectives, resources, and practical low-risk experiments; sample content is visibly labeled illustrative/unverified.
- Let the user choose and track progress without implying that a single career path is mandatory.
- Any occupational claim presented as verified must have a traceable source and verification date; otherwise label it not verified or omit it.
- Open for a later source-reviewed build: no named course/provider or official career-resource link is verified in this prototype; the learning stage explicitly discloses that and asks the user to select a trusted resource.

## [ ] 9. Dashboard, history, progress, and settings
- Provide a dashboard with a five-signal profile summary, current/saved report state, active roadmap/progress, example-review entry point, and an entry point to reassessment to the extent supported by the authenticated account.
- Preserve the user's progress and prior report snapshots in that user's database workspace when returning in another session; never return another account's workspace.
- Provide clear account/privacy controls and an explicitly confirmed action to delete the authenticated user's application workspace, saved reports, sessions, and application account record.
- Keep any old local-only prototype data on the current browser separate; do not upload it automatically during login. Explain this and let the user clear the old local draft.
- Do not claim account export, cloud backups, or server-side deletion beyond the specific application deletion flow implemented.

## [ ] 10. Build handoff and release boundary
- Keep assessment, matching, authentication, API, migrations, and data modular and versioned so later approved data sourcing and reviewed question content do not couple to presentation components.
- Keep `/manus-routes.json` synchronized with all implemented website page routes, including dynamic patterns, and ensure it is served as JSON; do not include API endpoints as page routes.
- Keep a static frontend build plus a server container/deploy contract and route `/api/*` to the server, with the public page routes served from static output. The health path is unauthenticated.
- Do not publish publicly as part of this task. A Preview or saved project version is not a public production release, and auto-publishing must remain disabled.
- Keep the source plan's open product-owner and specialist gates unresolved: assessment construct/item/scoring review, pilot, occupation dataset and licenses, market-country coverage, data retention, jurisdictional legal review, security review, and production monitoring.

## [ ] 11. Manus OAuth login and application sessions
- Since no provider was selected, use Manus OAuth; do not build email/password authentication or another provider without explicit approval.
- Start authorization with a short-lived, single-use nonce bound to the browser; verify state/nonce before exchanging the code. Use the actual browser-visible origin, and redirect only to a fixed in-app path, never an arbitrary user-supplied URL.
- Preserve the exact `webdev_app_session` cookie name. Support Preview's injected platform JWT only after validating it with `MANUS_JWT_SECRET`, HS256, expiry, `appId === MANUS_PROJECT_ID`, and a valid `openId`, then resolve that identity to an application user.
- Use a separate random opaque application session for normal OAuth login; store only its cryptographic hash in the database and do not store OAuth access/refresh tokens.
- Keep the session cookie HTTP-only and use `SameSite=None; Secure` for HTTPS Preview; handle plain-HTTP local development separately. Determine cookie security from the frontend origin, never `NODE_ENV` or internal `req.secure`.
- Show logged-out state until real authentication succeeds. Do not invent a Preview user or bypass auth under a development flag. Provide logout and same-origin/CSRF protection for cookie-authenticated mutations.

## [ ] 12. MySQL persistence and account ownership
- Use the Manus-managed MySQL database via runtime `DATABASE_URL`; no third-party API key or external database is requested.
- Store a unique application user for each authenticated provider `openId`, hashed session records, and one account-owned workspace containing that user's profile, consent, answers, evidence review/task tags, report history, and roadmap progress.
- Derive account ownership from the validated server session. Do not accept a browser-supplied user ID as authority; every workspace read/write/delete must be scoped to the authenticated account.
- Validate request payloads and use parameterized SQL. Keep migrations committed, idempotent, additive, and recorded in migration history.
- Development and any future published app share this database. Do not create sample users or write/delete test account data in it; use code/type checks and non-mutating API checks. Do not perform destructive schema operations.
- The explicit account deletion flow may delete only the currently authenticated user's application sessions and workspace, after in-app confirmation; it must not delete other users or browser data.

## [ ] 13. Authenticated API and runtime
- Provide an unauthenticated health endpoint; provide authorization start/callback/session/logout endpoints; and authenticated current-user workspace read/update and own-account deletion endpoints.
- Validate inputs and handle unauthorized, invalid-state, CSRF, not-found, and database-unavailable cases without leaking another user's data or internal tokens.
- In development, serve Express API and Vite frontend from the configured port. For the future hybrid release, route `/api/*` to the container and page requests to the static SPA output; keep the health path public to the platform probe.
- No external job API, AI provider, email service, or other API key is required for this approved slice.
