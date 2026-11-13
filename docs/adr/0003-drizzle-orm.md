# 0003. Drizzle ORM and drizzle-kit migrations

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

We need a typed schema for Event and TicketType, versioned migrations, and queries for the catalog (pre-filter published and not-ended events, join ticket types). Tasks 1.2 and 1.3 ask to verify that migrations apply cleanly and roll back.

## Options considered

- **Drizzle ORM**: schema in TypeScript, SQL-like query API, small runtime, first-class SQLite/libSQL support. drizzle-kit generates SQL migrations but **not down migrations**.
- **Prisma**: mature, popular, Prisma Studio. Heavier client and its own schema language. Also no automatic down migrations.
- **Kysely**: typed query builder with hand-written up/down migrations. Matches the rollback wording literally, but means hand-maintaining schema types.

## Decision

Use **Drizzle ORM** with the libSQL driver, and **drizzle-kit** to generate SQL migrations from the TypeScript schema. Migrations are committed and applied with `drizzle-kit migrate` (or the programmatic migrator in scripts).

Schema conventions:

- Table and column names in `snake_case`, matching `design.md`.
- Instants: `integer("starts_at", { mode: "timestamp_ms" })`, always UTC.
- Money: `price_amount` integer (minor units) plus `currency` text (ISO 4217).
- `status` as text with a `CHECK` constraint; the TypeScript type is a string union.

## Consequences

- **Rollback is verified by rebuild, not by down migrations.** For tasks 1.2 and 1.3, "applies cleanly and rolls back" means: apply all migrations to a fresh database, and check that dropping the database and re-applying gives the same schema. Reversing a migration that is already shared is done with a new forward migration. The task wording should be updated to match (see OpenSpec change).
- Row types come from the schema (`typeof event.$inferSelect`), so the rules module and pages share one source of truth for shapes.
- The rules module takes plain objects, not Drizzle types, so it doesn't depend on the ORM.
- Drizzle is pre-1.0, so minor versions can include breaking changes. Pin versions and read the changelog before upgrading.
