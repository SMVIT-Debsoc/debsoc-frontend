# External Integrations

**Analysis Date:** 2026-07-02

## Verification Status

- Overall status: Mostly verified
- Trust level: good for integration awareness, but env-backed details should still be checked at use time
- Verified from repo:
  - NextAuth usage
  - Google OAuth environment dependence
  - database via Prisma/PostgreSQL
  - env-driven public integrations are referenced
- Needs re-check:
  - exact deployment target assumptions
  - exact current usage pattern of each external URL or iframe integration
- Use rule:
  - safe as an integration map
  - confirm current consuming file before editing an integration path

## APIs & External Services

**Outbound Webhooks / Form Pipelines:**
- Google Sheets / Apps Script Webhook - Used in the recruitment/hiring workflow to post successful applications.
  - Client/Method: `fetch` (POST JSON) in `components/HiringPopup.tsx`
  - URL Config: `NEXT_PUBLIC_HIRING_WEBHOOK_URL` env var

**AI / Virtual Assistant Integration:**
- Virtual OC Assistant - Web application integration for a virtual debate moderator/assistant.
  - Client/Method: Embedded iframe or API client utilizing `NEXT_PUBLIC_VIRTUAL_OC`
  - URL Config: `NEXT_PUBLIC_VIRTUAL_OC` env var

## Data Storage

**Databases:**
- PostgreSQL on Neon (Serverless AWS) - Primary relational database storage.
  - Connection: Connection pooling via Neon proxy (`DATABASE_URL` env var).
  - Client: Prisma ORM (`@prisma/client`, `@prisma/adapter-pg` pool connection).
  - Migrations: Managed via Prisma CLI under `prisma/migrations/`.

**Caching:**
- No external cache provider (like Redis) is currently configured. In-memory data structures are loaded once during generation loops.

## Authentication & Identity

**Auth Provider:**
- NextAuth.js (v4) - Orchestrates user authentication, JWT-based sessions, and OAuth flows.
  - Implementation: Configuration in `auth.ts`, routes handled via `app/api/auth/[...nextauth]/route.ts`.
  - Token storage: Encrypted JWTs stored in browser cookies.
  - Session Management: JWT strategy configured via NextAuth secret.

**OAuth Integrations:**
- Google OAuth - Primary method for user registration and login.
  - Credentials: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (configured in Google Developer Console).
  - Callback: NextAuth sign-in callback checks if the email is registered and verified within the database (`TechHead`, `President`, `cabinet`, or `Member` tables).

## CI/CD & Deployment

**Hosting Target:**
- Typically deployed to Vercel or a serverless platform integrated with GitHub.
- Database hosted on Neon serverless PostgreSQL.

## Environment Configuration

**Development Environment:**
- Configured using a local `.env` file (gitignored).
- Local-only auth bypass flag:
  - `DEV_AUTH_BYPASS` - Enable to skip Google OAuth verification during local dev/test.
  - `DEV_AUTH_BYPASS_ROLE` - Sets session role (e.g., `techhead`).
  - `DEV_AUTH_BYPASS_VERIFIED` - Sets user verification state.

**Production Environment:**
- Environment variables configured on the hosting provider (e.g., Vercel Dashboard).
- Real secrets are never committed to version control.

---

*Integration audit: 2026-07-02*
*Update when adding/removing external services or changing env-backed integrations*


