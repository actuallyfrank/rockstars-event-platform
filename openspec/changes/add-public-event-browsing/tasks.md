# Tasks

## 1. Data model and seed data

- [ ] 1.1 Confirm the chosen stack's project scaffold runs locally and verify the dev server starts and the test runner executes an empty suite
- [ ] 1.2 Add the Event schema (slug, title, description, image_url, venue_name, location, timezone, starts_at, ends_at, status) with a unique slug, and verify the migration applies cleanly and rolls back
- [ ] 1.3 Add the TicketType schema (event_id, name, price_amount in minor units, currency, quantity_total, quantity_remaining, sale_starts_at, sale_ends_at) and verify the migration applies cleanly and rolls back
- [ ] 1.4 Write an idempotent seed script with dates relative to now covering every case in design.md "Seed data", and verify that running it twice gives the same row counts
- [ ] 1.5 Document the seed command in the README and verify the documented command runs as written

## 2. Visibility and sale-state rules

- [ ] 2.1 Implement `ticketTypeState` (HIDDEN, NOT_YET_ON_SALE, SOLD_OUT, AVAILABLE) with injected `now` and nullable sale bounds, and verify with unit tests for each state plus the inclusive sale-start and exclusive sale-end boundaries
- [ ] 2.2 Implement `eventEnd` and `isListed` (published, not ended, has at least one visible ticket type), and verify with unit tests for draft, cancelled, in progress, ended, ended without end time, all sales closed, and no ticket types
- [ ] 2.3 Implement `eventSummary` (FROM lowest available price, ON_SALE_FROM earliest start, SOLD_OUT), and verify with unit tests for each spec scenario under "Event ticket summary", including "cheapest available, not cheapest overall"

## 3. Event list page

- [ ] 3.1 Implement the catalog query that returns listed events sorted by start time ascending, using `isListed` for the final decision, and verify with an integration test against seed data that only the expected events come back, in order
- [ ] 3.2 Render the public event list (title, start date and time in the event timezone, venue, image if present, ticket summary, link to detail), and verify with a page test against seed data
- [ ] 3.3 Render the empty state message when no events are listed, and verify with a page test against an empty dataset
- [ ] 3.4 Ensure the list page needs no auth or session, and verify with a test that requests it with no cookies and gets a success response

## 4. Event detail page

- [ ] 4.1 Implement the `/events/<slug>` lookup that returns not-found for unknown slugs and for events where `isListed` is false, and verify with tests for an unknown slug and each hidden seed event
- [ ] 4.2 Render event details (title, start and end in the event timezone, venue and location, description, image if present), and verify with a page test against a seed event
- [ ] 4.3 Render visible ticket types sorted by price ascending: AVAILABLE with price and "N left", SOLD_OUT with price and badge, NOT_YET_ON_SALE with price and "On sale from <date time>"; hide HIDDEN types. Verify with a page test against the mixed-ticket seed event
- [ ] 4.4 Format prices from minor units with their currency, and verify with a unit test (2500 EUR displays as EUR 25.00 or the locale equivalent)
- [ ] 4.5 Ensure the detail page needs no auth or session, and verify with a test that requests it with no cookies and gets a success response

## 5. Integration check

- [ ] 5.1 Walk through the spec scenarios end to end against freshly seeded data in a browser (list order, summaries, navigation to detail, ticket states, direct URLs of hidden events returning not-found), and verify that every scenario in `specs/event-catalog/spec.md` behaves as written

## Workflow follow-up

- Archive the change after review and merge, which creates `openspec/specs/event-catalog/spec.md`.
