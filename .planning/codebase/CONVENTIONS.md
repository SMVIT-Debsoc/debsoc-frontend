# Coding Conventions

**Analysis Date:** 2026-07-02

## Naming Patterns

**Files:**
- kebab-case for TypeScript service/repository/validation files (`session-service.ts`, `pairing-validation.ts`).
- PascalCase for React components (`SessionWorkspace.tsx`, `HiringPopup.tsx`).
- `*.test.ts` for test files.

**Functions:**
- camelCase for all helper and core business functions (`generatePairingProposal`, `scoreProposal`).
- Event handlers: `onEventName` for props, `handleEventName` for internal methods.

**Variables:**
- camelCase for local variables.
- UPPER_SNAKE_CASE for environment configurations and global static parameters (`MAX_CANDIDATE_COUNT`, `TOP_BAND_SIZE`).

**Types:**
- PascalCase for interfaces, type aliases, and custom types (`PairingGenerationContext`, `GeneratePairingProposalInput`).
- PascalCase for enums. No prefix like `I` for interfaces.

## Code Style

**Formatting:**
- 2 space indentation.
- Double quotes preferred in TS files.
- Semicolons required.
- Standard ESLint config with React Vitals and TypeScript rules enabled.

**Path Aliases:**
- `@/*` maps to the project root directory `./` (e.g., `import { ensureRoleUserByEmail } from "@/lib/server/auth-models"`).
- Relative imports (`./` or `../`) are used for module-local dependencies within the same folder.

## Import Organization

**Order:**
1. Built-in Node modules (`node:test`, `node:assert/strict`).
2. External package dependencies (`react`, `next-auth`, `zod`).
3. Path alias imports (`@/lib/server/...`, `@/types/...`).
4. Relative imports (`./types`, `../guards`).

**Grouping:**
- Blank lines between different import groups.
- Alphabetical sorting within each group.

## Error Handling

**Patterns:**
- **Fail Fast:** Zod validates request payloads at route boundaries, rejecting bad payloads immediately before they hit domain logic.
- **Service Errors:** Domain services throw standard `Error` objects with contextual descriptions. Routes catch these and return them as structured JSON objects (with consistent metadata fields like status codes, messages, and conflict details).
- **Transactional Rollback:** Database writes that span multiple related tables (e.g. publishing a proposal, which modifies session state, attendance entries, and room roles) are wrapped in a single Prisma transaction (`$transaction`).

## Function Design

**Composition:**
- Keep functions small, modular, and focused on a single responsibility.
- Use explicit inputs and return types rather than referencing global or mutable states.
- E.g., the pairing generation loop is broken down into separate modules: candidate generation, hard-rule rejection, scoring, and selection.

**Return Values:**
- Avoid implicit return types; declare types explicitly.
- Return early for guard checks and negative validation criteria.

## Module Design

**Exports:**
- Named exports are strongly preferred for utility functions, repositories, and services to ensure type consistency and clean auto-completion.
- Default exports are primarily reserved for React pages and layout templates.

**Barrel Files:**
- Avoid nesting imports deeply from external folders where possible; use clear boundaries like exporting from services directly.

---

*Convention analysis: 2026-07-02*
*Update when patterns change*
