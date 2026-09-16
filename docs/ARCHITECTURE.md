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
  app/(workspace)/disruptions/page.tsx   lib/notification-message.ts
          |                    |
          v                    v
 Manual send button       Telegram Bot API
          |                    ^
          +---- server API ----+
```

## Main components

`app/page-template.tsx` owns the Tailwind content container (1080px max width, responsive gutters/top spacing) and compact task-heading rhythm; history headings optionally add an icon. `app/tool-ui.tsx` supplies shared field/action styles and history search/empty-state patterns. Smoke scope/outcome and Metro selection/notices use Tailwind; detailed audit evidence tables still use their existing domain styles. Keep result/filter/storage logic in their existing components. Shared account actions live only in the header, not duplicated inside the train page. See `DESIGN.md` for reusable visual rules and `docs/WORKSPACE-UI.md` for route strategy.

The workspace shell owns one shared footer after page content in a min-viewport-height flex column. Page mains grow without the legacy `min-height: 100vh`, so short pages place the footer at the viewport bottom and long pages keep it in normal flow; never fix the footer over tool results. The header's account/navigation row remains navy, while the daily-brief row (including outer gutters) and its card are white.

- `lib/disruptions.ts`: server-only Transport Victoria client and domain mapping.
- `lib/train-lines.ts`: dynamically extracts metropolitan `routes.txt` from the official weekly GTFS ZIP using HTTP Range requests and caches it.
- `lib/subscriptions.ts`: CRUD domain and local persistence adapter.
- `data/subscriptions.json`: selected reminders only; it is not a copy of the official line catalog.
- `app/reminder-manager.tsx`: searchable create/edit/pause/delete interface.
- `app/api/ARCHITECTURE.md`: API-local responsibilities and constraints.
- `app/api/disruptions/route.ts`: JSON representation used for inspection and integrations.
- `app/(workspace)/page.tsx`: root compatibility redirect to the default homepage `/website-audit`; old `/?url=...` links preserve their URL prefill. No separate index launchpad remains.
- `app/(workspace)/layout.tsx`: server-side session boundary for every workspace page, mounting one persistent `app/workspace-shell.tsx` with the shared header outside individual page content. Route groups do not change public URLs. The shell reserves desktop sidebar space on all workspace tools; page mains override legacy global padding. Internal navigation uses Next.js Link so account/daily-brief state and desktop group choices survive route changes. External links remain ordinary anchors. API and middleware authentication guards remain authoritative on every request; the persistent layout is not a replacement for them.
- `app/(workspace)/reminders/page.tsx`: dedicated reminder-management page; all normal CRUD UI lives here.
- `app/send-alert-button.tsx`: client-side manual-send interaction.
- `app/site-header.tsx` and `app/site-footer.tsx`: shared page chrome. The header owns persistent desktop workspace navigation, the responsive toolbox drawer, and a session-backed account menu; reminder entry is intentionally absent from shared navigation. Header and sidebar styling use Tailwind CSS v4 utilities. Tailwind Preflight is intentionally disabled during the staged migration so existing feature-page CSS keeps its current rendering.
- `app/(workspace)/disruptions/page.tsx` and `app/train-status-search.tsx`: server-seeded, client-interactive search and live-status flow for all metropolitan train lines.
- `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, and `app/login/page.tsx`: Auth.js integration with an Okta OIDC web application. `/train-login` forwards old links to the new workspace login.
- `app/daily-brief.tsx` and `/api/daily-brief`: a non-blocking client-loaded weather and Werribee status strip mounted by the shared site header.
- `lib/melbourne-weather.ts`: cached Melbourne forecast adapter backed by Open-Meteo; weather-code wording stays pure in `lib/weather-codes.ts`.
- `lib/notification-message.ts`: Telegram presentation, separate from data retrieval.
- `lib/telegram.ts`: server-only Telegram API client.
- `app/api/telegram/send-current/route.ts`: local manual-send endpoint.
- `app/api/cron/check-disruptions/route.ts`: protected scheduled-send endpoint.
- `lib/website-audit.ts`: server-only, bounded single-page audit engine with public-URL validation, raw HTML parsing, optional Chromium rendering, link checks, crawler simulation, and optional OpenAI summary.
- `lib/robots.ts`: standards-aware robots adapter. Use the dependency-backed parser rather than reimplementing wildcard and rule-precedence semantics.
- `lib/audit-scoring.ts`: pure weighted scoring and confidence rules, separate from crawling and UI presentation.
- `app/api/audits/route.ts`: accepts one public URL and returns a structured report; it must never become an unrestricted internal-network fetch proxy.
- `app/(workspace)/website-audit/page.tsx`: website-audit UI, kept separate from the workspace home and commute reminder flows.
- `lib/public-web.ts`: shared public-URL normalization, DNS/private-address rejection, redirect validation, and bounded fetch used by public-web inspection features.
- `lib/smoke-test.ts`: breadth-first sitemap discovery and bounded multi-page smoke-test orchestration.
- `lib/smoke-rules.ts`: pure Pass/Warning/Fail classification rules.
- `app/(workspace)/smoke-test/page.tsx`: release smoke-test UI for up to 100 same-origin pages.
- `lib/smoke-history.ts`: browser-local smoke-run summaries grouped and bounded by domain.
- `app/(workspace)/smoke-test/history/page.tsx`: domain-grouped smoke-test history UI.
- `lib/audit-history.ts` and `app/history-list.tsx`: tab-local audit snapshots with findings, fixes and coverage; optional detail fields preserve older score-only records.
- `app/smoke-url-results.tsx`: shared Tailwind result explorer for live smoke reports and saved run details, with search, status filters and pagination.

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

