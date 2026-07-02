# Codebase Structure

**Analysis Date:** 2026-07-02

## Directory Layout

```
debsoc-frontend/
├── app/                  # Next.js App Router (pages and API routes)
│   ├── (auth)/           # Auth flow pages (e.g., login)
│   ├── api/              # API Route Handlers (transport only)
│   ├── dashboard/        # User and admin dashboards
│   ├── debate-timer/     # Debate timer views
│   ├── equity/           # Equity policy views
│   ├── gallery/          # Club gallery views
│   ├── session/          # Session coordination pages
│   └── unverified/       # Landing page for unverified registrations
├── components/           # Reusable React components
│   ├── TechHeadDashboard/# Tech Head admin component
│   ├── pairing/          # Pairing lifecycle client components
│   └── ui/               # Standard design system components (buttons, input)
├── lib/                  # Application shared services and helpers
│   └── server/           # Backend server-only logic
│       ├── eval/         # Engine evaluation and synthetic replays
│       ├── pairing/      # Core pairing generation and scoring modules
│       ├── realtime/     # Realtime WebSocket distribution layer
│       ├── repositories/ # Prisma database access abstractions
│       ├── scoring/      # Post-session scoring and updates
│       ├── sessions/     # Session operations and attendance logic
│       └── validations/  # Zod schema definitions
├── prisma/               # Database definitions
│   ├── migrations/       # SQL migration logs
│   └── schema.prisma     # Prisma database schema definition
├── types/                # Shared TypeScript type definitions
└── public/               # Static assets (images, icons)
```

## Directory Purposes

**app/api/**
- Purpose: HTTP request entry points (thin transport layer).
- Contains: `route.ts` files mapping URLs to services.
- Key files: `app/api/pairing/generate/route.ts`, `app/api/realtime/socket/route.ts`.

**components/pairing/**
- Purpose: Frontend views and flows managing the pairing workflow.
- Contains: React components (*.tsx) for dashboards, panels, and rosters.
- Key files: `SessionWorkspace.tsx`, `MyScoring.tsx`, `Leaderboards.tsx`.

**lib/server/pairing/**
- Purpose: The core logic of the pairing system and engine.
- Contains: Scoring formulas, rule checks, selection logic, and state management.
- Key files: `engine.ts`, `proposal-scorer.ts`, `candidate-generator.ts`.

**lib/server/repositories/**
- Purpose: Eagerly encapsulates database access for all server domains.
- Contains: Repository functions implementing database calls.
- Key files: `pairing-repository.ts`, `scoring-repository.ts`.

**prisma/**
- Purpose: Declares the database structure and tracks changes.
- Contains: Schema configuration and SQL migrations.
- Key files: `schema.prisma`.

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Root landing page.
- `app/api/realtime/socket/route.ts` - WebSocket initialization handler.
- `auth.ts` - NextAuth configuration entry.

**Configuration:**
- `tsconfig.json` - Compiler configuration.
- `package.json` - Dependencies and task scripts.
- `eslint.config.mjs` - Lint rules.

**Testing:**
- Unit/Integration tests are placed directly inside their respective server folders.
- `lib/server/repositories/repositories.test.ts`
- `lib/server/sessions/services.test.ts`
- `lib/server/pairing/pairing-engine.test.ts`
- `lib/server/scoring/scoring-services.test.ts`

## Naming Conventions

**Files:**
- PascalCase for React components (`SessionWorkspace.tsx`, `Navbar.tsx`).
- kebab-case for TypeScript files (`session-service.ts`, `pairing-validation.ts`).
- `*.test.ts` for test suites.
- `route.ts` for API route definitions.

**Directories:**
- kebab-case for all folders (`debate-timer`, `lib/server/pairing`).
- Kebab-case and dynamic route parameters inside bracket names for App Router folders (`[sessionId]`, `[proposalId]`).

## Where to Add New Code

**New Frontend UI Component:**
- Place in `components/pairing/` if specific to pairing/scoring flows, or `components/` for general views.

**New Backend API Endpoint:**
- Define under `app/api/{domain}/[id]/route.ts`. Keep handlers thin.

**New Business Logic / Service:**
- Place in a service file under `lib/server/{domain}/{feature}-service.ts`.

**New Database Entity/Field:**
- Edit `prisma/schema.prisma`, then run `npx prisma migrate dev` to create a new migration.

**Shared Types:**
- Define inside `types/{domain}.ts`.

---

*Structure analysis: 2026-07-02*
*Update when directory structure changes*
