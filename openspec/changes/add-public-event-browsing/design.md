# Design

## Context

Greenfield project: no code and no prior specs exist yet. The tech stack is decided and documented in `docs/tech-stack.md`, with one ADR per choice in `docs/adr/`: Next.js 16 App Router, SQLite via `@libsql/client`, Drizzle ORM, Vitest + React Testing Library, Playwright, Tailwind CSS. This design covers only the decisions specific to this change. Requirements are in `specs/event-catalog/spec.md`; motivation is in `proposal.md`.

No organiser tooling exists in this change, so seed data is the only source of events.

## Goals / Non-Goals

**Goals:**
- A data model for Event and TicketType that the later purchase and organiser changes can extend without reshaping.
- One place that decides visibility and sale state, so the list page, the detail page, and the not-found handling never disagree.
- Seed data that exercises every state in the spec.

**Non-Goals:**
- Hosting and deployment. These are out of scope for the whole project (see `docs/tech-stack.md`).
- Concurrency-safe stock handling. This change is read-only; purchase will need its own stock reservation.
- Caching or performance tuning beyond the explicit cache window below.
- Multi-currency, localisation, and accessibility audits beyond sensible defaults.

## Decisions

### Data model

```
Event
  id
  slug              unique, used in the public URL
  title
  description
  image_url         nullable
  venue_name
  location          city / address text
  timezone          IANA name, e.g. "Europe/Amsterdam"
  starts_at         instant (UTC)
  ends_at           instant (UTC), nullable
  status            draft | published | cancelled

TicketType
  id
  event_id          -> Event
  name
  price_amount      integer minor units (cents)
  currency          ISO 4217, "EUR" for all seed data
  quantity_total
  quantity_remaining
  sale_starts_at    instant (UTC), nullable = on sale immediately
  sale_ends_at      instant (UTC), nullable = on sale until event ends
```

- **Prices as integer minor units and a currency code**, not floats. Avoids rounding errors and keeps multi-currency possible later. Alternative considered: a decimal column. SQLite has no exact decimal type, so integers are the safe choice.
- **`quantity_remaining` stored**, not derived from orders. No orders exist yet. When purchase arrives it can keep this column in step with orders, or replace it with a derived value, without changing the spec. Alternative considered: deriving it from `quantity_total - sold`. Rejected for now because there is nothing to count.
- **Instants stored in UTC with a per-event IANA timezone.** Display converts to the event's timezone (spec: dates, times, and prices display). Alternative considered: storing local times. Rejected because that is ambiguous around DST changes and makes "has it ended?" comparisons error-prone.
- **Slug in the URL** (`/events/<slug>`), so public links are readable and stable. Unknown slug leads to not-found.
- **Nullable sale window bounds**: a missing start means on sale immediately, and a missing end means on sale until the event ends. This keeps seed data simple and matches how organisers usually think.

### Storage mapping (SQLite + Drizzle)

- Instants are `integer` columns in Drizzle `timestamp_ms` mode: epoch milliseconds, always UTC. Comparisons are plain integer comparisons.
- `status` is `text` with a `CHECK (status IN ('draft','published','cancelled'))`. In TypeScript it is a string union.
- `CHECK` constraints: `quantity_total >= 0`, `quantity_remaining >= 0`, `quantity_remaining <= quantity_total`, `price_amount >= 0`.
- Unique index on `event.slug`. Foreign key `ticket_type.event_id -> event.id`, with foreign key enforcement turned on in the connection.
- Migrations come from the Drizzle schema via drizzle-kit and are committed. Drizzle has no down migrations, so rollback is verified by rebuilding: apply all migrations to a fresh database, drop it, and re-apply to get an identical schema (ADR 0003).

### Visibility and sale state: one pure module

All rules are pure functions of (event, ticket types, `now`). Nothing outside this module re-implements them. The module is plain TypeScript with no Next.js or Drizzle imports. It takes plain objects shaped like the rows, so it can be tested without a database or the framework.

```
ticketTypeState(tt, event, now):
  saleEnd = tt.sale_ends_at ?? eventEnd(event)
  if now >= saleEnd                         -> HIDDEN
  if tt.sale_starts_at && now < tt.sale_starts_at -> NOT_YET_ON_SALE
  if tt.quantity_remaining <= 0             -> SOLD_OUT
  else                                      -> AVAILABLE

eventEnd(event)        = event.ends_at ?? event.starts_at
isListed(event, now)   = status == published
                         && now < eventEnd(event)
                         && any ticketTypeState != HIDDEN

eventSummary(visible):
  if any AVAILABLE       -> FROM(min price of AVAILABLE)
  elif any NOT_YET_ON_SALE -> ON_SALE_FROM(min sale_starts_at of those)
  else                   -> SOLD_OUT
```

