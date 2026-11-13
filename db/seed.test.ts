import { count } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { event, ticketType } from "@/db/schema";
import {
  buildSeedEvents,
  HIDDEN_SEED_SLUGS,
  LISTED_SEED_SLUGS,
  SEED_SLUGS,
  seed,
} from "@/db/seed";
import { createTestDb, type TestDb } from "@/test/db";

let current: TestDb | undefined;

afterEach(() => {
  current?.destroy();
  current = undefined;
});

async function rowCounts(t: TestDb) {
  const [events] = await t.db.select({ n: count() }).from(event);
  const [ticketTypes] = await t.db.select({ n: count() }).from(ticketType);
  return { events: events.n, ticketTypes: ticketTypes.n };
}

describe("seed", () => {
  const now = new Date("2026-11-13T12:00:00Z");

  test("seeding a fresh database twice gives the same row counts", async () => {
    current = await createTestDb();
    const expected = buildSeedEvents(now);
    const expectedTicketTypes = expected.reduce(
      (n, e) => n + e.ticketTypes.length,
      0,
    );

    await seed(current.db, now);
    const first = await rowCounts(current);
    expect(first).toEqual({
      events: expected.length,
      ticketTypes: expectedTicketTypes,
    });

    await seed(current.db, now);
    expect(await rowCounts(current)).toEqual(first);
  });

  test("re-seeding later keeps event ids and refreshes relative dates", async () => {
    current = await createTestDb();
    await seed(current.db, now);
    const before = await current.db.select().from(event);

    const later = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    await seed(current.db, later);
    const after = await current.db.select().from(event);

    expect(after.map((e) => [e.slug, e.id])).toEqual(
      before.map((e) => [e.slug, e.id]),
    );
    const jazzBefore = before.find((e) => e.slug === SEED_SLUGS.mixedTickets)!;
    const jazzAfter = after.find((e) => e.slug === SEED_SLUGS.mixedTickets)!;
    expect(jazzAfter.startsAt.getTime() - jazzBefore.startsAt.getTime()).toBe(
      3 * 24 * 60 * 60 * 1000,
    );
  });

  test("leaves events that are not part of the seed untouched", async () => {
    current = await createTestDb();
    await current.db.insert(event).values({
      slug: "not-seeded",
      title: "Other",
      description: "D",
      venueName: "V",
      location: "L",
      timezone: "Europe/Amsterdam",
      startsAt: now,
      status: "draft",
    });
    await seed(current.db, now);
    const slugs = (await current.db.select().from(event)).map((e) => e.slug);
    expect(slugs).toContain("not-seeded");
  });

  test("slugs are stable and every seed case has one", () => {
    const slugs = buildSeedEvents(now).map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(
      [...LISTED_SEED_SLUGS, ...HIDDEN_SEED_SLUGS].sort(),
    );
  });
});
