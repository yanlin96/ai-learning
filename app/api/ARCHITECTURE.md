# API Layer

## Responsibilities

- `/api/lines?network=vline` exposes official regional rail routes; the default remains metropolitan.
- `/api/vline-trips?lineId=...` checks the workspace session before reading regional predictions. It includes feed freshness and unmatched-trip coverage, not disruption alerts; failures return JSON and never expose KeyID.

- `/api/lines` exposes the current official metropolitan train catalog to authenticated users.
- `/api/subscriptions` lists and creates reminder subscriptions.
- `/api/subscriptions/[id]` updates and deletes one subscription.
- `/api/disruptions?lineId=...` returns alerts for a selected line after checking an Okta-backed Auth.js session.
- `/api/daily-brief` returns cached Melbourne weather and Werribee Line status only after authentication. It never exposes the Transport Victoria credential.
- Telegram endpoints send current subscribed-line alerts or perform a protected test.
- The cron endpoint checks which enabled subscriptions are due in Melbourne time.

## Constraints

- All business APIs require an Okta session before any network work or mutation. Call `workspaceApiGuard` inside new handlers as well as relying on global middleware; existing train handlers retain their server-side checks. `/api/auth/*` supports login/session operations without requiring prior login. Only the exact cron check route uses bearer-secret automation instead of a session. Daily brief/weather is no longer public. Manual Telegram routes retain their existing additional restrictions.

- Never expose upstream or Telegram credentials.
- Validate line IDs against the official catalog and reminder times as `HH:mm`.
- Only one subscription may exist for a line.
- CRUD handlers depend on `lib/subscriptions.ts`; do not write storage files directly here.
- Keep manual Telegram sending development-only until production authentication exists.
- API errors must be JSON with a useful `error` string.
- Protect train data in route handlers; a hidden link or page redirect is not sufficient authorization.

## Storage boundary

The current repository is local-first, so `data/subscriptions.json` is the persistence adapter. Route handlers must not assume JSON storage; it is expected to be replaced for multi-instance deployment.

## Website audit

`POST /api/audits` is a bounded public-web inspection endpoint. It returns a Quality & Fix Report alongside the raw signals: every finding carries severity, confidence, evidence, impact, fix, and owner. Deterministic checks (HTTP status, markup, dates) may reach high confidence; language-model findings are capped at medium severity and medium confidence by `capContextualFinding`, because the stated false-positive budget for contextual findings is under 10%. Archive URLs matched by `AUDIT_ARCHIVE_PATTERNS` downgrade date findings rather than hiding them. It accepts one URL and delegates all network and classification work to `lib/website-audit.ts`. Keep credentials, browser execution, DNS/public-address validation, redirects, limits, and optional OpenAI calls server-side. A successful crawl means the tested crawler can access the URL; it does not prove indexing or citation by an external AI product.

`POST /api/accessibility-audits` is the separate accessibility estimate endpoint. It shares public-address validation and bounded browser rendering but runs only deterministic DOM checks. It does not check links, robots/crawlers, SEO or call OpenAI. Access-control challenge documents are rejected as page evidence: a good initial response may support an explicit partial estimate when only browser rendering is blocked, while two blocked paths return no score. Its score is not WCAG certification, and the response must preserve manual-testing limitations.

`POST /api/smoke-tests` accepts a public base URL, optional same-origin priority URLs, and a page limit capped at 100. It delegates discovery and checking to `lib/smoke-test.ts`. It must remain read-only, bounded, and protected by the shared public-network validation in `lib/public-web.ts`.

The user-facing write surface is `/reminders`; the home dashboard should remain read-oriented even though both pages consume these APIs.
