# Product

## Purpose

Line Watch Melbourne helps commuters decide how to travel before leaving home.

The important question is not simply:

> Is the Werribee Line running?

It is:

> Is there anything that should change whether I take the train, drive, leave earlier, or make another plan?

## Current user

- Travels in metropolitan Melbourne and depends on one or more train lines.
- Wants a quick answer without repeatedly checking transport websites.
- Wants a different daily reminder time for each selected line.
- Uses Telegram for personal notifications.

## Current product behaviour

- Loads the current metropolitan train-line catalog from official GTFS data.
- Allows reminders to be created, viewed, edited, paused, and deleted.
- Keeps service information on the read-only home dashboard and reminder mutations on `/reminders`.
- Uses an in-app confirmation dialog before deleting a reminder.
- Stores one reminder time for each selected line.
- Shows current and upcoming alerts for selected lines.
- Includes replacement buses, planned works, delays, closures, and relevant station parking/access notices.
- Separates the event title, active period, and supporting detail.
- Shows a manual Telegram button whenever useful updates exist.
- The manual button is intended for local testing.
- A scheduled endpoint can send the same useful updates automatically.
- A separate `/website-audit` tool checks one public webpage for broken links, baseline SEO, and AI-crawler accessibility.
- Website audits compare initial HTML with a JavaScript-rendered DOM when Chromium is available; they never claim to verify a provider's private search index.
- Audit scores use weighted technical signals and display evidence confidence; they are diagnostic summaries, not Google rankings.
- Broken-link results include link text, internal/external scope, source DOM, URL, and response failure. Reports link to Google Search Console URL Inspection for authoritative SEO follow-up.

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

The commute assistant currently supports metropolitan train lines, one local installation, one dashboard, and Telegram notifications. The repository also contains an intentionally separate single-page website-audit utility. It does not yet have user accounts or production database storage.

## Success criteria

In under 30 seconds, the user should understand:

1. What is changing?
2. When is it changing?
3. What part of the commute may be affected?
4. Should they reconsider train versus car?
