# Design

## Context

Greenfield project: there is no code, no prior specs, and no tech stack chosen yet. The stack will be set up before implementation starts, so this design stays stack-agnostic. It fixes the data model and where the visibility logic lives, but not frameworks or libraries. Requirements are in `specs/event-catalog/spec.md`; motivation is in `proposal.md`.

No organiser tooling exists in this change, so seed data is the only source of events.

## Goals / Non-Goals

**Goals:**
- A data model for Event and TicketType that the later purchase and organiser changes can extend without reshaping.
- One place that decides visibility and sale state, so the list page, the detail page, and the not-found handling never disagree.
- Seed data that exercises every state in the spec.

**Non-Goals:**
- Choosing the framework, database, or hosting. That happens before apply.
- Concurrency-safe stock handling. This change is read-only; purchase will need its own stock reservation.
- Caching or performance tuning beyond what the stack gives by default.
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

- **Prices as integer minor units and a currency code**, not floats. Avoids rounding errors and keeps multi-currency possible later. Alternative considered: a decimal column. Also fine, but less portable across stacks.
- **`quantity_remaining` stored**, not derived from orders. No orders exist yet. When purchase arrives it can keep this column in step with orders, or replace it with a derived value, without changing the spec. Alternative considered: deriving it from `quantity_total - sold`. Rejected for now because there is nothing to count.
- **Instants stored in UTC with a per-event IANA timezone.** Display converts to the event's timezone (spec: dates, times, and prices display). Alternative considered: storing local times. Rejected because that is ambiguous around DST changes and makes "has it ended?" comparisons error-prone.
- **Slug in the URL** (`/events/<slug>`), so public links are readable and stable. Unknown slug leads to not-found.
- **Nullable sale window bounds**: a missing start means on sale immediately, and a missing end means on sale until the event ends. This keeps seed data simple and matches how organisers usually think.

### Visibility and sale state: one pure module

All rules are pure functions of (event, ticket types, `now`). Nothing outside this module re-implements them.

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
- The list query may pre-filter in the database (published, not ended) for efficiency. The final listing decision still goes through `isListed` so the rules stay in one place.
- The detail page uses the same `isListed` check and returns not-found when it is false. That way a hidden event can't be reached by direct URL.

### Rendering

Public pages should be server-rendered or pre-rendered with short revalidation, because event pages benefit from search indexing and link previews. The final approach depends on the chosen stack. With client-side rendering, the same rules would sit behind a read-only API.

### Seed data

A repeatable seed (idempotent: safe to run twice) with dates relative to "now", so the states stay correct over time. It must cover at least:
- an event with mixed ticket types: available, sold out, and not yet on sale
- a fully sold-out event
- an event where nothing is on sale yet
- an event in progress (started, not ended)
- an event with no end time
- hidden cases: a draft, a cancelled, an ended, and an upcoming event whose ticket sales have all closed

### Assumptions recorded

These were proposed during exploration and not explicitly confirmed. They are encoded in the spec and easy to change:
- "Ended" means the end time has passed, with the start time as fallback.
- An event with no visible ticket types is hidden.
- The list is sorted soonest first, and ticket types are sorted by price ascending.
- No pagination in this change.
- A single currency (EUR) in seed data; display uses each ticket type's currency.

## Risks / Trade-offs

- [Exact remaining counts are public] → This was an explicit product decision. The count is a snapshot, so the purchase change must re-check stock at checkout and not trust the displayed number.
- [Request-time evaluation means a page cached across a boundary shows a stale state] → Keep the cache/revalidation window short (for example 60 seconds) once a stack is chosen. Purchase must validate state server-side anyway.
- [The stored `quantity_remaining` could drift from orders once purchase exists] → The purchase change owns this. Flag it in that change's design.
- [No pagination] → Fine for seed-sized data. Revisit together with search and filtering.
- [Stack not chosen yet, so tasks stay generic] → Re-read the tasks once the stack is set up. Only the wording of framework-specific steps should need to change, not the breakdown.

## Open Questions

- Which framework, database, and test tooling to use. The user will decide this before implementation; it does not change the spec or the task breakdown.
