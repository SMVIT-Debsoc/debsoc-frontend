# Pairing System Improvement Package

This directory contains the production-hardening proposal for the debate pairing system and a
ready-to-use Codex implementation prompt.

These documents are derived proposals. They do not override `docs/01` through `docs/17`, the
pairing knowledge graph, or `AGENTS.md`. If a proposal conflicts with an authoritative numbered
document, implementation must stop until the conflict is resolved.

## Documents

- [`pairing-production-improvement-plan.md`](./pairing-production-improvement-plan.md) — technical
  design for accuracy, strict constraints, latency, persistence, realtime delivery, UX, testing,
  observability, and rollout.
- [`codex-pairing-improvements-prompt.md`](./codex-pairing-improvements-prompt.md) — detailed phased
  Codex prompt with scope boundaries, test fixtures, acceptance criteria, and hard stop conditions.

## Recommended execution order

1. Baseline measurements and deterministic fixtures.
2. Strict-constraint correctness and database invariants.
3. Realtime connection correctness.
4. Mutation-path latency reduction.
5. Candidate diversity and accuracy improvements.
6. Query, cache, and frontend refetch optimization.
7. Production verification and controlled rollout.

No phase is complete until its tests pass and `docs/pairing-knowledge-graph.md` is updated with the
actual implementation paths and verification evidence.

