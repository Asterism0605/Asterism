# CLAUDE.md

Follow the repository rules in `AGENTS.md`.

This file only contains Claude Code-specific behavior. Do not duplicate the full project guideline here.

## Claude Code Rules

- Read and follow `AGENTS.md` before making changes.
- Keep changes small and reviewable.
- Prefer minimal targeted fixes over broad refactors.

## Working Style

Before editing, identify:

- which layer the change belongs to: component, composable, store, service, api, types, or utils
- whether existing code already solves part of the problem
- whether the change affects API contracts, routing, auth, payment, or global state
- whether tests should be added or updated

When a change is risky, explain the risk before implementation.

## Verification

After changes, run the relevant checks when possible:

```bash
npm run lint
npm run build
npm run test
```

If a command is missing, unavailable, or fails for reasons outside the change, report it clearly.

## Response Format After Changes

Report with:

```md
## Summary

## Files Changed

## Verification

## Notes / Risks
```

Keep the summary concise and focused on what changed, why it changed, and how it was verified.
