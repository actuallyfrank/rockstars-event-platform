# 0004. Vitest, React Testing Library and Playwright

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The tasks need four kinds of tests: unit tests for the pure rules module (every spec scenario, with `now` injected), integration tests for the catalog query against seeded data, page tests for the list and detail pages, and an end-to-end check of every spec scenario in a browser (task 5.1).

Some behaviour can only be checked in a real browser against the running app: routing, the not-found page for hidden events, rendering of async Server Components, timezone display, and caching. We also want the work to be checkable in a browser by people and coding agents, not only by reading tests.

## Options considered

- **Vitest + Playwright**: Vitest for unit and integration, Playwright for real-browser page and e2e tests.
- **Jest + Playwright**: same split, slower, more friction with ESM/TypeScript.
- **Vitest + React Testing Library only**: one runner, but page tests run in jsdom, async Server Components need workarounds, and the browser check would be manual.

## Decision

Use **Vitest** for unit and integration tests, **React Testing Library** (with `@testing-library/jest-dom`) for component tests, and **Playwright** (`@playwright/test`, 1.x) for page and end-to-end tests in a real browser.

| Layer | Tool | Runs against | Covers |
| --- | --- | --- | --- |
| Unit | Vitest (`node` env) | Plain objects, fixed `now` | Rules module (`ticketTypeState`, `isListed`, `eventSummary`), price/date formatters |
| Integration | Vitest (`node` env) | Fresh libSQL DB (temp file or `:memory:`), migrated + seeded | Catalog query and slug lookup |
| Component | Vitest + RTL (`jsdom`) | Fixture props | Presentational components: ticket row states, badges, summary text |
| Page / e2e | Playwright | Production build (`next build` + `next start`) on a seeded e2e DB | List and detail pages, navigation, not-found page for hidden/unknown slugs, timezone display, no-auth access |

Playwright setup:

- `playwright.config.ts` uses `webServer` to build and start the app with `DATABASE_URL=file:./data/e2e.db`. A global setup resets, migrates and seeds that database before the run.
- Chromium only to start with. More browsers can be added later as projects in the config.
- The seed uses dates relative to now, so its states stay correct whenever the suite runs. Tests find events by seed slug, not by position or date text that changes over time.
- Not-found tests check the not-found page and its `noindex` robots tag, not the HTTP status. Next.js 16 streams the page shell before a request-time `notFound()` runs, so the status stays 200 (a soft 404). See the change's design.md.
- No-auth tests (tasks 3.4, 4.5) use a fresh browser context with no cookies or storage and expect a 200 response with the page content.
- Traces are kept on failure (`trace: "retain-on-failure"`) to make debugging easier.

Planned scripts: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm test:all` (both).

## Consequences

- **Task 5.1 becomes an automated Playwright suite** that covers the spec scenarios end to end. Run it before marking the change done. A manual look in the browser is still useful for visual polish.
- **Page tests (tasks 3.2, 3.3, 4.2, 4.3) use Playwright** against seeded data. That means no rendering async Server Components in jsdom.
- The empty-catalog test (task 3.3) needs an empty database. Use a separate Playwright project or server with its own empty DB file, or cover the empty state with a component test plus an integration test of the query.
- Running Playwright needs a one-time browser download (`pnpm exec playwright install chromium`). This goes in the README.
- e2e runs are slower because they need a production build. Use Vitest for the inner loop and Playwright before finishing a task.
- `data/e2e.db`, `test-results/` and `playwright-report/` are git-ignored.