- Regional lookup: `getRegionalSchedule` extracts folder `1/google_transit.zip` routes/trips/stops and maps exact route/trip IDs. Metro catalog/reminder APIs retain their existing default. `/api/lines?network=vline` opts into regional rail only.
- `lib/vline.ts` reads the official V/Line Trip Updates protobuf with server-side KeyID and a 30-second fetch cache. `lib/vline-rules.ts` maps stop predictions without inventing missing delays; stale feeds (over five minutes or missing timestamp) hide predictions, stale trip measurements and completed trips are excluded, overnight trips remain eligible when a future stop exists. Unmatched schedule IDs are disclosed as a coverage gap.
- `app/vline-status.tsx` consumes protected `/api/vline-trips?lineId=...`; current/upcoming disruption notices and vehicle maps are not supplied by this integration. V/Line has no disruption feed in this dataset, so the UI links to official notices instead. No regional Telegram scheduling is introduced.

- Catalog: GTFS Schedule ZIP, read with partial HTTP Range requests and cached for one week.
- Feed: Metro Train GTFS-Realtime Service Alerts.
- Authentication: `KeyID` request header.
- Response: GTFS-Realtime Protocol Buffer.
- Local environment variable: `TRANSPORT_VIC_API_KEY`.

### Telegram

- API: Telegram Bot API `sendMessage`.
- Environment variables: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- Scheduled endpoint protection: `CRON_SECRET` bearer token.

### Weather

- Provider: Open-Meteo Forecast API for fixed Melbourne coordinates.
- Current temperature and today’s minimum/maximum are cached for 15 minutes.
- The shared-header brief loads after the main page and degrades independently when weather is unavailable.

### Okta

- Application sign-out clears the Auth.js session and returns to `/login?signedOut=1`, which waits for explicit sign-in instead of automatically restarting OAuth. The marker is presentation only, not an authentication exemption or proof of logout. Okta SSO is retained; fresh protected-page visits still use normal automatic login. Okta and application session lifetimes are independent.

