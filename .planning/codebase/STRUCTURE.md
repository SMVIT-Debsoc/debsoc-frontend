# Codebase Structure

**Analysis Date:** 2026-07-02

## Verification Status

- Overall status: `Mostly verified`
- Trust level: safe for orientation, but exact file paths should still be re-checked before edits
- Use rule:
  - use this file to quickly find the right area
  - verify exact files with the repo before changing code

## Top-Level Layout

- `app/` - Next.js app router pages, layouts, and API routes
- `components/` - reusable frontend components
- `components/pairing/` - pairing dashboard, workspace, leaderboard, and participant-facing pairing UI
- `lib/server/` - server-side logic grouped by domain
- `prisma/` - schema and migrations
- `types/` - shared TypeScript contracts
- `docs/` - product, architecture, and pairing specs
- `.planning/` - lightweight working memory and repo summaries

## Verified App Areas

- `app/(auth)/`
- `app/api/`
- `app/dashboard/`
- `app/debate-timer/`
- `app/equity/`
- `app/gallery/`
- `app/session/`
- `app/unverified/`

## Verified Component Areas

- `components/pairing/`
- `components/TechHeadDashboard/`
- `components/ui/`
- shared landing-page sections like `Navbar.tsx`, `Footer.tsx`, `Home.tsx`

## Verified Server Areas

- `lib/server/eval/`
- `lib/server/pairing/`
- `lib/server/realtime/`
- `lib/server/repositories/`
- `lib/server/scoring/`
- `lib/server/sessions/`
- `lib/server/validations/`
- shared server helpers like `guards.ts`, `http.ts`, `roles.ts`, `prisma.ts`

## Useful Verified Files

- `components/pairing/SessionWorkspace.tsx`
- `components/pairing/Leaderboards.tsx`
- `components/pairing/MyScoring.tsx`
- `lib/server/repositories/pairing-repository.ts`
- `prisma/schema.prisma`
- `auth.ts`
- `package.json`
- `tsconfig.json`

## Add-New-Code Guidance

- Pairing UI work: usually `components/pairing/`
- General app pages: `app/**`
- API routes: `app/api/**/route.ts`
- Server business logic: `lib/server/{domain}/`
- Database changes: `prisma/schema.prisma` plus migrations
- Shared contracts: `types/**`

---

*Trimmed to verified structure facts and working guidance.*
