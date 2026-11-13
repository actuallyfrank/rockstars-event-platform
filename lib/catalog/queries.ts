import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  event,
  ticketType,
  type EventRow,
  type TicketTypeRow,
} from "@/db/schema";
import {
  eventSummary,
  isListed,
  visibleTicketTypes,
  type EventSummary,
  type VisibleTicketType,
} from "./rules";

export type ListedEvent = {
  event: EventRow;
  /** Visible ticket types with their state, price ascending. */
  ticketTypes: VisibleTicketType<TicketTypeRow>[];
  summary: EventSummary;
};

function toListedEvent(
  row: EventRow,
  ticketTypes: TicketTypeRow[],
  now: Date,
): ListedEvent | undefined {
  // The rules module makes the listing decision; the SQL only narrows it down.
  if (!isListed(row, ticketTypes, now)) return undefined;
  const visible = visibleTicketTypes(row, ticketTypes, now);
  return { event: row, ticketTypes: visible, summary: eventSummary(visible) };
}

/** Events in the public catalog at `now`, soonest first. */
export async function listEvents(db: Db, now: Date): Promise<ListedEvent[]> {
  // Pre-filter: published and not ended (end exclusive, start as fallback).
  const events = await db
    .select()
    .from(event)
    .where(
      and(
        eq(event.status, "published"),
        gt(sql`coalesce(${event.endsAt}, ${event.startsAt})`, now.getTime()),
      ),
    )
    .orderBy(asc(event.startsAt), asc(event.id));
  if (events.length === 0) return [];

  const ticketTypes = await db
    .select()
    .from(ticketType)
    .where(
      inArray(
        ticketType.eventId,
        events.map((e) => e.id),
      ),
    );
  const byEvent = Map.groupBy(ticketTypes, (tt) => tt.eventId);

  return events.flatMap((row) => {
    const listed = toListedEvent(row, byEvent.get(row.id) ?? [], now);
    return listed ? [listed] : [];
  });
}

/**
 * A single event by slug, only if it is listed at `now`. Returns undefined for
 * unknown slugs and for hidden events alike, so a hidden event can't be
 * reached by direct URL.
 */
export async function getListedEventBySlug(
  db: Db,
  slug: string,
  now: Date,
): Promise<ListedEvent | undefined> {
  const [row] = await db
    .select()
    .from(event)
    .where(eq(event.slug, slug))
    .limit(1);
  if (!row) return undefined;

  const ticketTypes = await db
    .select()
    .from(ticketType)
    .where(eq(ticketType.eventId, row.id));
  return toListedEvent(row, ticketTypes, now);
}
