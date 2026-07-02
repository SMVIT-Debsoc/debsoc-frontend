# Architecture

**Analysis Date:** 2026-07-02

## Pattern Overview

**Overall:** Thin-Transport Layered Service Architecture with Repository Abstractions.

**Key Characteristics:**
- **Thin API Routes:** Route files strictly parse, guard, and delegate to services. They contain no Prisma queries, formulas, or orchestration.
- **Service Domain Isolation:** Business rules, calculations, and state machines live in isolated services under `lib/server/`.
- **Repository Pattern:** Eagerly encapsulates all database reads and writes under `lib/server/repositories/` to hide Prisma leakage.
- **Context Front-Loading:** The pairing engine reads all necessary database records upfront, building an immutable `PairingGenerationContext` rather than querying during generation/scoring loops.
- **Seeded Randomness:** Engine uses deterministic seeded randomness for final top-band selection, preserving auditable metadata.

## Layers

**Transport Layer (API Routes):**
- Purpose: Handles HTTP requests, authentication guards, validation, and serialization.
- Contains: Route handlers (e.g., `app/api/pairing/generate/route.ts`).
- Depends on: Validation layer, guards, and service layer.
- Used by: React client components.

**Validation Layer:**
- Purpose: Ensures input payloads conform to contract specifications.
- Contains: Zod validation schemas (e.g., `lib/server/validations/pairing-validation.ts`).
- Depends on: None.
- Used by: Transport layer.

**Service Layer:**
- Purpose: Orchestrates business logic, calculations, and domain state machines.
- Contains: Services for pairing (`lib/server/pairing/`), sessions/attendance (`lib/server/sessions/`), scoring (`lib/server/scoring/`), evaluation (`lib/server/eval/`), and realtime (`lib/server/realtime/`).
- Depends on: Repositories and shared types.
- Used by: Transport layer.

**Repository Layer:**
- Purpose: Abstracted database access layer.
- Contains: Repository classes/functions (e.g., `lib/server/repositories/pairing-repository.ts`).
- Depends on: Prisma client.
- Used by: Service layer.

## Data Flow

### Pairing Generation & Lifecycle Flow

1. **Request:** Admin triggers generation via `POST /api/pairing/generate`.
2. **Authorize & Validate:** API route runs `requireSessionUser` to enforce `cabinet` or `President` roles, and validates the session ID.
3. **Fetch Context:** The route calls the engine service. The engine uses `PairingRepository.getGenerationContext(sessionId)` to load all required member, attendance, and historical metric snapshots into a `PairingGenerationContext`.
4. **Generate Candidates:** `candidate-generator.ts` arranges active speakers, assigns speaking positions (OG, OO, CG, CO) and roles, and determines leftovers.
5. **Rule Filters:** Candidates are validated against early constraint validations in `hard-rules.ts`.
6. **Scoring:** The valid candidates are scored in `proposal-scorer.ts` using weights from the metrics definition and objective multipliers (e.g. `DEVELOPMENT`, `BALANCED`, `COMPETITIVE`).
7. **Select Proposal:** The top 5 scored proposals enter the top band. `proposal-selector.ts` selects one proposal using seeded randomness.
8. **Persist Proposal:** The chosen proposal is persisted with its detailed score breakdown.
9. **Realtime Broadcast:** A domain event is published via `realtime/event-publisher.ts` to notify connected clients of the new proposal.

### State Management:
- Core state is stored in Neon PostgreSQL and accessed synchronously through transaction-scoped Prisma queries.
- Read views are derived dynamically or loaded from metric snapshots, avoiding duplicate sources of truth.

## Key Abstractions

**Repository:**
- Purpose: Groups database read/write queries for a specific entity domain.
- Examples: `PairingRepository`, `SessionRepository`, `ScoringRepository`.
- Pattern: Object modules wrapping transaction blocks and projections.

**Service:**
- Purpose: Houses the business logic of a domain area.
- Examples: `SessionService`, `SpeakerScoringService`, `MetricUpdateService`.
- Pattern: Functional services receiving structured inputs and returning domain results.

**Validation Schema:**
- Purpose: Schema definition for request validation.
- Examples: `generatePairingSchema` in `pairing-validation.ts`.
- Pattern: Zod schemas.

## Entry Points

**API Entry Points:**
- Location: `app/api/` subdirectories.
- Triggers: HTTP requests.
- Responsibilities: Input parsing, guards, service delegation, and JSON output response mapping.

**Realtime WebSocket Entry:**
- Location: `app/api/realtime/socket/route.ts`
- Triggers: WebSocket connection initialization.
- Responsibilities: Connection upgrade handling, client registration, and subscription scoping.

## Error Handling

**Strategy:** Services throw domain-specific errors. Transport routes catch these errors, map them to standardized HTTP status codes, and return structured JSON responses.

**Patterns:**
- Try/catch blocks in API route handlers.
- Standardized validation errors thrown by Zod.
- Transaction rollback guarantees in repositories when updates fail.

## Cross-Cutting Concerns

**Authentication:**
- Decoupled from service logic. Enforced via `requireSessionUser` and `requireUserRole` helper guards (`lib/server/guards.ts`) on routes.

**Realtime Delivery:**
- Decoupled notify-first system. Services publish events post-commit, and the publisher runs asynchronously from database writes.

**Data Validation:**
- Handled at route boundaries using Zod, ensuring no invalid payloads leak into domain services.

---

*Architecture analysis: 2026-07-02*
*Update when major patterns change*
