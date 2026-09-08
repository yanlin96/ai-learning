# Progress

Last updated: 2026-09-08

## Working now

- Next.js dashboard dynamically reads 17 metropolitan train lines from the official GTFS Schedule without downloading the entire ZIP.
- Reminder CRUD supports create, read, edit, pause, and delete with one daily time per line.
- The read-only dashboard is separate from the `/reminders` CRUD page.
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
- Website audits support an optional OpenAI-written evidence summary while remaining useful without an OpenAI API key.
- Robots wildcard and User-Agent precedence behavior is covered by focused regression tests, including the `/*.mvc` false-positive case.
- SEO and AI-visibility scores now use tested weighted rules, ratings, and evidence confidence rather than equal per-finding deductions.
- Broken links are collected from initial and rendered DOMs and displayed with link text, scope, source, URL, and failure evidence.
- Reports provide a direct SEO follow-up link to Google Search Console URL Inspection.
- `/history` keeps summaries of the current browser tab's audit runs in session storage.
- `/smoke-test` checks manually prioritised and sitemap-discovered pages with up to 100 HTTP checks and Playwright verification for up to 20 priority or suspicious pages.
- Smoke-test reports show page-level HTTP, response time, metadata/error evidence, and an overall Pass, Pass with warnings, or Fail recommendation.

## Not configured yet

- No production deployment, database, or scheduler is configured.
- Tuesday and Thursday 6:00 am Melbourne reminders are therefore not running automatically.
- Duplicate-notification prevention and day-of-week schedules are not implemented.
- Automated tests for GTFS classification and Telegram formatting are not implemented.
- Production authentication for the manual-send button is not implemented; the endpoint is intentionally development-only.
- Website audits are synchronous, limited to one page and 80 links, and do not verify private AI indexes. Audit history is tab-local and disappears when the tab closes.
- Smoke tests do not yet execute authenticated user journeys, submit forms, support custom assertions, or persist run history.

## Current focus

Develop in small user-requested increments. The next likely product milestone is scheduling, but `docs/BACKLOG.md` is not authorization to start it.

## Verification baseline

```powershell
npm run typecheck
npm run build
```

When alert mapping changes, also inspect `/api/disruptions` against the current official feed.
