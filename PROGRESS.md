# Progress

Last updated: 2026-09-14

## Working now

- Next.js dynamically reads the current metropolitan train-line catalog from the official GTFS Schedule without downloading the entire ZIP.
- Reminder CRUD supports create, read, edit, pause, and delete with one daily time per line.
- The read-only dashboard is separate from the `/reminders` CRUD page.
- `/disruptions` combines searchable selection of every metropolitan train line with its live service and station notices in one workflow.
- `/disruptions`, `/api/disruptions`, and `/api/lines` now require an Okta-backed Auth.js session. The landing-page brief keeps weather public but hides train evidence before login.
- `/train-login` provides an Okta sign-in action when configured and a safe setup state while credentials are absent.
- The production site is available at `https://cpatools.gylxxgroup.com`; Vercel serves the custom domain over HTTPS and exposes the Okta callback at `/api/auth/callback/okta`.
- Reminder entry and manual Telegram actions are hidden from the shared navigation and public train-status UI; the underlying reminder routes and APIs remain intact.
- Header and footer components are shared across both pages.
- Reminder deletion uses a custom confirmation dialog rather than the browser prompt.
- Selected reminders persist in `data/subscriptions.json` through an isolated storage adapter.
- Alerts are filtered for a selected line and expired alerts are excluded.
- The UI shows useful event titles, Melbourne active periods, and supplemental descriptions.
- Replacement buses and relevant parking/access notices are both treated as commute-decision information for subscribed lines.
- Telegram Bot credentials and Transport Victoria credentials remain server-side.
- A protected Telegram test endpoint can verify Bot connectivity.
- A local-development manual-send button sends current updates for all enabled subscriptions.
- A protected scheduled-check endpoint reads each enabled line's configured Melbourne reminder time.
- Type checking and production build pass.
- `/website-audit` accepts one public URL and reports broken links, baseline SEO, AI crawler access, and raw-versus-rendered text differences.
- The website-audit landing page now pairs its primary URL action with an example report, low-friction example input, trust cues, staged run feedback, and a next-action verdict at the top of completed reports.
- The audit landing page uses a tighter weather-to-hero rhythm without the redundant quality tagline, and a consistent monitor-check brand mark across the site chrome and browser icon.
- The shared header carries a responsive Melbourne daily brief across the workspace: cached Open-Meteo conditions and live Werribee Line status load without blocking the active workflow.
- Website audits support an optional OpenAI-written evidence summary while remaining useful without an OpenAI API key.
- Robots wildcard and User-Agent precedence behavior is covered by focused regression tests, including the `/*.mvc` false-positive case.
- SEO and AI-visibility scores now use tested weighted rules, ratings, and evidence confidence rather than equal per-finding deductions.
- Broken links are collected from initial and rendered DOMs and displayed with link text, scope, source, URL, and failure evidence.
- Bot-blocked, rate-limited, timed-out, and unanswered link checks are reported as inconclusive instead of broken.
- Successful 2xx links and followed 3xx redirect chains are available in the audit report as non-error evidence.
- Successful-link evidence is collapsed by default, and unchecked-link copy distinguishes the 80-link cap from the time budget.
- Reports and the shared company toolbox link to PageSpeed Insights, Rich Results Test, and Search Console.
- A low-emphasis persistent desktop rail keeps Website Audit primary while Google SEO tools, release checks, reports, and train status live in collapsible supporting groups; smaller screens use the same hierarchy in a Tools drawer.
- Workspace navigation now uses readable desktop typography, higher-contrast supporting copy, and larger interaction targets; the train sign-in route presents a compact CPA Tools access gateway without changing the Okta-hosted authentication flow.
- The shared header displays a compact signed-in identity menu with initials, account details, and sign-out; anonymous visitors receive a direct sign-in action.
- Supporting navigation follows the working sequence: Release Workflow precedes Google Search Tools, whose links run Search Console, PageSpeed Insights, then Rich Results Test.
- Release Workflow is expanded by default so Smoke Testing and Reports remain immediately discoverable, while users can still collapse the group when they want a quieter sidebar.
- `/history` keeps summaries of the current browser tab's audit runs in session storage.
- `/smoke-test` checks manually prioritised and sitemap-discovered pages with up to 100 HTTP checks and Playwright verification for up to 20 priority or suspicious pages.
- Smoke-test setup includes Quick, Standard, and Full scope presets; smoke history provides a pre-filled Run again action.
- Smoke-test reports show page-level HTTP, response time, metadata/error evidence, and an overall Pass, Pass with warnings, or Fail recommendation.
- `/smoke-test/history` stores compact run summaries in local storage, grouped into at most 10 domains with 10 recent runs per domain.

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

```powershell
npm run typecheck
npm run build
```

When alert mapping changes, also inspect `/api/disruptions` against the current official feed.
