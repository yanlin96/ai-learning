# Decisions

## 2026-09-16 — Keep accessibility estimate as a separate tool

Use `/accessibility` and its own protected API rather than adding accessibility as another Website Audit score. Expose a 0–100 estimate derived from deterministic DOM findings, weighted by finding severity. Use the rendered DOM when available and reduce confidence when only initial HTML can be inspected. Keep untested contrast, keyboard, focus order, zoom and assistive-technology behaviour visible as manual coverage gaps. The estimate is diagnostic prioritisation, not WCAG certification, and does not trigger link, SEO, crawler or OpenAI work.

## 2026-09-16 — Stop automatic re-login after application logout

Sign out of CPA Tools only, retaining the Okta SSO session and its configured lifetime. Return to `/login?signedOut=1` with an explicit Continue with Okta action. Normal protected-page visits retain automatic Okta handoff; error states never auto-retry. Do not introduce global Okta logout or change application session lifetime without a separate request.

## 2026-09-16 — Refine the incumbent workspace rather than replace its identity

Keep navy navigation/footer, white tools/commute strip and the established font stack. Replace promotional tool headlines with compact task names and share Tailwind field/action/history patterns. Preserve persistent navigation, default-expanded release workflow, API/session boundaries and browser-local history. The mobile toolbox contains keyboard focus and returns it to its trigger when closed. Reusable visual rules live in `DESIGN.md`; route strategy lives in `docs/WORKSPACE-UI.md`. Detailed audit tables remain a bounded legacy-CSS migration, not a claim that all site CSS has been converted.

## 2026-09-16 — Keep regional predictions distinct from Metro alerts

Integrate official V/Line Trip Updates in the existing train lookup with a Metro/V/Line switch, not as fabricated disruption cards. Regional schedules come from GTFS folder 1; coaches are excluded. Exact route/trip IDs join the realtime feed to names. Missing, stale or unmatched predictions are coverage gaps, not an all-clear. Keep Metro reminder/Telegram behavior unchanged. New UI uses Tailwind and extends existing navy/white workspace identity; Impeccable guidance prioritises task clarity rather than replacing site branding.

## 2026-09-15 — Reuse page templates by workflow

Use a shared Tailwind content container and heading for the three visible tools and two history pages. Tools use a prominent heading, histories its compact icon variant; keep domain-specific forms/results and browser storage untouched. Remove the train page's duplicate identity/sign-out capsule; header account actions remain the single entry. Hidden reminder CRUD is outside this visible-page template increment.

## 2026-09-15 — Separate the white brief row and correct footer flow

The daily brief's entire row, including its outer gutters, is white rather than inheriting navy header fill. Keep navy account/navigation/sidebar/footer. Mount the footer once in the shared shell outside page mains, using a min-height flex column with growing main and normal-flow footer; override legacy full-viewport main height locally. This prevents blank space below the footer without fixing it over long reports.

## 2026-09-15 — Restore Audit as home and unify dark workspace chrome

Supersede the separate sidebar-free index: signed-in root redirects to Website Audit, preserving old URL prefills. Keep explicit safe tool callbacks after login rather than overriding every requested destination. Remove the redundant Workspace home navigation item; brand links go directly to Audit. Use the Okta login navy (`#071226`) with white text, cyan accents and distinct active states on header/sidebar/account menu/footer, leaving tool content and the daily brief light. Preserve the persistent shared shell and Link navigation.

## 2026-09-15 — Persist workspace chrome across navigation

Mount the header once in the authenticated shared layout through a pathname-aware client shell. Keep internal navigation on Next.js Link and external links on anchors. Preserve account/daily-brief state and desktop group choices across feature/home navigation; close the mobile drawer and release its scroll lock on route changes. Sidebar visibility is presentation only: middleware, page/API session guards and OAuth behavior remain unchanged.

## 2026-09-15 — Use the branded Okta-hosted login directly

Remove the duplicate application login promotion now that the custom-domain Okta sign-in page has been branded. Keep `/login` as an automatic Auth.js handoff, not a bare redirect to the identity-provider login URL: the application must initiate its OIDC transaction to create and validate state/nonce and preserve the requested local return path. Start once per mount; OAuth errors require explicit retry to prevent redirect loops. Setup failures remain locked and visible. Keep the existing server-side session boundaries and callback route.

## 2026-09-15 — Reserve the sidebar for feature pages

The authenticated homepage is a standalone launchpad without desktop sidebar, mobile toolbox button or reserved sidebar space. Keep branding, account actions and daily brief in its top header; its existing tool cards provide entry navigation. Feature pages retain the full workspace sidebar/mobile drawer and a home link. This is a presentation change only, not an exemption from site-wide login.

