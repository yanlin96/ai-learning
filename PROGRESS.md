# Progress

Last updated: 2026-09-15

## Working now

- Workspace header is mounted once in the shared authenticated layout. Internal links use Next.js Link; account/daily brief and desktop sidebar choices survive route changes. Home remains sidebar-free and mobile navigation releases its drawer scroll lock.

- Next.js dynamically reads the current metropolitan train-line catalog from the official GTFS Schedule without downloading the entire ZIP.
- Reminder CRUD supports create, read, edit, pause, and delete with one daily time per line.
- `/` is a sidebar-free Tailwind workspace launchpad with a dark cyan-accented hero, personalised welcome and actionable tool cards. Its compact header keeps branding, account and daily brief without sidebar space or mobile drawer. Feature pages retain the full navigation; `/website-audit` retains the existing input-first audit tool and reminder CRUD remains separate.
- `/disruptions` combines searchable selection of every metropolitan train line with its live service and station notices in one workflow.
- All workspace pages and business APIs now require an Okta-backed Auth.js session, including audit, smoke, history, reminders and daily brief. Middleware and server workspace/API guards both enforce access. The bearer-protected cron endpoint remains independent.
- `/login` automatically starts the existing Auth.js Okta redirect without a duplicate promotional gateway. It retains compact Tailwind setup/error/retry states and safe local return paths; errors never auto-retry. `/train-login` forwards legacy links. OAuth callbacks and framework assets remain reachable.
- The production site is available at `https://cpatools.gylxxgroup.com`; Vercel serves the custom domain over HTTPS and exposes the Okta callback at `/api/auth/callback/okta`.
- Reminder entry and manual Telegram actions are hidden from the shared navigation and public train-status UI; the underlying reminder routes and APIs remain intact.
- Header and footer components are shared across both pages.
- The shared header, account control, desktop sidebar, and mobile toolbox drawer now use Tailwind CSS v4 utilities with larger navigation labels and touch targets. Tailwind Preflight remains disabled while feature-page styles are migrated incrementally.
- Reminder deletion uses a custom confirmation dialog rather than the browser prompt.
- Selected reminders persist in `data/subscriptions.json` through an isolated storage adapter.
- Alerts are filtered for a selected line and expired alerts are excluded.
- The UI shows useful event titles, Melbourne active periods, and supplemental descriptions.
- Disruption cards present year-inclusive active periods and affected lines as distinct, labelled metadata so long-running notices are easy to interpret.
- Replacement buses and relevant parking/access notices are both treated as commute-decision information for subscribed lines.
- Telegram Bot credentials and Transport Victoria credentials remain server-side.
- A protected Telegram test endpoint can verify Bot connectivity.
- A local-development manual-send button sends current updates for all enabled subscriptions.
- A protected scheduled-check endpoint reads each enabled line's configured Melbourne reminder time.
- Type checking and production build pass.
- `/website-audit` accepts one public URL and reports broken links, baseline SEO, AI crawler access, and raw-versus-rendered text differences.
- The Tailwind audit landing page puts URL input first, without the oversized example report. Example input takes keyboard focus; brief workflow guidance and honest pending feedback support the primary action.
- The audit landing page uses a tighter weather-to-hero rhythm without the redundant quality tagline, and a consistent monitor-check brand mark across the site chrome and browser icon.
- The shared header carries a responsive Melbourne daily brief across the workspace: cached Open-Meteo conditions and live Werribee Line status load without blocking the active workflow.
- Website audits support an optional OpenAI-written evidence summary while remaining useful without an OpenAI API key.
- Robots wildcard and User-Agent precedence behavior is covered by focused regression tests, including the `/*.mvc` false-positive case.
- SEO and AI-visibility scores now use tested weighted rules, ratings, and evidence confidence rather than equal per-finding deductions.
- Broken links are collected from initial and rendered DOMs and displayed with link text, scope, source, URL, and failure evidence.
- Bot-blocked, rate-limited, timed-out, and unanswered link checks are reported as inconclusive instead of broken.
- Successful 2xx links and followed 3xx redirect chains are available in the audit report as non-error evidence.
- Successful-link evidence is collapsed by default, and unchecked-link copy distinguishes the 80-link cap from the time budget.
- Google specialist tools remain available in the sidebar; the repeated Google component has been removed from the audit report.
- A low-emphasis persistent desktop rail keeps Website Audit primary while Google SEO tools, release checks, reports, and train status live in collapsible supporting groups; smaller screens use the same hierarchy in a Tools drawer.
- Workspace navigation now uses readable desktop typography, higher-contrast supporting copy, and larger interaction targets; the train sign-in route presents a compact CPA Tools access gateway without changing the Okta-hosted authentication flow.
- The shared header displays a compact signed-in identity menu with initials, account details, and sign-out; anonymous visitors receive a direct sign-in action.
- Supporting navigation follows the working sequence: Release Workflow precedes Google Search Tools, whose links run Search Console, PageSpeed Insights, then Rich Results Test.
- Release Workflow is expanded by default and contains Smoke Testing and Smoke Test History. Audit History has a separate primary-group entry; the histories no longer share report tabs.
- `/history` keeps findings, evidence, impact, fixes, priority actions and coverage for new audit runs in session storage. Tailwind history cards support search, expansion and a prefilled rerun; older summaries clearly state that details were not saved.
- `/smoke-test` checks manually prioritised and sitemap-discovered pages with up to 100 HTTP checks and Playwright verification for up to 20 priority or suspicious pages.
- Smoke-test setup includes Quick, Standard, and Full scope presets; smoke history provides a pre-filled Run again action.
- Smoke-test reports show page-level HTTP, response time, metadata/error evidence, and an overall Pass, Pass with warnings, or Fail recommendation.
- `/smoke-test/history` stores compact results for every checked URL, grouped into at most 10 domains with 10 recent runs per domain. The live report and historical run details share a Tailwind URL explorer with search, status filters and 20-row pagination. Legacy issue samples remain available, and failed browser-history writes show a warning.

