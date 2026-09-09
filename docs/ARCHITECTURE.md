# Architecture

## Data flow

```text
Transport Victoria GTFS Schedule + GTFS-Realtime Alerts
                    |
                    v
  lib/train-lines.ts + lib/disruptions.ts
  partial ZIP extraction, decode, filter,
  classify, format Melbourne time
                    |
          +---------+----------+
          |                    |
          v                    v
  Next.js dashboard     Telegram message formatter
     app/page.tsx       lib/notification-message.ts
          |                    |
          v                    v
 Manual send button       Telegram Bot API
          |                    ^
          +---- server API ----+
```

## Main components

- `lib/disruptions.ts`: server-only Transport Victoria client and domain mapping.
- `lib/train-lines.ts`: dynamically extracts metropolitan `routes.txt` from the official weekly GTFS ZIP using HTTP Range requests and caches it.
- `lib/subscriptions.ts`: CRUD domain and local persistence adapter.
- `data/subscriptions.json`: selected reminders only; it is not a copy of the official line catalog.
- `app/reminder-manager.tsx`: searchable create/edit/pause/delete interface.
- `app/api/ARCHITECTURE.md`: API-local responsibilities and constraints.
- `app/api/disruptions/route.ts`: JSON representation used for inspection and integrations.
- `app/page.tsx`: server-rendered dashboard.
- `app/reminders/page.tsx`: dedicated reminder-management page; all normal CRUD UI lives here.
- `app/send-alert-button.tsx`: client-side manual-send interaction.
- `app/site-header.tsx` and `app/site-footer.tsx`: shared navigation and page chrome.
- `lib/notification-message.ts`: Telegram presentation, separate from data retrieval.
- `lib/telegram.ts`: server-only Telegram API client.
- `app/api/telegram/send-current/route.ts`: local manual-send endpoint.
- `app/api/cron/check-disruptions/route.ts`: protected scheduled-send endpoint.
- `lib/website-audit.ts`: server-only, bounded single-page audit engine with public-URL validation, raw HTML parsing, optional Chromium rendering, link checks, crawler simulation, and optional OpenAI summary.
- `lib/robots.ts`: standards-aware robots adapter. Use the dependency-backed parser rather than reimplementing wildcard and rule-precedence semantics.
- `lib/audit-scoring.ts`: pure weighted scoring and confidence rules, separate from crawling and UI presentation.
- `app/api/audits/route.ts`: accepts one public URL and returns a structured report; it must never become an unrestricted internal-network fetch proxy.
- `app/website-audit/page.tsx`: website-audit UI, kept separate from commute reminder flows.
- `lib/public-web.ts`: shared public-URL normalization, DNS/private-address rejection, redirect validation, and bounded fetch used by public-web inspection features.
- `lib/smoke-test.ts`: breadth-first sitemap discovery and bounded multi-page smoke-test orchestration.
- `lib/smoke-rules.ts`: pure Pass/Warning/Fail classification rules.
- `app/smoke-test/page.tsx`: release smoke-test UI for up to 100 same-origin pages.
- `lib/smoke-history.ts`: browser-local smoke-run summaries grouped and bounded by domain.
- `app/smoke-test/history/page.tsx`: domain-grouped smoke-test history UI.

## Website audit data flow

```text
Public URL -> SSRF guard -> raw HTML + robots.txt
                         -> bounded link checks
                         -> Chromium rendered DOM (when available)
                         -> deterministic SEO / AI-access findings
                         -> optional OpenAI summary of supplied evidence
```

The audit reports robots permission, HTTP response, and overall reachability as separate evidence. A missing or unreachable robots file is `unknown`, not automatically allowed. External AI search indexes are private, so the application must never report that indexing is verified. `OPENAI_API_KEY` is optional; without it the deterministic report still works. Chromium uses local Chrome/Edge during development and `@sparticuz/chromium` on Vercel.

Robots parsing is covered by regression tests for wildcard extensions such as `/*.mvc`, path wildcards, and crawler-specific overrides. Do not replace the parser with prefix truncation.

Scoring separates SEO from AI-search readiness. Critical indexability and crawler-access failures carry more weight than optional metadata. GPTBot training permission does not reduce AI-search visibility. Confidence decreases when Chromium rendering, robots evidence, or link coverage is incomplete. Links are collected from both initial and rendered DOMs, deduplicated, and internal links are checked first within the bounded request budget.

## External systems

### Transport Victoria

- Catalog: GTFS Schedule ZIP, read with partial HTTP Range requests and cached for one week.
- Feed: Metro Train GTFS-Realtime Service Alerts.
- Authentication: `KeyID` request header.
- Response: GTFS-Realtime Protocol Buffer.
- Local environment variable: `TRANSPORT_VIC_API_KEY`.

### Telegram

- API: Telegram Bot API `sendMessage`.
- Environment variables: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- Scheduled endpoint protection: `CRON_SECRET` bearer token.

## Security boundary

All credentials must remain in server-only modules and environment variables. Client components may call project API routes but must never receive Transport Victoria or Telegram credentials.

Website-audit targets must use HTTP(S), resolve only to public addresses, and be revalidated across redirects and browser subresources. Keep time, response-size, redirect, and link-count limits in place. Do not add localhost or private-network exceptions to the public endpoint.

Smoke tests use the same public-network boundary. Manual URLs must share the base website origin. The base URL and manually supplied priority URLs run before same-origin sitemap entries. Runs are read-only, deterministic, capped at 100 HTTP checks, and bounded by request and overall time budgets. One shared Chromium instance verifies up to 20 priority or HTTP-anomalous pages with four-page concurrency. Images, fonts, and media are blocked; documents, scripts, and stylesheets remain available so runtime and critical-resource failures can be observed. Smoke tests do not call OpenAI.

Smoke history is client-side only. `localStorage` retains compact summaries across tabs and browser restarts, capped at 10 recently used domains and 10 runs per domain. Full reports and response bodies are not persisted, and server APIs never depend on this history.

## Read/write page boundary

The home page is the read-oriented commute dashboard. `/reminders` owns create, update, pause, and delete interactions. Both may read subscription counts, but mutation forms must not drift back into the dashboard.

## Time handling

Source timestamps are Unix timestamps. Display and commute scheduling use `Australia/Melbourne`, including daylight-saving changes.

## Known limitations

- Classification currently uses official fields plus text and route heuristics.
- Local JSON persistence is not suitable for multi-instance or serverless production deployment.
- Some official alerts provide a strong title but only a time range as their description.
- The project does not yet store sent-message history or prevent duplicate scheduled notifications.
- A production scheduler has not yet been selected and configured.
