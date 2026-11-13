import { eq } from "drizzle-orm";
import type { Db } from "./client";
import {
  event,
  ticketType,
  type NewEventRow,
  type NewTicketTypeRow,
} from "./schema";

/**
 * Stable seed slugs, so tests can refer to each case by name.
 * Dates are computed relative to `now`, so each case keeps its state over time.
 */
export const SEED_SLUGS = {
  // Listed
  inProgress: "winter-festival-in-progress",
  mixedTickets: "jazz-night-mixed-tickets",
  soldOut: "sold-out-rock-show",
  noEndTime: "open-ended-meetup",
  notYetOnSale: "sales-open-soon-gala",
  // Hidden
  draft: "draft-event",
  cancelled: "cancelled-event",
  ended: "ended-event",
  endedWithoutEndTime: "ended-event-without-end-time",
  salesClosed: "upcoming-event-sales-closed",
  noTicketTypes: "upcoming-event-without-tickets",
} as const;

/** Listed seed slugs, in the order the event list shows them (soonest first). */
export const LISTED_SEED_SLUGS = [
  SEED_SLUGS.inProgress,
  SEED_SLUGS.mixedTickets,
  SEED_SLUGS.soldOut,
  SEED_SLUGS.noEndTime,
  SEED_SLUGS.notYetOnSale,
] as const;

export const HIDDEN_SEED_SLUGS = [
  SEED_SLUGS.draft,
  SEED_SLUGS.cancelled,
  SEED_SLUGS.ended,
  SEED_SLUGS.endedWithoutEndTime,
  SEED_SLUGS.salesClosed,
  SEED_SLUGS.noTicketTypes,
] as const;

type SeedTicketType = Omit<NewTicketTypeRow, "id" | "eventId" | "currency">;
type SeedEvent = Omit<NewEventRow, "id"> & { ticketTypes: SeedTicketType[] };

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Midnight UTC of `now`'s day plus `days` and `utcHour` hours. */
function dayAt(now: Date, days: number, utcHour: number): Date {
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return new Date(midnight + days * DAY + utcHour * HOUR);
}

function offset(now: Date, ms: number): Date {
  return new Date(now.getTime() + ms);
}

function onSale(
  name: string,
  priceAmount: number,
  quantityTotal: number,
  quantityRemaining = quantityTotal,
): SeedTicketType {
  return { name, priceAmount, quantityTotal, quantityRemaining };
}

const AMSTERDAM = "Europe/Amsterdam";

