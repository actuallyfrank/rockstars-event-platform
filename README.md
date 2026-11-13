# Rockstars event platform

Visitors browse upcoming events and their tickets. Later changes add ticket purchase and organiser tooling.

- Requirements: [`openspec/`](openspec/)
- Tech stack and decisions: [`docs/tech-stack.md`](docs/tech-stack.md), [`docs/adr/`](docs/adr/)

## Prerequisites

- Node.js 24 LTS
- pnpm 11 (`corepack enable` picks up the version pinned in `package.json`)

No Docker or external services are needed. The database is a local SQLite file.

## Setup

```bash
pnpm install
cp .env.example .env.local        # sets DATABASE_URL=file:./data/dev.db
pnpm db:reset                     # create, migrate and seed data/dev.db
pnpm exec playwright install chromium   # one-time browser download for e2e tests
pnpm dev                          # http://localhost:3000
```

The database location is set only by `DATABASE_URL`. Anything already in the environment overrides `.env.local`, for example `DATABASE_URL=file:./data/other.db pnpm db:reset`.

## Commands

| Purpose                                          | Command                             |
| ------------------------------------------------ | ----------------------------------- |
| Dev server                                       | `pnpm dev`                          |
| Production build / start                         | `pnpm build` / `pnpm start`         |
| Generate a migration from `db/schema.ts`         | `pnpm db:generate`                  |
| Apply migrations                                 | `pnpm db:migrate`                   |
| Seed (idempotent, dates relative to now)         | `pnpm db:seed`                      |
| Reset local DB (delete file, migrate, seed)      | `pnpm db:reset`                     |
| Unit, integration and component tests (Vitest)   | `pnpm test`                         |
| Vitest in watch mode                             | `pnpm test:watch`                   |
| Page and e2e tests (Playwright, builds the app)  | `pnpm test:e2e`                     |
| All tests                                        | `pnpm test:all`                     |
| Lint                                             | `pnpm lint`                         |
| Type-check (generates Next.js route types first) | `pnpm typecheck`                    |
| Format / check formatting                        | `pnpm format` / `pnpm format:check` |

Before finishing a task, run `pnpm lint`, `pnpm format:check`, `pnpm typecheck` and `pnpm test:all`.

## Database

- Schema: `db/schema.ts`. Migrations are generated into `drizzle/` and committed. Drizzle has no down migrations: undo a shared migration with a new forward migration.
- Instants are stored as UTC epoch milliseconds, and each event has an IANA timezone for display. Prices are integer minor units plus an ISO 4217 currency.
- Seed data (`db/seed.ts`) covers every catalog state under stable slugs (`SEED_SLUGS`). Re-run `pnpm db:seed` (or `pnpm db:reset`) to move the relative dates forward.
- Local database files live in `data/`, which is git-ignored.

## Tests

- **Vitest** (`pnpm test`): `*.test.ts` files run in Node (rules, formatters, and integration tests against a fresh temp-file database). `*.test.tsx` files run in jsdom with React Testing Library.
- **Playwright** (`pnpm test:e2e`): runs Chromium against a production build on port 3100. Global setup resets and seeds `data/e2e.db` before each run. It needs the one-time `pnpm exec playwright install chromium`. Traces are kept on failure: `pnpm exec playwright show-trace test-results/<test>/trace.zip`.
