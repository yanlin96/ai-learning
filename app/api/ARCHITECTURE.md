# API Layer

## Responsibilities

- `/api/lines` exposes the current official metropolitan train catalog.
- `/api/subscriptions` lists and creates reminder subscriptions.
- `/api/subscriptions/[id]` updates and deletes one subscription.
- `/api/disruptions?lineId=...` returns alerts for a selected line.
- Telegram endpoints send current subscribed-line alerts or perform a protected test.
- The cron endpoint checks which enabled subscriptions are due in Melbourne time.

## Constraints

- Never expose upstream or Telegram credentials.
- Validate line IDs against the official catalog and reminder times as `HH:mm`.
- Only one subscription may exist for a line.
- CRUD handlers depend on `lib/subscriptions.ts`; do not write storage files directly here.
- Keep manual Telegram sending development-only until production authentication exists.
- API errors must be JSON with a useful `error` string.

## Storage boundary

The current repository is local-first, so `data/subscriptions.json` is the persistence adapter. Route handlers must not assume JSON storage; it is expected to be replaced for multi-instance deployment.

## Website audit

`POST /api/audits` is a bounded public-web inspection endpoint. It returns a Quality & Fix Report alongside the raw signals: every finding carries severity, confidence, evidence, impact, fix, and owner. Deterministic checks (HTTP status, markup, dates) may reach high confidence; language-model findings are capped at medium severity and medium confidence by `capContextualFinding`, because the stated false-positive budget for contextual findings is under 10%. Archive URLs matched by `AUDIT_ARCHIVE_PATTERNS` downgrade date findings rather than hiding them. It accepts one URL and delegates all network and classification work to `lib/website-audit.ts`. Keep credentials, browser execution, DNS/public-address validation, redirects, limits, and optional OpenAI calls server-side. A successful crawl means the tested crawler can access the URL; it does not prove indexing or citation by an external AI product.

The user-facing write surface is `/reminders`; the home dashboard should remain read-oriented even though both pages consume these APIs.
