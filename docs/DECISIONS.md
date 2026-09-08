# Decisions

This is a lightweight decision log. Add an entry when a choice would otherwise be easy to forget or accidentally reverse.

## 2026-09-08 — Keep smoke testing broad, deterministic, and separate

Release smoke testing lives at `/smoke-test` rather than expanding the single-page deep audit. It checks up to 100 same-origin URLs, prioritising manually supplied critical paths before sitemap entries. All selected pages receive HTTP and markup checks; up to 20 priority or suspicious pages receive Playwright verification using one shared browser. It never calls OpenAI and does not perform form submissions. A clear Pass, Pass with warnings, or Fail result is more actionable for release decisions than another numeric score.

Smoke testing and deep auditing share `lib/public-web.ts` so redirects, browser documents, scripts, and stylesheets retain the same SSRF protections. Missing metadata, `noindex`, redirects, console errors, and failed critical resources are warnings; request failures, HTTP errors, visible application-error text, empty rendered bodies, and uncaught page errors fail the run.

## 2026-09-02 — Keep website audit evidence deterministic

Broken-link status, robots rules, metadata, and raw-versus-rendered content measurements come from code and captured HTTP/browser evidence. OpenAI may summarize those findings, but it must not invent measurements or claim that a page is present in a provider's private index.

Crawler reporting keeps three facts separate: robots permission, HTTP response, and overall reachability. Only `robotsAllowed: false` may be described as blocked by robots.txt; HTTP rejection and an unavailable robots file require different language.

Robots wildcard and precedence rules are delegated to `robots-parser` and protected by regression tests. A prior prefix-only implementation turned `/*.mvc` into `/` and falsely blocked every page; do not reintroduce hand-written wildcard truncation.

The first audit is deliberately limited to one public page and 30 links. Public-target validation and request bounds are product requirements because the audit endpoint performs server-side network access.

Scores are weighted diagnostics rather than equal deductions per finding. Every score is paired with a rating, confidence, and short methodology. Confidence reflects evidence coverage and must fall when rendering, robots retrieval, or link coverage is incomplete. Google follow-up is intentionally limited to Search Console URL Inspection; performance and rich-result tools are outside this focused SEO handoff.

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
