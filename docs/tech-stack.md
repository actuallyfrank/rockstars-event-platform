# Tech Stack

The chosen technologies for the Rockstars event platform, in one place. Each choice has an Architecture Decision Record (ADR) in [`adr/`](adr/) with the context, the options considered, and the consequences.

Requirements live in OpenSpec (`openspec/`). This document covers only *how* we build, not *what*.

## Summary

| Area | Choice | Version line* | ADR |
| --- | --- | --- | --- |
| Language | TypeScript (strict) | 7.x | [0001](adr/0001-nextjs-app-router.md) |
| Framework | Next.js, App Router, React Server Components | 16.x (React 19) | [0001](adr/0001-nextjs-app-router.md) |
| Runtime / package manager | Node.js 24 LTS, pnpm | Node 24, pnpm 11 | [0001](adr/0001-nextjs-app-router.md) |
| Database | SQLite via libSQL (local file) | — | [0002](adr/0002-sqlite-libsql.md) |
| Database driver | `@libsql/client` | 0.18.x | [0002](adr/0002-sqlite-libsql.md) |
| ORM / migrations | Drizzle ORM + drizzle-kit | 0.45.x / 0.31.x | [0003](adr/0003-drizzle-orm.md) |
| Unit, integration, component tests | Vitest + React Testing Library | 5.x / 16.x | [0004](adr/0004-vitest-playwright.md) |
| Page + end-to-end tests (browser) | Playwright (Chromium) | 1.x | [0004](adr/0004-vitest-playwright.md) |
| Styling | Tailwind CSS | 4.x | [0005](adr/0005-tailwind-css.md) |
| Lint / format | ESLint (Next.js flat config) + Prettier | 10.x / 3.x | [0006](adr/0006-eslint-prettier.md) |
| Hosting / deployment | Out of scope for this project | — | — |

\* Latest stable lines on npm when this was written (2026-11-13). Exact versions are pinned in `package.json` and the lockfile at scaffold time; this table is not updated on every patch.

## How the stack maps to the design

How the choices meet the constraints in `openspec/changes/add-public-event-browsing/design.md`:

- **Visibility and sale-state rules** are a pure TypeScript module (`ticketTypeState`, `isListed`, `eventSummary`) with no framework or database imports. `now` is passed in. Tested with Vitest unit tests only.
- **Public pages** are async Server Components that read the database on the server. No public API is needed for this change. The cache window stays at 60 seconds or less (design.md, Risks).
- **Not-found** for unknown or hidden events uses Next.js `notFound()` from the detail page after the `isListed` check. This is a soft 404: Next.js 16 serves it with status 200 plus a `noindex` robots tag.
- **Instants** are stored in UTC as integer epoch milliseconds (Drizzle `integer({ mode: "timestamp_ms" })`), because SQLite has no native timestamp type. Each event keeps its IANA `timezone`.
- **Display formatting** uses the built-in `Intl.DateTimeFormat` (with `timeZone` set to the event's timezone) and `Intl.NumberFormat` (with `style: "currency"`). No date or money library.
- **Prices** are stored as integer minor units plus an ISO 4217 currency code.
- **Seed data** is an idempotent TypeScript script, run with `tsx`, that upserts by slug and computes dates relative to the current time.

## Local development

Target workflow. Commands become real once the scaffold exists (task 1.1) and are documented in the README (task 1.5).

| Purpose | Command (planned) |
| --- | --- |
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Generate migration from schema | `pnpm db:generate` |
| Apply migrations | `pnpm db:migrate` |
| Seed (idempotent) | `pnpm db:seed` |
| Reset local DB (drop file, migrate, seed) | `pnpm db:reset` |
| Unit + integration + component tests (Vitest) | `pnpm test` |
| Install Playwright browser (one-time) | `pnpm exec playwright install chromium` |
| Page + e2e tests (Playwright, builds the app on a seeded e2e DB) | `pnpm test:e2e` |
| All tests | `pnpm test:all` |
| Lint / format | `pnpm lint` / `pnpm format` |

Configuration comes from environment variables, with `.env.example` committed and `.env.local` ignored:

- `DATABASE_URL`: `file:./data/dev.db` locally. Vitest integration tests use a temp file or `:memory:`. Playwright uses `file:./data/e2e.db`, which is reset and seeded before each run.

No Docker or external services are needed to run the app locally.

## Out of scope

- **Hosting and deployment**: no hosting target is chosen and none is part of this project. The app should stay portable: database location set only by `DATABASE_URL`, and nothing that only works on one host.

## Changing a decision

Add a new ADR that supersedes the old one (set the old one's status to `Superseded by NNNN`), then update the summary table above. Copy the structure of an existing ADR: Status, Date, Context, Options considered, Decision, Consequences.
