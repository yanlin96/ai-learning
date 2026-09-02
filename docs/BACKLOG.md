# Backlog

This file records ideas, not commitments. Work on an item only when the user asks for it.

## Next likely steps

- [ ] Choose and configure a scheduler for Tuesday and Thursday at 6:00 am Melbourne time.
- [ ] Handle Melbourne daylight saving without manual schedule changes.
- [ ] Prevent duplicate Telegram notifications for the same alert.
- [ ] Add focused tests for GTFS alert mapping and classification.
- [ ] Add message-format snapshot tests.
- [ ] Improve the dashboard's explanation of how each update affects train-versus-car choice.

## Later possibilities

- [ ] Let the user configure travel days in addition to the existing reminder time.
- [ ] Add origin/destination or preferred stations.
- [ ] Include expected replacement-bus travel-time advice when official data provides it.
- [ ] Add a notification history.
- [ ] Replace local JSON persistence with a production database when deployment requires it.
- [ ] Add production authentication for the manual-send button if needed.

## Questions to answer before scheduling

- Should a normal/all-clear message ever be sent?
- Should repeated alerts be sent again when their content changes?
- Which scheduler/deployment platform will host the job?
- How late can a 6:00 am notification arrive and still be useful?
