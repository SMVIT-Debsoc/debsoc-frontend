# Technology Stack

**Analysis Date:** 2026-07-02

## Languages

**Primary:**
- TypeScript 5.x - All application frontend, backend services, API routes, models, and test code.

**Secondary:**
- JavaScript / ESM - Configuration files (e.g., `eslint.config.mjs`, `postcss.config.mjs`).

## Runtime

**Environment:**
- Node.js (LTS version recommended, v20+ based on `@types/node: ^20`) - Runs Next.js server, build scripts, and test runner.

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.x - Full-stack React framework (App Router)
- React 19.2.x - UI library

**Testing:**
- Node.js Native Test Runner (`node --test`) - Fast, zero-dependency unit and integration test execution.
- `--experimental-strip-types` - Executes TypeScript tests directly without manual build/transpile steps.

**Build/Dev:**
- TypeScript 5.x - Static typing and compilation checks
- PostCSS 8.x - CSS processor
- TailwindCSS 4.x - Utility-first styling framework

## Key Dependencies

**Critical:**
- `@prisma/client` 7.7.x - Database query builder (ORM) and type safety.
- `next-auth` 4.24.x - Authentication orchestration.
- `@next-auth/prisma-adapter` 1.0.x - NextAuth adapter for Prisma database storage.
- `@prisma/adapter-pg` 7.7.x / `pg` 8.13.x - PostgreSQL adapter for connection pooling.
- `zod` 4.3.x - Runtime schema validation for API routes and payloads.

**UI & Styling:**
- `tailwindcss` 4.2.x / `@tailwindcss/postcss` 4.2.x - Modern styling engine.
- `framer-motion` 12.38.x - UI animations.
- `gsap` 3.14.x / `@gsap/react` 2.1.x - Premium high-performance animations.
- `lucide-react` 1.7.x - Clean vector iconography.
- `react-hot-toast` 2.6.x - Contextual notifications and feedback toasts.
- `tailwind-merge` 3.5.x / `clsx` 2.1.x - CSS class merging helper.

**Utility & Security:**
- `bcryptjs` 3.0.x - Secure password hashing.
- `dotenv` 17.4.x - Environment variables loader.

## Configuration

**Environment:**
- Local `.env` (gitignored) - Environment configurations.
- Key configurations:
  - `DATABASE_URL` - PostgreSQL database connection string.
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials.
  - `NEXTAUTH_URL` / `NEXTAUTH_SECRET` - NextAuth routing and encryption secret.
  - `TECH_HEAD_SECRET_KEY` - Override token for Tech Head promotion.
  - `DEV_AUTH_BYPASS` / `DEV_AUTH_BYPASS_ROLE` / `DEV_AUTH_BYPASS_VERIFIED` - Development local auth bypass options.
  - `NEXT_PUBLIC_VIRTUAL_OC` - URL for the virtual assistant/moderator integration.
  - `NEXT_PUBLIC_HIRING_WEBHOOK_URL` - Webhook URL for Google Sheets/Forms hiring pipeline.

**Build:**
- `tsconfig.json` - TypeScript compiler parameters (target `ES2017`, module resolution `bundler`, paths `@/*` maps to `./*`).
- `next.config.ts` - Next.js compilation, optimization, and server configuration.
- `postcss.config.mjs` - PostCSS plugin configurations (Tailwind CSS).
- `eslint.config.mjs` - ESLint configuration using Next.js vitals and TypeScript rules.

## Platform Requirements

**Development:**
- Windows/macOS/Linux with Node.js v20+ and npm 10+ installed.
- PostgreSQL database accessible (e.g., Neon serverless instance).

**Production:**
- Serverless Node.js host (e.g., Vercel, AWS Lambda, or a Node-capable VPS/container environment).
- Managed PostgreSQL database (Neon, AWS RDS, Supabase, etc.).

---

*Stack analysis: 2026-07-02*
*Update after major dependency changes*
