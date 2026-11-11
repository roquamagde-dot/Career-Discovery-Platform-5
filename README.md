# Career Discovery Platform — Full-stack MVP

An English-first, responsive career-exploration application built with React, TypeScript, and Vite, with an Express API, Manus OAuth login, and a Manus-managed MySQL database. Each authenticated Manus identity receives a separate application workspace for profile, assessment answers, evidence review, saved reports, and roadmap progress.

## Run in Manus Cloud Preview

The project uses Node.js 22+ and pnpm 11.25.0. Its Cloud development environment supplies `DATABASE_URL`, `MANUS_PROJECT_ID`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_OAUTH_API_URL`, and `MANUS_JWT_SECRET` at runtime. Do not copy these values into source files or browser code. The first local start requires `pnpm install` and the one-time additive schema migration (`pnpm db:migrate`); then run `pnpm dev` on port 3000. `pnpm check` runs TypeScript diagnostics and `pnpm build` creates the Vite static frontend. The Express dev server mounts Vite middleware and `/api` endpoints on the same port.

## Data and authentication boundaries

Sign-in uses Manus OAuth; no external API key, email/password provider, job-market API, AI provider, or email service is configured. The application stores a minimal user record keyed by OAuth `openId`, a hash of its own opaque session token, and one versioned workspace payload per account. API ownership comes from the validated server session, not a user ID submitted by the browser. OAuth access and refresh tokens are not persisted.

The managed development and any future published application share the same project MySQL database. Migrations are additive and tracked. Do not insert synthetic or real user records for testing, and do not run destructive schema changes. Existing answers from the earlier browser-only prototype are not uploaded automatically; they remain in the browser until separately cleared in Settings. The application does not implement account export or a database backup workflow.

The site remains unpublished. Server/database capabilities are enabled, but enabling them does not publish the application. The questions and career examples are exploratory drafts, not a validated assessment or a verified labor-market guide. Do not enter highly sensitive information. Assessment construct/scoring review, occupational sourcing and licenses, retention, privacy/legal and security review, and launch monitoring remain open before public use.
