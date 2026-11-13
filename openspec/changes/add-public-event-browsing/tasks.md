# Tasks

## 1. Project scaffold and tooling

- [x] 1.1 Scaffold a Next.js 16 app (App Router, TypeScript strict, Tailwind CSS 4, ESLint flat config) with pnpm and add Prettier with `eslint-config-prettier`, and verify `pnpm dev` serves the default page and `pnpm lint` and `pnpm exec tsc --noEmit` pass
- [x] 1.2 Add Vitest (node environment by default, jsdom for component tests) with React Testing Library and `@testing-library/jest-dom`, and verify `pnpm test` runs and passes a placeholder test
- [x] 1.3 Add Playwright with Chromium and a `webServer` config that builds and starts the app, and verify `pnpm test:e2e` passes a smoke test that loads `/`
- [x] 1.4 Add Drizzle ORM and `@libsql/client` with a db client that reads `DATABASE_URL`, commit `.env.example`, git-ignore `data/`, and add `db:generate` and `db:migrate` scripts, and verify `pnpm db:migrate` runs without error against a fresh database file

## 2. Data model and seed data

- [x] 2.1 Add the Event schema (slug, title, description, image_url, venue_name, location, timezone, starts_at, ends_at, status) with UTC epoch-ms instants, a status `CHECK`, and a unique slug, generate its migration, and verify it applies to a fresh database and that dropping and re-applying gives an identical schema
- [x] 2.2 Add the TicketType schema (event_id foreign key, name, price_amount in minor units, currency, quantity_total, quantity_remaining, sale_starts_at, sale_ends_at) with the quantity and price `CHECK` constraints from design.md, generate its migration, and verify it applies to a fresh database and that dropping and re-applying gives an identical schema
- [x] 2.3 Write the idempotent seed script (`pnpm db:seed`, run with `tsx`) with dates relative to now and stable slugs covering every case in design.md "Seed data", and verify with a Vitest integration test that seeding a fresh database twice gives the same row counts
- [x] 2.4 Add `pnpm db:reset` (delete the database file, migrate, seed) and a Playwright global setup that resets and seeds `data/e2e.db`, and verify the smoke test from 1.3 runs against the seeded e2e database
- [x] 2.5 Document setup, the Playwright browser install, and the database and test commands in the README, and verify every documented command runs as written

## 3. Visibility, sale-state rules and formatting

- [x] 3.1 Implement `ticketTypeState` (HIDDEN, NOT_YET_ON_SALE, SOLD_OUT, AVAILABLE) with injected `now` and nullable sale bounds, and verify with Vitest unit tests for each state plus the inclusive sale-start and exclusive sale-end boundaries
- [x] 3.2 Implement `eventEnd` and `isListed` (published, not ended, has at least one visible ticket type), and verify with Vitest unit tests for draft, cancelled, in progress, ended, ended without end time, all sales closed, and no ticket types
- [x] 3.3 Implement `eventSummary` (FROM lowest available price, ON_SALE_FROM earliest start, SOLD_OUT), and verify with Vitest unit tests for each spec scenario under "Event ticket summary", including "cheapest available, not cheapest overall"
- [x] 3.4 Implement the price formatter (`Intl.NumberFormat`, from minor units with currency) and the date/time formatter (`Intl.DateTimeFormat` in the event's timezone), and verify with Vitest unit tests that 2500 EUR displays as EUR 25.00 (or the locale equivalent) and that an Amsterdam event at 20:00 local time displays as 20:00

## 4. Event list page

- [x] 4.1 Implement `listEvents(db, now)` with the database pre-filter from design.md, `isListed` for the final decision, and start time ascending order, and verify with a Vitest integration test against seed data that only the expected slugs come back, in order
- [x] 4.2 Render the event list at `/events` as an async Server Component with a 60-second cache window, redirect `/` to `/events`, and show title, start date and time in the event timezone, venue, image if present, ticket summary, and a link to the detail page, and verify with a Playwright test against seed data that events appear in the expected order with the expected summaries ("from EUR …", sold-out badge, "On sale from …") and that selecting an event opens its detail page
- [x] 4.3 Render the empty-state message when no events are listed, and verify with a React Testing Library component test for an empty list and a Vitest integration test that `listEvents` returns an empty list on an empty database
- [x] 4.4 Ensure the list page needs no auth or session, and verify with a Playwright test in a fresh browser context with no cookies or storage that `/events` responds 200 and shows the list

## 5. Event detail page

- [x] 5.1 Implement `getListedEventBySlug(db, slug, now)` that returns nothing for unknown slugs and for events where `isListed` is false, and verify with a Vitest integration test for an unknown slug and each hidden seed slug
- [x] 5.2 Add the `/events/[slug]` route that calls `notFound()` when the lookup returns nothing, and verify with a Playwright test that an unknown slug and each hidden seed slug show the not-found page with a `noindex` robots tag (soft 404: Next.js 16 serves request-time not-found with status 200, see design.md)
- [x] 5.3 Render event details (title, start and end in the event timezone, venue and location, description, image if present), and verify with a Playwright test against a seed event
- [x] 5.4 Render visible ticket types sorted by price ascending: AVAILABLE with price and "N left", SOLD_OUT with price and a sold-out badge, NOT_YET_ON_SALE with price and "On sale from <date time>"; omit HIDDEN types. Verify with a React Testing Library component test for each state and a Playwright test against the mixed-ticket seed event
- [x] 5.5 Ensure the detail page needs no auth or session, and verify with a Playwright test in a fresh browser context with no cookies or storage that a listed event's detail page responds 200 and shows its details

## 6. Integration check

- [x] 6.1 On freshly seeded data run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm test:e2e`, and verify all pass and that every scenario in `specs/event-catalog/spec.md` maps to at least one passing test (scenario-to-test checklist), then spot-check both pages in a browser for layout and readability

## Workflow follow-up

- Archive the change after review and merge, which creates `openspec/specs/event-catalog/spec.md`.