/** The seed data set for a given moment. Pure, so tests can inspect it. */
export function buildSeedEvents(now: Date): SeedEvent[] {
  const venue = {
    venueName: "Paradiso",
    location: "Weteringschans 6-8, Amsterdam",
    timezone: AMSTERDAM,
  };

  return [
    {
      slug: SEED_SLUGS.inProgress,
      title: "Winter Festival",
      description:
        "A day of live music across three stages. Doors are open: the festival is already under way.",
      imageUrl: "/images/festival.svg",
      venueName: "Westergas",
      location: "Klönneplein 1, Amsterdam",
      timezone: AMSTERDAM,
      startsAt: offset(now, -2 * HOUR),
      endsAt: offset(now, 6 * HOUR),
      status: "published",
      ticketTypes: [onSale("Day ticket", 4500, 2000, 311)],
    },
    {
      slug: SEED_SLUGS.mixedTickets,
      title: "Jazz Night",
      description:
        "An evening of modern jazz with a late-night jam session after the main set.",
      imageUrl: "/images/jazz-night.svg",
      ...venue,
      startsAt: dayAt(now, 7, 19),
      endsAt: dayAt(now, 7, 23),
      status: "published",
      ticketTypes: [
        // Cheapest overall, but its sale has closed: hidden.
        {
          ...onSale("Presale", 2000, 50, 12),
          saleEndsAt: offset(now, -DAY),
        },
        // Cheaper than Regular, but sold out.
        onSale("Early bird", 2500, 100, 0),
        onSale("Regular", 3500, 300, 142),
        // Not yet on sale.
        {
          ...onSale("VIP", 8000, 40),
          saleStartsAt: dayAt(now, 2, 9),
        },
      ],
    },
    {
      slug: SEED_SLUGS.soldOut,
      title: "Rock Show",
      description: "The reunion tour. Every ticket has been sold.",
      imageUrl: "/images/sold-out-show.svg",
      venueName: "Ziggo Dome",
      location: "De Passage 100, Amsterdam",
      timezone: AMSTERDAM,
      startsAt: dayAt(now, 10, 19),
      endsAt: dayAt(now, 10, 22),
      status: "published",
      ticketTypes: [
        onSale("Standing", 5500, 1000, 0),
        onSale("Seated", 7500, 500, 0),
      ],
    },
    {
      slug: SEED_SLUGS.noEndTime,
      title: "Open-ended Meetup",
      description:
        "Drinks and talks for local musicians. No fixed end time: stay as long as you like.",
      imageUrl: null,
      venueName: "Café de Ceuvel",
      location: "Korte Papaverweg 4, Amsterdam",
      timezone: AMSTERDAM,
      startsAt: dayAt(now, 14, 17),
      endsAt: null,
      status: "published",
      ticketTypes: [onSale("Entry", 500, 80, 64)],
    },
    {
      slug: SEED_SLUGS.notYetOnSale,
      title: "New Year Gala",
      description:
        "A formal evening with dinner and an orchestra. Ticket sales open soon.",
      imageUrl: "/images/meetup.svg",
      venueName: "Concertgebouw",
      location: "Concertgebouwplein 10, Amsterdam",
      timezone: AMSTERDAM,
      startsAt: dayAt(now, 21, 18),
      endsAt: dayAt(now, 21, 23),
      status: "published",
      ticketTypes: [
        { ...onSale("Balcony", 6000, 200), saleStartsAt: dayAt(now, 5, 9) },
        { ...onSale("Stalls", 9000, 300), saleStartsAt: dayAt(now, 3, 9) },
        // Sold out already (e.g. allocated to partners); still visible.
        onSale("Partner allocation", 4000, 20, 0),
      ],
    },

    // Hidden cases
    {
      slug: SEED_SLUGS.draft,
      title: "Draft Event",
      description: "Not published yet.",
      imageUrl: null,
      ...venue,
      startsAt: dayAt(now, 12, 19),
      endsAt: dayAt(now, 12, 22),
      status: "draft",
      ticketTypes: [onSale("Regular", 3000, 100)],
    },
    {
      slug: SEED_SLUGS.cancelled,
      title: "Cancelled Event",
      description: "This event was cancelled.",
      imageUrl: null,
      ...venue,
      startsAt: dayAt(now, 9, 19),
      endsAt: dayAt(now, 9, 22),
      status: "cancelled",
      ticketTypes: [onSale("Regular", 3000, 100)],
    },
    {
      slug: SEED_SLUGS.ended,
      title: "Ended Event",
      description: "This event is over.",
      imageUrl: null,
      ...venue,
      startsAt: offset(now, -DAY - 4 * HOUR),
      endsAt: offset(now, -DAY),
      status: "published",
      ticketTypes: [onSale("Regular", 3000, 100, 3)],
    },
    {
      slug: SEED_SLUGS.endedWithoutEndTime,
      title: "Ended Event Without End Time",
      description: "Started yesterday and has no end time, so it has ended.",
      imageUrl: null,
      ...venue,
      startsAt: offset(now, -DAY),
      endsAt: null,
      status: "published",
      ticketTypes: [onSale("Regular", 3000, 100, 3)],
    },
    {
      slug: SEED_SLUGS.salesClosed,
      title: "Upcoming Event With Closed Sales",
      description: "Still upcoming, but every ticket sale has closed.",
      imageUrl: null,
      ...venue,
      startsAt: dayAt(now, 8, 19),
      endsAt: dayAt(now, 8, 22),
      status: "published",
      ticketTypes: [
        { ...onSale("Regular", 3000, 100, 20), saleEndsAt: offset(now, -HOUR) },
        { ...onSale("VIP", 6000, 20, 5), saleEndsAt: offset(now, -DAY) },
      ],
    },
    {
      slug: SEED_SLUGS.noTicketTypes,
      title: "Upcoming Event Without Tickets",
      description: "Published, but no ticket types exist.",
      imageUrl: null,
      ...venue,
      startsAt: dayAt(now, 11, 19),
      endsAt: dayAt(now, 11, 22),
      status: "published",
      ticketTypes: [],
    },
  ];
}

/**
 * Idempotent seed: in one transaction, upserts each seed event by slug and
 * replaces its ticket types. Events that are not part of the seed are untouched.
 */
export async function seed(db: Db, now: Date = new Date()): Promise<void> {
  const events = buildSeedEvents(now);

  await db.transaction(async (tx) => {
    for (const { ticketTypes, ...values } of events) {
      const [row] = await tx
        .insert(event)
        .values(values)
        .onConflictDoUpdate({ target: event.slug, set: values })
        .returning({ id: event.id });

      await tx.delete(ticketType).where(eq(ticketType.eventId, row.id));
      if (ticketTypes.length > 0) {
        await tx.insert(ticketType).values(
          ticketTypes.map((tt) => ({
            ...tt,
            eventId: row.id,
            currency: "EUR",
          })),
        );
      }
    }
  });
}
