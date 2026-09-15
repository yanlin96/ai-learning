# Product

## Purpose

Line Watch Melbourne helps commuters decide how to travel before leaving home.

The important question is not simply:

> Is the Werribee Line running?

It is:

> Is there anything that should change whether I take the train, drive, leave earlier, or make another plan?

## Current user

- Staff using the shared website-quality workspace.
- Signed-in staff checking any metropolitan train line without needing a saved reminder.
- Wants a quick answer without repeatedly checking transport websites.

## Current product behaviour

- Loads the current metropolitan train-line catalog from official GTFS data.
- Combines line search and live status in one Okta-protected workflow on `/disruptions`; signed-in users can search and switch between every metropolitan train line in place.
- Allows reminders to be created, viewed, edited, paused, and deleted.
- Website Audit at `/website-audit` is the default signed-in homepage. `/` redirects there, preserving legacy audit URL prefills; the separate index launchpad is retired. All workspace tools display the desktop sidebar or mobile toolbox.
- Uses an in-app confirmation dialog before deleting a reminder.
- Stores one reminder time for each selected line.
- Shows current and upcoming alerts for selected lines.
- Includes replacement buses, planned works, delays, closures, and relevant station parking/access notices.
- Separates the event title, active period, and supporting detail; active periods always include the year to keep long-running and cross-year notices unambiguous.
- Shows a manual Telegram button whenever useful updates exist.
- The manual button is intended for local testing.
- A scheduled endpoint can send the same useful updates automatically.
- A separate `/website-audit` tool checks one public webpage for broken links, baseline SEO, and AI-crawler accessibility.
- The website-audit landing experience prioritises the URL input over report imagery, offers a focusable example URL, explains the three-step workflow, and shows honest pending feedback while the bounded request is running.
- The shared page header includes a compact Melbourne daily brief with current weather and Werribee Line status. Either source may fail independently without blocking the active tool.
- Internal route navigation keeps the shared header, account, daily brief and desktop sidebar group state mounted rather than reloading the document. The mobile toolbox closes after navigation. Header, sidebar, account menu and footer use the Okta-login navy background with white text and cyan accents; tool content and the daily brief remain light.
- All workspace pages and business APIs, including the daily brief, require login. `/login`, its legacy `/train-login` alias and Okta auth endpoints remain reachable without a session; the cron endpoint keeps its independent bearer-secret protection.
- Website audits compare initial HTML with a JavaScript-rendered DOM when Chromium is available; they never claim to verify a provider's private search index.
- Audit scores use weighted technical signals and display evidence confidence; they are diagnostic summaries, not Google rankings.
- Link-check results include successful 2xx responses and 3xx redirect chains as evidence, without treating them as errors. Broken-link results include link text, internal/external scope, source DOM, URL, and response failure. Bot rejections, rate limits, and missing responses are shown as inconclusive rather than counted as broken. Reports link to Google Search Console URL Inspection for authoritative SEO follow-up.
- Successful-link evidence is collapsed by default. Unchecked links are explicitly described as coverage gaps caused by the 80-link cap or time budget, never as failures.
- The shared company workspace keeps Website Audit and its own history in the primary group. Release workflow contains Smoke Testing and its separate history, followed by Google search tools and train utilities. Google tools remain in navigation but no longer appear as a component in the audit report.
- Reminder and manual Telegram controls are retained in the codebase but hidden from the shared navigation and public train-status experience while the product shifts toward multiple users.
- A separate `/smoke-test` workflow checks release breadth across priority and sitemap URLs without running costly deep analysis on every page. It performs HTTP checks broadly and uses Playwright on priority and suspicious pages.
- Smoke-test scope is configurable from 1 to 100 pages. Manual priority URLs run before sitemap URLs.
- Smoke-test scope offers Quick (10), Standard (30), and Full (100) page presets alongside a custom limit.
- Smoke tests are read-only and return an explicit Pass, Pass with warnings, or Fail recommendation.
- Smoke testing never calls OpenAI; it must not consume model tokens.
- Audit history in tab-local session storage saves concrete findings, evidence, fixes, first actions and coverage for new runs. Older score-only records remain readable and are labelled as lacking detail.
- Smoke-test history is grouped by domain in browser local storage. It keeps up to 10 domains and 10 recent runs per domain, saving compact evidence for every checked URL, including successful pages. Live and historical results provide URL/issue search, result filters, and 20-row pagination. Discovered but unchecked URLs are counted separately, never presented as tested. Storage failures are reported without losing the current on-screen report.

## What counts as useful

Useful information may affect the travel decision, including:

- buses replacing trains;
- cancellations or reduced service;
- significant delays;
- planned works affecting the route;
- Werribee Station parking closures that may affect driving;
- station access changes that materially affect the journey.

Do not assume that only severe rail incidents matter. A parking notice may be decisive for this user.

## Current scope

The commute assistant supports Okta-authenticated, read-only lookup across metropolitan train lines. Reminder storage and Telegram notification code remain local-first and are not currently promoted in the multi-user interface. The repository also contains the primary website-audit utility. Okta provides identity and session access only; the project does not yet have production database storage for per-user records.

Sign-in gates the whole workspace, not just train lookup. Login automatically starts the Okta-hosted flow and defaults to Website Audit through the root redirect; explicit safe tool return paths are preserved. The app retains only compact connecting, setup and manual-retry states instead of a second promotional login page. Browser histories retain their existing storage boundaries; global authentication does not make them per-user or shared records.

## Success criteria

In under 30 seconds, the user should understand:

1. What is changing?
2. When is it changing?
3. What part of the commute may be affected?
4. Should they reconsider train versus car?