## Not configured yet

- No production database or scheduler is configured.
- Tuesday and Thursday 6:00 am Melbourne reminders are therefore not running automatically.
- Duplicate-notification prevention and day-of-week schedules are not implemented.
- Automated tests for GTFS classification and Telegram formatting are not implemented.
- Production authentication for the manual-send button is not implemented; the endpoint is intentionally development-only.
- Website audits are synchronous, limited to one page and 80 links, and do not verify private AI indexes. Audit history is tab-local and disappears when the tab closes.
- Smoke tests do not yet execute authenticated user journeys, submit forms, support custom assertions, or share history across browsers/users. History is browser-local only.

## Current focus

Develop in small user-requested increments. The next likely product milestone is scheduling, but `docs/BACKLOG.md` is not authorization to start it.

## Verification baseline

2026-09-15 persistent shell: 38 unit tests, type checking and isolated production build pass. Fixture-session browser navigation across home/audit/history/smoke and the mobile drawer records one document load, one account fetch and one brief fetch. Desktop collapsed state survives navigation; home sidebar visibility/offset and mobile scroll-lock cleanup are correct, without client exceptions.

2026-09-15 direct Okta handoff: 38 unit tests, type checking and isolated production build pass. Local browser checks mock auth initiation (no real Okta login) and verify one automatic start, CSRF submission, preserved local callback, no error auto-loop, explicit retry and rejected external return URLs.

2026-09-15 sidebar-free home: type checking and isolated production build pass. Fixture-session browser checks cover desktop home without sidebar/left offset, feature-page sidebar, mobile feature drawer, returning home without scroll lock or horizontal overflow, and unchanged login requirements.

2026-09-15 workspace login/home: 38 unit tests pass. Production builds and type checking pass; a separate `.next-workspace-check` build avoids the active dev server's `.next` manifest collision. Local production-browser checks use ephemeral fixture sessions only and cover all page redirects, business API 401s, expired/invalid sessions, independent cron denial, auth/assets access, missing-Okta fail-closed server guards, signed-in home/audit/history navigation, old audit URL links, prefill and desktop/390px layouts without client exceptions. No real Okta users, external crawls or mutations were involved.

```powershell
npm run typecheck
npm run build
```

When alert mapping changes, also inspect `/api/disruptions` against the current official feed.
