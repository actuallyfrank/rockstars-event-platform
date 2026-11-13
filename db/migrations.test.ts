import { afterEach, describe, expect, test } from "vitest";
import { migrateDb } from "@/db/migrate";
import { event, ticketType } from "@/db/schema";
import {
  createTestDb,
  dumpSchema,
  rejectsWithSqlError,
  type TestDb,
} from "@/test/db";

let current: TestDb | undefined;

afterEach(() => {
  current?.destroy();
  current = undefined;
});

describe("migrations", () => {
  test("apply to a fresh database", async () => {
    current = await createTestDb();
    const schema = await dumpSchema(current.db);
    const objects = schema.map(({ type, name }) => `${type}:${name}`);

    expect(objects).toContain("table:event");
    expect(objects).toContain("index:event_slug_unique");
    expect(objects).toContain("table:ticket_type");
    expect(objects).toContain("index:ticket_type_event_id_idx");
  });

  test("rebuild: dropping the database and re-applying gives an identical schema", async () => {
    const first = await createTestDb();
    const before = await dumpSchema(first.db);
    first.destroy();

    current = await createTestDb();
    const after = await dumpSchema(current.db);

    expect(after).toEqual(before);
    expect(after.length).toBeGreaterThan(0);
  });

  test("re-running migrations on a migrated database is a no-op", async () => {
    current = await createTestDb();
    const before = await dumpSchema(current.db);
    await migrateDb(current.db);
    expect(await dumpSchema(current.db)).toEqual(before);
  });
});

describe("event constraints", () => {
  const base = {
    title: "T",
    description: "D",
    venueName: "V",
    location: "L",
    timezone: "Europe/Amsterdam",
    startsAt: new Date("2026-12-05T19:00:00Z"),
  };

  test("status CHECK rejects unknown values", async () => {
    current = await createTestDb();
    await expect(
      current.db.$client.execute({
        sql: "INSERT INTO event (slug, title, description, venue_name, location, timezone, starts_at, status) VALUES ('x', 'T', 'D', 'V', 'L', 'UTC', 0, 'archived')",
        args: [],
      }),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  test("slug is unique", async () => {
    current = await createTestDb();
    await current.db
      .insert(event)
      .values({ ...base, slug: "same", status: "published" });
    await rejectsWithSqlError(
      current.db
        .insert(event)
        .values({ ...base, slug: "same", status: "draft" }),
      /UNIQUE constraint failed: event.slug/,
    );
  });

  test("instants are stored as UTC epoch milliseconds", async () => {
    current = await createTestDb();
    await current.db
      .insert(event)
      .values({ ...base, slug: "ms", status: "published" });
    const row = await current.db.$client.execute(
      "SELECT starts_at, typeof(starts_at) AS t FROM event WHERE slug = 'ms'",
    );
    expect(row.rows[0].t).toBe("integer");
    expect(Number(row.rows[0].starts_at)).toBe(base.startsAt.getTime());
  });
});

describe("ticket_type constraints", () => {
  async function withEvent(): Promise<number> {
    current = await createTestDb();
    const [row] = await current.db
      .insert(event)
      .values({
        slug: "e",
        title: "T",
        description: "D",
        venueName: "V",
        location: "L",
        timezone: "Europe/Amsterdam",
        startsAt: new Date("2026-12-05T19:00:00Z"),
        status: "published",
      })
      .returning({ id: event.id });
    return row.id;
  }

  const valid = {
    name: "Regular",
    priceAmount: 3500,
    currency: "EUR",
    quantityTotal: 100,
    quantityRemaining: 100,
  };

  test("accepts a valid ticket type", async () => {
    const eventId = await withEvent();
    await current!.db.insert(ticketType).values({ ...valid, eventId });
    const rows = await current!.db.select().from(ticketType);
    expect(rows).toHaveLength(1);
  });

  test.each([
    ["negative price", { priceAmount: -1 }, /ticket_type_price_amount_check/],
    [
      "negative total",
      { quantityTotal: -1, quantityRemaining: 0 },
      /CHECK constraint failed/,
    ],
    [
      "negative remaining",
      { quantityRemaining: -1 },
      /ticket_type_quantity_remaining_check/,
    ],
    [
      "remaining above total",
      { quantityTotal: 10, quantityRemaining: 11 },
      /ticket_type_quantity_remaining_check/,
    ],
  ])("CHECK rejects %s", async (_label, override, pattern) => {
    const eventId = await withEvent();
    await rejectsWithSqlError(
      current!.db.insert(ticketType).values({ ...valid, ...override, eventId }),
      pattern,
    );
  });

  test("foreign keys are enforced", async () => {
    await withEvent();
    await rejectsWithSqlError(
      current!.db.insert(ticketType).values({ ...valid, eventId: 9999 }),
      /FOREIGN KEY constraint failed/,
    );
  });

  test("foreign keys stay enforced on pooled connections and in transactions", async () => {
    await withEvent();
    const db = current!.db;
    const checks = await Promise.all(
      Array.from({ length: 5 }, () =>
        db.$client.execute("PRAGMA foreign_keys"),
      ),
    );
    for (const result of checks) expect(result.rows[0].foreign_keys).toBe(1);
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(ticketType).values({ ...valid, eventId: 9999 });
      }),
    ).rejects.toThrow();
  });
});
