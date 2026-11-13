import { afterEach, describe, expect, test } from "vitest";
import {
  HIDDEN_SEED_SLUGS,
  LISTED_SEED_SLUGS,
  SEED_SLUGS,
  seed,
} from "@/db/seed";
import { createTestDb, type TestDb } from "@/test/db";
import { getListedEventBySlug, listEvents } from "./queries";

let current: TestDb | undefined;

afterEach(() => {
  current?.destroy();
  current = undefined;
});

const now = new Date("2026-11-13T12:00:00Z");

async function seededDb() {
  current = await createTestDb();
  await seed(current.db, now);
  return current.db;
}

describe("listEvents", () => {
  test("returns an empty list on an empty database", async () => {
    current = await createTestDb();
    expect(await listEvents(current.db, now)).toEqual([]);
  });

  test("returns only the listed seed events, soonest first", async () => {
    const db = await seededDb();
    const events = await listEvents(db, now);
    expect(events.map((e) => e.event.slug)).toEqual([...LISTED_SEED_SLUGS]);
  });

  test("summaries match the seed cases", async () => {
    const db = await seededDb();
    const bySlug = new Map(
      (await listEvents(db, now)).map((e) => [e.event.slug, e.summary]),
    );

    // Cheapest available (Regular, 35), not the sold-out Early bird or hidden Presale.
    expect(bySlug.get(SEED_SLUGS.mixedTickets)).toEqual({
      kind: "FROM",
      priceAmount: 3500,
      currency: "EUR",
    });
    expect(bySlug.get(SEED_SLUGS.soldOut)).toEqual({ kind: "SOLD_OUT" });
    expect(bySlug.get(SEED_SLUGS.notYetOnSale)).toMatchObject({
      kind: "ON_SALE_FROM",
    });
    expect(bySlug.get(SEED_SLUGS.inProgress)).toMatchObject({ kind: "FROM" });
    expect(bySlug.get(SEED_SLUGS.noEndTime)).toMatchObject({ kind: "FROM" });
  });

  test("hidden ticket types are left out of a listed event", async () => {
    const db = await seededDb();
    const jazz = (await listEvents(db, now)).find(
      (e) => e.event.slug === SEED_SLUGS.mixedTickets,
    )!;
    expect(jazz.ticketTypes.map((v) => [v.ticketType.name, v.state])).toEqual([
      ["Early bird", "SOLD_OUT"],
      ["Regular", "AVAILABLE"],
      ["VIP", "NOT_YET_ON_SALE"],
    ]);
  });

  test("evaluates the rules at the given moment", async () => {
    const db = await seededDb();
    // Ten days on, the in-progress festival and the jazz night have ended.
    const later = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const slugs = (await listEvents(db, later)).map((e) => e.event.slug);
    expect(slugs).not.toContain(SEED_SLUGS.inProgress);
    expect(slugs).not.toContain(SEED_SLUGS.mixedTickets);
    expect(slugs).toContain(SEED_SLUGS.notYetOnSale);
  });
});

describe("getListedEventBySlug", () => {
  test("returns nothing for an unknown slug", async () => {
    const db = await seededDb();
    expect(
      await getListedEventBySlug(db, "no-such-event", now),
    ).toBeUndefined();
  });

  test.each(HIDDEN_SEED_SLUGS)(
    "returns nothing for hidden seed event %s",
    async (slug) => {
      const db = await seededDb();
      expect(await getListedEventBySlug(db, slug, now)).toBeUndefined();
    },
  );

  test.each(LISTED_SEED_SLUGS)("returns listed seed event %s", async (slug) => {
    const db = await seededDb();
    const listed = await getListedEventBySlug(db, slug, now);
    expect(listed?.event.slug).toBe(slug);
  });

  test("includes only visible ticket types, price ascending", async () => {
    const db = await seededDb();
    const jazz = await getListedEventBySlug(db, SEED_SLUGS.mixedTickets, now);
    expect(jazz?.ticketTypes.map((v) => v.ticketType.name)).toEqual([
      "Early bird",
      "Regular",
      "VIP",
    ]);
  });
});
