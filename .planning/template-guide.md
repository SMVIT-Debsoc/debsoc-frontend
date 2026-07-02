# Ideal Planning Template

This is the ideal shape for using `.planning` in this repo.

## `current-focus.md`
- active feature or phase
- current mode or constraints
- last verified facts
- open blockers
- next 3 actions
- update rule

## `codebase/STRUCTURE.md`
- top-level folder map
- key file locations
- where to add new frontend code
- where to add new backend code
- real paths only
- avoid speculative paths unless marked `Expected`

## `codebase/ARCHITECTURE.md`
- route -> service -> repository boundary
- frontend vs backend separation
- major data flow summaries
- pairing-specific architecture constraints
- keep concise and factual

## `codebase/CONVENTIONS.md`
- naming
- imports
- testing style
- path aliases
- export patterns
- error-handling norms

## `codebase/STACK.md`
- framework versions
- build tools
- runtime assumptions
- environment keys by category
- only facts that affect development decisions

## `codebase/INTEGRATIONS.md`
- auth provider
- database
- external webhooks
- public env-driven integrations
- deployment assumptions

## `codebase/TESTING.md`
- real test commands
- test file locations
- mocking approach
- current runner caveats
- known environment issues

## `codebase/CONCERNS.md`
- known bugs
- debt
- security watchpoints
- performance pressure points
- drift candidates inside planning itself