- Auth.js uses the Okta OIDC provider with an Authorization Code redirect flow and a server-side client secret.
- `/login` automatically calls Auth.js `signIn("okta")` once after hydration, preserving its CSRF/state/nonce handling and the sanitized callback path. It does not redirect directly to a bare Okta login URL. OAuth errors disable automatic start and require manual retry; missing configuration fails closed. The branded login form lives on the Okta-hosted custom domain, outside this repository.
- Local callback: `http://localhost:3000/api/auth/callback/okta`.
- Production origin: `https://cpatools.gylxxgroup.com`; production callback: `https://cpatools.gylxxgroup.com/api/auth/callback/okta`.
- Required environment variables: `AUTH_OKTA_ID`, `AUTH_OKTA_SECRET`, `AUTH_OKTA_ISSUER`, and `AUTH_SECRET`; `NEXTAUTH_URL` identifies the application origin.
- Okta authenticates users and Auth.js stores a signed session cookie. No application passwords are collected or stored.

## Security boundary

All credentials must remain in server-only modules and environment variables. Client components may call project API routes but must never receive Transport Victoria or Telegram credentials.

`middleware.ts` checks Auth.js JWTs using the same configured secret as `lib/auth.ts`. It redirects unauthenticated page requests to `/login` with the requested local path/query and returns JSON 401 for business APIs. Auth endpoints and login are exempt, as are framework assets and exact icon paths. Only `/api/cron/check-disruptions` bypasses session middleware, retaining its bearer-secret handler. New workspace pages belong inside `app/(workspace)` for independent server session checks; new business handlers must call `workspaceApiGuard` before fetching or mutating data. Existing train API handlers already check server sessions. Missing configuration and malformed/expired sessions fail closed. `lib/auth-routing.ts` rejects external callback destinations and login/API loops. UI visibility alone is never an authorization boundary.

Website-audit targets must use HTTP(S), resolve only to public addresses, and be revalidated across redirects and browser subresources. Keep time, response-size, redirect, and link-count limits in place. Do not add localhost or private-network exceptions to the public endpoint.

Smoke tests use the same public-network boundary. Manual URLs must share the base website origin. The base URL and manually supplied priority URLs run before same-origin sitemap entries. Runs are read-only, deterministic, capped at 100 HTTP checks, and bounded by request and overall time budgets. One shared Chromium instance verifies up to 20 priority or HTTP-anomalous pages with four-page concurrency. Images, fonts, and media are blocked; documents, scripts, and stylesheets remain available so runtime and critical-resource failures can be observed. Smoke tests do not call OpenAI.

Smoke history is client-side only. `localStorage` retains compact per-URL evidence across tabs and browser restarts, capped at 10 recently used domains and 10 runs per domain. New runs save all checked URLs, HTTP status, timing, browser state and compact issue text, not response bodies or full reports. Optional page-detail fields distinguish legacy issue-sample-only records. Browser quota or disabled-storage failures leave existing history intact and show a warning alongside the current report. Server APIs never depend on this history.

## Read/write page boundary

`/disruptions` is the Okta-protected, read-oriented train lookup. It searches the official line catalog and requests one line's current alerts through the equally protected `/api/disruptions?lineId=...`. `/reminders` still owns create, update, pause, and delete interactions, but is deliberately unlinked while reminders are hidden from the multi-user interface. Mutation forms must not drift into the lookup.

## Time handling

Source timestamps are Unix timestamps. Display and commute scheduling use `Australia/Melbourne`, including daylight-saving changes.

## Known limitations

When a development server is already using `.next`, set `CPA_TOOLS_BUILD_DIR=.next-workspace-check` for both `npm run build` and the corresponding `npm start` verification process. `next.config.ts` otherwise uses the default `.next` directory. The separate ignored verification directory prevents concurrent dev/build manifests from mixing; it does not change production configuration by default.

- Classification currently uses official fields plus text and route heuristics.
- Local JSON persistence is not suitable for multi-instance or serverless production deployment.
- Some official alerts provide a strong title but only a time range as their description.
- The project does not yet store sent-message history or prevent duplicate scheduled notifications.
- A production scheduler has not yet been selected and configured.
