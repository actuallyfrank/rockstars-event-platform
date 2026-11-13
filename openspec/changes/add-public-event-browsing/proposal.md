# Proposal

## Why

The platform will let visitors buy tickets for events and let organisers maintain those events. Before anyone can buy, a visitor has to be able to find out what is on and which tickets they could get. This first change makes the public catalog browsable without an account, and it sets the visibility rules that later purchase and organiser changes will build on.

## What Changes

- Add a public event list page showing upcoming published events, soonest first, each with a short ticket summary ("from EUR x", "Sold out", or "On sale from <date>").
- Add a public event detail page with event information and its ticket offerings: price, exact remaining count, sold-out badge, or "on sale from" date.
- Define visibility rules: draft or cancelled events, past events, ticket types whose sale has ended, and events left with no visible ticket types are all hidden.
- Return a not-found response for unknown or hidden events.
- Provide seed data for events and ticket types. No organiser tooling exists yet, so seed data is the only source of events in this change.
- No account, login, or session is required to browse.

Out of scope: buying tickets, accounts, organiser event management, search and filtering, pagination, and past-event archives.

## Capabilities

### New Capabilities
- `event-catalog`: Public, anonymous browsing of upcoming events and their ticket offerings, including which events and ticket types are visible and how their sale state is shown.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- Greenfield project: no existing code or specs are affected.
- Introduces the core data model (Event, TicketType) that the later purchase and organiser changes will extend.
- Remaining stock counts become publicly visible data.
- The tech stack is not yet chosen. It will be set up before implementation starts, so the design and tasks are written stack-agnostic.
