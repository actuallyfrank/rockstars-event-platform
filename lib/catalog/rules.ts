/**
 * Catalog visibility and sale-state rules.
 *
 * The only place these rules live: the list page, the detail page and the
 * not-found handling all go through these functions. Pure functions of
 * (event, ticket types, now); `now` is always passed in. No framework or ORM
 * imports, so the inputs are plain objects shaped like the database rows.
 */

export type EventStatus = "draft" | "published" | "cancelled";

export type RulesEvent = {
  status: EventStatus;
  startsAt: Date;
  /** Null: the event ends when it starts. */
  endsAt: Date | null;
};

export type RulesTicketType = {
  name: string;
  /** Integer minor units. */
  priceAmount: number;
  currency: string;
  quantityRemaining: number;
  /** Null: on sale immediately. */
  saleStartsAt: Date | null;
  /** Null: on sale until the event ends. */
  saleEndsAt: Date | null;
};

export const TicketTypeState = {
  HIDDEN: "HIDDEN",
  NOT_YET_ON_SALE: "NOT_YET_ON_SALE",
  SOLD_OUT: "SOLD_OUT",
  AVAILABLE: "AVAILABLE",
} as const;
export type TicketTypeState =
  (typeof TicketTypeState)[keyof typeof TicketTypeState];

/** When the event ends: its end time, or its start time when it has none. */
export function eventEnd(event: Pick<RulesEvent, "startsAt" | "endsAt">): Date {
  return event.endsAt ?? event.startsAt;
}

/**
 * Sale state of one ticket type at `now`.
 * Sale start is inclusive; sale end (and event end) is exclusive.
 */
export function ticketTypeState(
  ticketType: Pick<
    RulesTicketType,
    "quantityRemaining" | "saleStartsAt" | "saleEndsAt"
  >,
  event: Pick<RulesEvent, "startsAt" | "endsAt">,
  now: Date,
): TicketTypeState {
  const saleEnd = ticketType.saleEndsAt ?? eventEnd(event);
  if (now.getTime() >= saleEnd.getTime()) return TicketTypeState.HIDDEN;
  if (
    ticketType.saleStartsAt &&
    now.getTime() < ticketType.saleStartsAt.getTime()
  ) {
    return TicketTypeState.NOT_YET_ON_SALE;
  }
  if (ticketType.quantityRemaining <= 0) return TicketTypeState.SOLD_OUT;
  return TicketTypeState.AVAILABLE;
}

/** True when the event has ended at `now` (end time exclusive). */
export function hasEnded(
  event: Pick<RulesEvent, "startsAt" | "endsAt">,
  now: Date,
): boolean {
  return now.getTime() >= eventEnd(event).getTime();
}

/**
 * Whether an event appears in the public catalog at `now`: published, not
 * ended, and at least one ticket type is visible (not HIDDEN).
 */
export function isListed(
  event: RulesEvent,
  ticketTypes: readonly Pick<
    RulesTicketType,
    "quantityRemaining" | "saleStartsAt" | "saleEndsAt"
  >[],
  now: Date,
): boolean {
  return (
    event.status === "published" &&
    !hasEnded(event, now) &&
    ticketTypes.some(
      (tt) => ticketTypeState(tt, event, now) !== TicketTypeState.HIDDEN,
    )
  );
}

export type VisibleTicketType<T extends RulesTicketType = RulesTicketType> = {
  ticketType: T;
  state: Exclude<TicketTypeState, "HIDDEN">;
};

/**
 * The ticket types a visitor sees at `now`, with their state: HIDDEN ones
 * dropped, sorted by price ascending (then by name, for a stable order).
 */
export function visibleTicketTypes<T extends RulesTicketType>(
  event: Pick<RulesEvent, "startsAt" | "endsAt">,
  ticketTypes: readonly T[],
  now: Date,
): VisibleTicketType<T>[] {
  const visible: VisibleTicketType<T>[] = [];
  for (const ticketType of ticketTypes) {
    const state = ticketTypeState(ticketType, event, now);
    if (state !== TicketTypeState.HIDDEN) visible.push({ ticketType, state });
  }
  return visible.sort(
    (a, b) =>
      a.ticketType.priceAmount - b.ticketType.priceAmount ||
      a.ticketType.name.localeCompare(b.ticketType.name),
  );
}

export type EventSummary =
  | { kind: "FROM"; priceAmount: number; currency: string }
  | { kind: "ON_SALE_FROM"; saleStartsAt: Date }
  | { kind: "SOLD_OUT" };

/**
 * One ticket summary for an event, from its visible ticket types: the lowest
 * price among AVAILABLE ones, otherwise the earliest sale start among
 * NOT_YET_ON_SALE ones, otherwise sold out.
 */
export function eventSummary(
  visible: readonly VisibleTicketType[],
): EventSummary {
  const available = visible.filter((v) => v.state === "AVAILABLE");
  if (available.length > 0) {
    const cheapest = available.reduce((min, v) =>
      v.ticketType.priceAmount < min.ticketType.priceAmount ? v : min,
    );
    return {
      kind: "FROM",
      priceAmount: cheapest.ticketType.priceAmount,
      currency: cheapest.ticketType.currency,
    };
  }

  const upcoming = visible
    .filter((v) => v.state === "NOT_YET_ON_SALE")
    .map((v) => v.ticketType.saleStartsAt)
    .filter((d): d is Date => d !== null);
  if (upcoming.length > 0) {
    const earliest = upcoming.reduce((min, d) =>
      d.getTime() < min.getTime() ? d : min,
    );
    return { kind: "ON_SALE_FROM", saleStartsAt: earliest };
  }

  return { kind: "SOLD_OUT" };
}