## 2026-09-15 — Authenticate the whole workspace and separate its homepage

The whole site workspace now requires Okta login, superseding the earlier train-only boundary and public-weather brief. `/` is a visually distinctive Tailwind launchpad; `/website-audit` remains the input-first audit tool and primary action. `/login` is the site-wide gateway, with `/train-login` retained as an alias. Use middleware plus independent server workspace/API checks; return 401 JSON for unauthenticated business API calls. Keep OAuth callbacks/assets reachable and preserve bearer-secret cron automation, not a blanket `/api/cron/*` exemption. Authentication does not redesign reminder permissions/storage or isolate browser histories by account. No fake metrics or raster hero assets.

## 2026-09-15 — Keep page performance as a Google handoff

Retain the existing PageSpeed Insights navigation link instead of duplicating Google's reports in an in-app performance tool. The initial performance wrapper and its local history were withdrawn at the user's request. A future in-app feature needs distinct value such as release comparisons, batch checks or company performance thresholds; this is not authorization to implement those features or run load/stress tests.

This is a lightweight decision log. Add an entry when a choice would otherwise be easy to forget or accidentally reverse.

## 2026-09-15 — Prioritise audit interaction and separate evidence histories

The audit landing page leads with URL input and short workflow guidance rather than an oversized static example report. Google tools remain in shared navigation, not duplicated in the audit report. All UI changed for this workflow uses Tailwind utilities without enabling Preflight for legacy pages.

Audit and Smoke Test histories are independent destinations. New audit records preserve specific findings and fixes; new smoke records preserve compact evidence for every checked URL instead of only problem samples. Do not invent missing details for older records or call unchecked URLs successful. Keep the existing browser-only storage boundaries and run/domain caps; report quota failures alongside the visible result.

## 2026-09-12 — Introduce Okta at the train boundary first

Authentication starts with the smallest useful protected area: `/disruptions` and its `/api/disruptions` and `/api/lines` data endpoints. Website Audit, Google tools, Smoke Test, and Reports remain unchanged. The public daily brief may show weather but not live train evidence before login.

Use an Okta-hosted OIDC redirect through Auth.js instead of collecting passwords in this application. Protect data on the server as well as redirecting the page. Until real Okta credentials are configured, `/train-login` shows setup guidance rather than weakening the boundary or failing with a client exception.

## 2026-09-12 — Make train status line-neutral

The train utility serves multiple users through one combined search-and-status workflow. `/disruptions` loads the official metropolitan line catalog, defaults sensibly, and lets a signed-in visitor search and switch lines without navigating to another screen. Product copy and navigation must not imply that the feature only serves the Werribee Line.

Reminder management, staff passcode entry, and manual Telegram sending are hidden from the shared navigation and public status page. Their routes, storage, and server capabilities remain in place for now; hiding them is reversible and is not authorization to delete reminder data or APIs.

## 2026-09-11 — Make the checker a focused company toolbox

Website Audit remains the product’s primary identity and must retain more visual weight than navigation. Supporting Google SEO tools, release checks, reports, and train status use collapsible groups in a low-emphasis left rail on desktop and a Tools drawer on smaller screens. PageSpeed Insights covers performance and Core Web Vitals, Rich Results Test covers Google-supported structured data, and Search Console remains the authoritative owner-only indexing follow-up. External tools complement rather than inflate the scope of the deterministic in-app audit; Lighthouse is not exposed as a separate navigation item.

Successful-link responses remain available as evidence but are collapsed by default. Coverage copy must distinguish links skipped at the hard 80-link cap from links not reached before the time budget; neither is a broken-link result.

## 2026-09-08 — Keep smoke testing broad, deterministic, and separate

Release smoke testing lives at `/smoke-test` rather than expanding the single-page deep audit. It checks up to 100 same-origin URLs, prioritising manually supplied critical paths before sitemap entries. All selected pages receive HTTP and markup checks; up to 20 priority or suspicious pages receive Playwright verification using one shared browser. It never calls OpenAI and does not perform form submissions. A clear Pass, Pass with warnings, or Fail result is more actionable for release decisions than another numeric score.

Smoke testing and deep auditing share `lib/public-web.ts` so redirects, browser documents, scripts, and stylesheets retain the same SSRF protections. Missing metadata, `noindex`, redirects, console errors, and failed critical resources are warnings; request failures, HTTP errors, visible application-error text, empty rendered bodies, and uncaught page errors fail the run.

Smoke-test history uses browser `localStorage` and groups runs by normalized hostname. To keep storage bounded, retain the 10 most recently used domains and 10 compact run summaries per domain; adding an eleventh domain evicts the least recently tested domain. This history is a local comparison aid, not shared production evidence.

