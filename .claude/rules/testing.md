# Testing rules

Applies to all code changes. Test each layer where it is cheapest to test reliably (ADR `docs/adr/0004-vitest-playwright.md`). A change is not done until its tests exist and pass.

## Unit tests (Vitest, Node)

- File: `*.test.ts` next to the code under test. Runs in the `node` Vitest project, with no DOM.
- Use them for pure logic: rules (`lib/catalog/rules.ts`), formatters, helpers.
- Never read the clock inside code under test. Pass `now` in, and use fixed instants in tests (`new Date("2026-12-10T19:00:00Z")`).
- No database, no Next.js imports, no network. Build inputs with the fixture helpers (`lib/catalog/test-fixtures.ts`, `test/fixtures/`).
- Cover every relevant spec scenario. Prefix those test names with `spec:` so the scenario-to-test mapping stays easy to check.
- Test boundaries explicitly: inclusive and exclusive edges, null and empty inputs, and timezone and DST cases for date logic.

## Integration tests (Vitest, real SQLite)

- File: `*.test.ts`, also in the `node` project. Use them for queries, migrations, the seed, and anything else that touches the database.
- Give each test its own fresh migrated database: `createTestDb()` from `@/test/db`, then `destroy()` it in `afterEach`. Never use `data/dev.db` or `data/e2e.db`.
- Seed with a fixed `now`: `seed(db, now)`. Refer to seed cases by `SEED_SLUGS`, `LISTED_SEED_SLUGS` and `HIDDEN_SEED_SLUGS`, never by position or by date text.
- Check constraint failures with `rejectsWithSqlError(query, /pattern/)`. Drizzle wraps SQLite errors, so assert on the constraint name.
- Schema changes need a migration test: the change applies to a fresh database, and a rebuild gives an identical schema (`dumpSchema`).

## Accessibility: required for every component and page

Accessibility is part of "tested". A component or page without an axe check is untested.

### Components (Vitest + React Testing Library, jsdom)

- File: `*.test.tsx` next to the component. It runs in the `component` Vitest project.
- Every component must have a `describe("accessibility")` block that calls `expectNoA11yViolations(container)` from `@/test/a11y` for **each visual state** (for example empty, populated, sold out, not yet on sale, with and without an image). A small subcomponent such as `Badge` or `DateTime` may be covered through its parent's test, but only if every one of its variants renders in an axe-checked state.
- The helper checks WCAG 2.2 A/AA with axe-core. It skips `color-contrast`, because jsdom can't compute colours. Contrast is covered by the page tests.
- Query the way a user perceives the page: `getByRole` with an accessible name first, then `getByLabelText` and `getByText`. Use `data-testid` only when no accessible query fits.
- Add explicit assertions for semantics axe can't judge: heading levels, landmark and region names, list structure, link names, decorative images (`alt=""`), and states shown as text rather than colour alone.

### Pages (Playwright, real browser)

- Every route and every page state (including empty and not-found) must appear in `e2e/accessibility.spec.ts`. It runs `expectNoA11yViolations(page)` from `e2e/a11y.ts` in **both light and dark** colour schemes, and that check includes colour contrast.
- The structure checks there must keep passing for new pages: `lang` is set, there is a non-empty `<title>`, exactly one `h1`, and one `main` landmark.
- Every interactive flow needs a keyboard-only Playwright test (Tab, Enter or Space; no mouse) and must show a visible focus state.
- Don't silence a violation by disabling an axe rule or excluding an element. Fix the markup. If an exception really is unavoidable, scope it to one selector, add a comment explaining why, and say so in the change summary.

## Before calling a task done

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e`. All must pass. Report failures with their output; don't skip or weaken a test to get green.
