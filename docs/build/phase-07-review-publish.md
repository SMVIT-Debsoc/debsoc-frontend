# Phase 7 — Review, Publish & Published Read (`B10`, `B11`)

Proposal review actions, transactional publish with one source of truth, and the member-visible
published pairing read.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 5; Rule 6 access roles; Rule 7).
2. Read docs/pairing-knowledge-graph.md; locate B10 review, B11 publish, states S2–S4, D-PV.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 7
   - docs/11-backend-implementation-map.md → review.ts, publish.ts
   - docs/02-backend-changes.md → §4 (review), §5 (publish)
   - docs/14-api-routing-map.md → §3 (pairing routes, including published read)
   - docs/15-pairing-engineering-quality-standard.md → §10 (override preservation),
     §11 (audit), §13 (transactions / one source of truth)
   - earlier-phase types, repositories, engine
4. Confirm gate 9 (access + published-view) resolved and Phase 6 done. If not, STOP.

TASK — Phase 7. Create only:
- lib/server/pairing/review.ts → approveProposal(proposalId, reviewerId),
  overrideProposal(input), regenerateProposal(input), rateProposal(input)
- lib/server/pairing/publish.ts → publishApprovedProposal(sessionId),
  getPublishedPairing(sessionId)

Requirements (docs/15):
- Publish is FORBIDDEN before approval; transitions guarded (§9).
- Exactly ONE official published proposal per session; publish sets the single
  publishedProposalId pointer inside a transaction; finalize attendance in the same tx (§13).
- Override PRESERVES the original generated proposal + actor + reason + overridden fields (§10).
- Concurrency: guard double-publish / racing admin actions with version/updatedAt checks;
  return machine-readable conflicts (§8/§10).
- getPublishedPairing assembles the D-PV read model from D1+D4+D5+D6+D7+D8 and exposes NO
  admin-only review context to members (§16).

Hard rules:
- All DB via repositories (use publishProposalTransaction). Names from docs/11/14. If missing, STOP.

VERIFY: typecheck + tests: publish-before-approval rejected; double-publish yields one official
result; override keeps original; published read excludes admin notes. Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B10, B11 BUILT; mark S2→S3→S4 transitions
  implemented; record the conflict/version strategy used.
- Print "Grounded in:".
```

---

## Done-when
- `review.ts` + `publish.ts` exist; one official proposal per session; override preserves original.
- Double-publish guarded; published read is role-safe; tests pass (shown).
- Graph B10/B11 BUILT, S2–S4 marked; `Grounded in:` printed.
</content>