## 2026-09-02 — Keep website audit evidence deterministic

Broken-link status, robots rules, metadata, and raw-versus-rendered content measurements come from code and captured HTTP/browser evidence. OpenAI may summarize those findings, but it must not invent measurements or claim that a page is present in a provider's private index.

Crawler reporting keeps three facts separate: robots permission, HTTP response, and overall reachability. Only `robotsAllowed: false` may be described as blocked by robots.txt; HTTP rejection and an unavailable robots file require different language.

Robots wildcard and precedence rules are delegated to `robots-parser` and protected by regression tests. A prior prefix-only implementation turned `/*.mvc` into `/` and falsely blocked every page; do not reintroduce hand-written wildcard truncation.

The audit is deliberately limited to one public page and 80 links. Public-target validation and request bounds are product requirements because the audit endpoint performs server-side network access.

Scores are weighted diagnostics rather than equal deductions per finding. Every score is paired with a rating, confidence, and short methodology. Confidence reflects evidence coverage and must fall when rendering, robots retrieval, or link coverage is incomplete. Google follow-up was initially limited to Search Console URL Inspection; the later company-toolbox decision expands the handoff without adding those external checks to the audit engine itself.

Link checks distinguish confirmed HTTP failures from inconclusive automation responses. HTTP 401, 403, 405, 408, 425, 429, timeouts, and request errors do not prove a human-facing link is broken, so they remain visible for manual verification but do not affect the broken-link count or SEO score.

## 2026-08-28 — Separate dashboard reading from reminder management

The home page presents commute information and current status. Reminder CRUD lives on `/reminders`, linked through shared navigation. This keeps the frequent read path calm while giving configuration changes a focused workspace.

Deletion uses an accessible in-app confirmation dialog that names the line and reminder time. Do not revert to browser `window.confirm`; it is visually inconsistent and gives poor control over the interaction.

## 2026-08-28 — Derive the line catalog dynamically

Do not hand-maintain or persist a full list of Melbourne train lines. Transport Victoria's CKAN API exposes metadata but no queryable routes DataStore, while the official GTFS Schedule ZIP is about 254MB and updated weekly.

The official ZIP supports HTTP Range requests. `lib/train-lines.ts` therefore reads the ZIP directory, downloads only the nested metropolitan archive entry, extracts `routes.txt`, removes the internal replacement-bus route, and caches the result. `data/subscriptions.json` stores only user-selected reminders.

## 2026-08-28 — Use a local JSON persistence adapter for the CRUD MVP

The current app is local-first and single-instance. Reminder CRUD uses atomic JSON-file writes behind `lib/subscriptions.ts` so the UI and API do not depend directly on storage details.

Before production or multi-user deployment, replace this adapter with a database. Do not deploy writable JSON storage to serverless infrastructure and assume it is durable.

## 2026-08-28 — Treat the repository as the system of record

Durable product intent, constraints, architecture, progress, and verification knowledge must live in versioned repository files. Chat history is useful during a session but is not an authoritative long-term record.

Keep the documentation minimal, close to the code it governs, and updated with behaviour changes. Use a fresh-session test to find missing context. This follows the repository-as-system-of-record principle described in the [Learn Harness Engineering lecture](https://walkinglabs.github.io/learn-harness-engineering/zh/lectures/lecture-03-why-the-repository-must-become-the-system-of-record/).

## 2026-08-28 — Use GTFS-Realtime Service Alerts

Use Transport Victoria's current Metro Train Service Alerts feed rather than relying on HTML scraping.

Why:

- it is an official source;
- it includes planned and unplanned alerts;
- it includes replacement-bus information;
- it has structured active periods, routes, stops, causes, and effects.

## 2026-08-28 — Optimise for the commute decision

The product is not a severity dashboard. Its purpose is to help the user choose train, car, timing, or an alternative.

Consequence: relevant parking and station-access notices remain useful even when they are not major rail disruptions.

## 2026-08-28 — Prefer the alert header as the event title

GTFS `headerText` usually explains the change, such as where buses replace trains. `descriptionText` may contain only dates.

The UI therefore uses:

- `headerText` as the primary event title;
- the structured active period for display time;
- `descriptionText` only as supplemental detail when it adds information.

## 2026-08-28 — Keep credentials server-side

Transport Victoria and Telegram credentials live in `.env.local` during development and in deployment environment variables later. They must never be rendered into browser code.

## 2026-08-28 — Restrict manual Telegram sending to development

The dashboard button is convenient for local testing. It is disabled by the server in production until proper user authentication is designed, preventing public visitors from controlling the Bot.
