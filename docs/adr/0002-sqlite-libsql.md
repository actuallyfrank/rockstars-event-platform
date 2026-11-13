# 0002. SQLite via libSQL

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The catalog change needs two tables (Event, TicketType) and seed data. The next change, ticket purchase, needs to reduce `quantity_remaining` without overselling. Hosting is out of scope, so the database must run locally with no external services and stay portable.

## Options considered

- **PostgreSQL**: strongest concurrency (row locks, `timestamptz`), but needs a server or container even for local work.
- **SQLite / libSQL**: a single file, zero setup, fast for this data size. Single writer at a time, loose typing, no native timestamp type.
- **MySQL**: transactional, but needs a server like Postgres, and fewer ecosystem defaults point at it.

Drivers considered for SQLite: `@libsql/client` (async, pure-JS option, works with local files and remote libSQL/Turso), `better-sqlite3` (sync, native module), and `node:sqlite` (built in, thinner tooling support).

## Decision

Use **SQLite through libSQL**, with the **`@libsql/client`** driver. Locally the database is a file (`DATABASE_URL=file:./data/dev.db`). Tests use their own file or `:memory:`.

## Consequences

- **No local infrastructure:** cloning, installing, migrating and seeding is enough.
- **Portability:** the database location is set only by `DATABASE_URL`. Moving to remote libSQL (e.g. Turso) later means changing the URL and adding an auth token, not the code.
- **Timestamps:** SQLite has no instant type. All instants (`starts_at`, `ends_at`, `sale_starts_at`, `sale_ends_at`) are stored as integer epoch milliseconds in UTC, and compared as integers.
- **Types and constraints:** enforce what SQLite won't infer. Use `CHECK` constraints for `status` (draft | published | cancelled), non-negative quantities, and `quantity_remaining <= quantity_total`. Use a unique index on `slug`. Turn foreign keys on.
- **Purchase concurrency (next change):** SQLite allows one writer at a time. Reserve stock with a single conditional statement inside a write transaction, e.g. `UPDATE ticket_type SET quantity_remaining = quantity_remaining - :n WHERE id = :id AND quantity_remaining >= :n`, and treat zero affected rows as sold out. Set a `busy_timeout`. The purchase change's design must cover this.
- **Scale ceiling:** fine for this project's expected load. Heavy concurrent writes or several app instances writing to one file would mean revisiting this decision.
- `data/*.db` files are git-ignored.
