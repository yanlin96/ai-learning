# Agent Guide

This repository contains Line Watch Melbourne, a configurable train-line commute assistant.

## Repository is the system of record

The repository is the authority for product intent, architecture, constraints, current progress, and verification. Chat history and assumptions are not durable project knowledge.

When a conversation reveals information that will change future implementation decisions, update the smallest relevant repository document in the same change. Do not create documentation for temporary details that will not matter in a fresh session.

## Read first

Before changing behaviour, read:

1. `docs/PRODUCT.md` for the user outcome.
2. `docs/ARCHITECTURE.md` for the data flow and boundaries.
3. `docs/DECISIONS.md` for choices that should not be accidentally reversed.
4. `PROGRESS.md` for the current implemented state and immediate open work.

Use `docs/BACKLOG.md` to understand possible future work. A backlog item is not authorization to implement it.

## Working rules

- Make one small, understandable change at a time.
- Preserve the distinction between raw transport data and the user's commute decision.
- Treat train changes, replacement buses, and relevant parking/access notices as useful commute information for each subscribed line.
- Keep Transport Victoria and Telegram credentials server-side.
- Never place real secrets in source files, documentation, client components, logs, or API responses.
- Manual Telegram sending is local-development-only unless production authentication is designed first.
- Use `Australia/Melbourne` for user-facing times and reminder decisions.
- Prefer official Transport Victoria data over inferred or scraped third-party data.
- Update only the documentation affected by a change.
- Keep knowledge close to the code it constrains. As the project grows, add a short local architecture or constraints file beside a module rather than expanding one distant global document indefinitely.
- Treat stale documentation as a defect. If code and documentation disagree, inspect the implementation and user intent, then restore one consistent source of truth.

## Required verification

For normal code changes, run:

```powershell
npm run typecheck
npm run build
```

For data-classification changes, also inspect `/api/lines` and `/api/disruptions?lineId=...` and verify that:

- the official catalog contains current metropolitan passenger train lines and excludes the internal replacement-bus route;
- useful subscribed-line alerts are included;
- expired alerts are excluded;
- the title explains what changes;
- the period uses Melbourne time;
- supporting notices such as relevant parking closures remain visible.

For CRUD changes, verify create, read, update, and delete through the HTTP API and remove verification records afterward.

For Telegram changes, use the protected local test endpoint and never print credentials.

## Definition of done

A change is done when it serves the product outcome, handles failure clearly, passes proportionate verification, and leaves the repository understandable for the next developer or agent.

## Fresh-session test

A new agent reading only this repository should be able to answer:

1. What system is this?
2. How is it organised?
3. How is it run?
4. How is it verified?
5. What is implemented now, and what remains open?

If one of these cannot be answered, fix the repository map rather than relying on chat context.