- **Boundaries**: sale start is inclusive (available at the exact moment), and sale end and event end are exclusive (hidden at the exact moment). This matches the spec scenarios.
- **`now` is injected**, never read inside the rules, so every spec scenario becomes a deterministic unit test.
- **Rules are evaluated at request time**, not stored as flags. Alternative considered: a scheduled job that flips statuses. Rejected because time-based states would drift between job runs and it adds infrastructure for no gain.
- The list query pre-filters in the database with `status = 'published' AND coalesce(ends_at, starts_at) > :now` and loads the ticket types of the remaining events. The final listing decision still goes through `isListed`, so the rules stay in one place.
- The detail lookup uses the same `isListed` check and returns nothing when it is false. That way a hidden event can't be reached by direct URL.

### Rendering (Next.js App Router)

- **Routes**: `/events` is the event list. `/` redirects to `/events`. `/events/[slug]` is the detail page.
- Both pages are **async Server Components** that call data functions (`listEvents(db, now)`, `getListedEventBySlug(db, slug, now)`) on the server. No public API is added.
- The detail page calls `notFound()` when the lookup returns nothing. That covers both unknown and hidden slugs, so both get the same 404.
- **Cache window**: set explicitly to 60 seconds for both pages, rather than relying on framework defaults. Use route segment `revalidate = 60`, or the equivalent `cacheLife` if Cache Components is turned on. `now` is read once per render and passed into the data functions.
- **Formatting**: prices use `Intl.NumberFormat` with `style: "currency"` from minor units. Dates and times use `Intl.DateTimeFormat` with `timeZone` set to the event's timezone. Both live in a small formatter module with no framework imports.
- Styling uses Tailwind. Sale states are shown as visible text ("Sold out", "On sale from …", "N left"), not by color alone.

### Seed data

A repeatable seed (idempotent: safe to run twice) with dates relative to "now", so the states stay correct over time. It is a TypeScript script run with `tsx` (`pnpm db:seed`). In one transaction it upserts events by slug and replaces each seeded event's ticket types. It must cover at least:
- an event with mixed ticket types: available, sold out, and not yet on sale
- a fully sold-out event
- an event where nothing is on sale yet
- an event in progress (started, not ended)
- an event with no end time
- hidden cases: a draft, a cancelled, an ended, and an upcoming event whose ticket sales have all closed

Seed slugs are stable, so tests can refer to each case by slug. `pnpm db:reset` deletes the database file, migrates, and seeds. Playwright's global setup runs the same reset against `data/e2e.db`.

### Testing

Per ADR 0004, each layer is tested where it is cheapest to test reliably:

| What | Tool | Against |
| --- | --- | --- |
| Rules module, formatters | Vitest unit | Plain objects, fixed `now`, fixed instants |
| `listEvents`, `getListedEventBySlug`, seed idempotency | Vitest integration | Fresh libSQL DB (temp file or `:memory:`), migrated + seeded |
| Ticket row states, empty list state | Vitest + React Testing Library | Fixture props |
| Pages, ordering, summaries, HTTP 404, no-auth access | Playwright (Chromium) | Production build on seeded `data/e2e.db` |

The final integration check maps every scenario in `specs/event-catalog/spec.md` to at least one passing test.

### Assumptions recorded

These were proposed during exploration and not explicitly confirmed. They are encoded in the spec and easy to change:
- "Ended" means the end time has passed, with the start time as fallback.
- An event with no visible ticket types is hidden.
- The list is sorted soonest first, and ticket types are sorted by price ascending.
- No pagination in this change.
- A single currency (EUR) in seed data; display uses each ticket type's currency.

## Risks / Trade-offs

- [Exact remaining counts are public] → This was an explicit product decision. The count is a snapshot, so the purchase change must re-check stock at checkout and not trust the displayed number.
- [Request-time evaluation means a page cached across a boundary shows a stale state] → The cache window is set to 60 seconds. Purchase must validate state server-side anyway.
- [The stored `quantity_remaining` could drift from orders once purchase exists] → The purchase change owns this. Flag it in that change's design. SQLite's single writer means purchase should reserve stock with one conditional `UPDATE` inside a transaction (ADR 0002).
- [No pagination] → Fine for seed-sized data. Revisit together with search and filtering.
- [The seed uses dates relative to now, so displayed date text changes between runs] → Playwright tests find events by seed slug and check order and state text, not literal dates. Exact time display (e.g. Amsterdam 20:00) is covered by formatter unit tests with fixed instants.
- [Playwright runs need a production build and are slower] → Vitest covers rules, queries and components in the inner loop. Playwright runs before a task is marked done.
