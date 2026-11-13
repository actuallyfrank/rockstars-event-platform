import type { EventRow, TicketTypeRow } from "@/db/schema";
import type { ListedEvent } from "@/lib/catalog/queries";
import type { EventSummary, VisibleTicketType } from "@/lib/catalog/rules";

/** Fixture props for catalog components. Fixed instants, Amsterdam timezone. */
export function makeEventRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: 1,
    slug: "jazz-night",
    title: "Jazz Night",
    description: "An evening of modern jazz.",
    imageUrl: "/images/jazz-night.svg",
    venueName: "Paradiso",
    location: "Weteringschans 6-8, Amsterdam",
    timezone: "Europe/Amsterdam",
    startsAt: new Date("2026-12-10T19:00:00Z"),
    endsAt: new Date("2026-12-10T23:00:00Z"),
    status: "published",
    ...overrides,
  };
}

export function makeTicketTypeRow(
  overrides: Partial<TicketTypeRow> = {},
): TicketTypeRow {
  return {
    id: 1,
    eventId: 1,
    name: "Regular",
    priceAmount: 3500,
    currency: "EUR",
    quantityTotal: 300,
    quantityRemaining: 142,
    saleStartsAt: null,
    saleEndsAt: null,
    ...overrides,
  };
}

/** One visible ticket type in every state, price ascending. */
export function mixedTicketTypes(): VisibleTicketType<TicketTypeRow>[] {
  return [
    {
      ticketType: makeTicketTypeRow({
        id: 1,
        name: "Early bird",
        priceAmount: 2500,
        quantityRemaining: 0,
      }),
      state: "SOLD_OUT",
    },
    {
      ticketType: makeTicketTypeRow({ id: 2, name: "Regular" }),
      state: "AVAILABLE",
    },
    {
      ticketType: makeTicketTypeRow({
        id: 3,
        name: "VIP",
        priceAmount: 8000,
        saleStartsAt: new Date("2026-12-01T09:00:00Z"),
      }),
      state: "NOT_YET_ON_SALE",
    },
  ];
}

export function makeListedEvent(
  overrides: {
    event?: Partial<EventRow>;
    ticketTypes?: VisibleTicketType<TicketTypeRow>[];
    summary?: EventSummary;
  } = {},
): ListedEvent {
  return {
    event: makeEventRow(overrides.event),
    ticketTypes: overrides.ticketTypes ?? mixedTicketTypes(),
    summary: overrides.summary ?? {
      kind: "FROM",
      priceAmount: 3500,
      currency: "EUR",
    },
  };
}
