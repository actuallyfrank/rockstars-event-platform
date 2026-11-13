import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Instants are UTC epoch milliseconds (`timestamp_ms` mode maps them to Date).

export const eventStatuses = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const event = sqliteTable(
  "event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    venueName: text("venue_name").notNull(),
    location: text("location").notNull(),
    /** IANA timezone name, e.g. "Europe/Amsterdam". */
    timezone: text("timezone").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    status: text("status", { enum: eventStatuses }).notNull(),
  },
  (t) => [
    uniqueIndex("event_slug_unique").on(t.slug),
    check(
      "event_status_check",
      sql`status IN ('draft', 'published', 'cancelled')`,
    ),
  ],
);

export type EventRow = typeof event.$inferSelect;
export type NewEventRow = typeof event.$inferInsert;

export const ticketType = sqliteTable(
  "ticket_type",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => event.id),
    name: text("name").notNull(),
    /** Integer minor units (cents). */
    priceAmount: integer("price_amount").notNull(),
    /** ISO 4217 code, e.g. "EUR". */
    currency: text("currency").notNull(),
    quantityTotal: integer("quantity_total").notNull(),
    quantityRemaining: integer("quantity_remaining").notNull(),
    /** Null: on sale immediately. */
    saleStartsAt: integer("sale_starts_at", { mode: "timestamp_ms" }),
    /** Null: on sale until the event ends. */
    saleEndsAt: integer("sale_ends_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("ticket_type_event_id_idx").on(t.eventId),
    check("ticket_type_price_amount_check", sql`price_amount >= 0`),
    check("ticket_type_quantity_total_check", sql`quantity_total >= 0`),
    check(
      "ticket_type_quantity_remaining_check",
      sql`quantity_remaining >= 0 AND quantity_remaining <= quantity_total`,
    ),
  ],
);

export type TicketTypeRow = typeof ticketType.$inferSelect;
export type NewTicketTypeRow = typeof ticketType.$inferInsert;
