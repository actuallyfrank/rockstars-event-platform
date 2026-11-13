import { describe, expect, test } from "vitest";
import {
  eventEnd,
  eventSummary,
  isListed,
  ticketTypeState,
  TicketTypeState,
  visibleTicketTypes,
} from "./rules";
import { at, makeEvent, makeTicketType } from "./test-fixtures";

const { HIDDEN, NOT_YET_ON_SALE, SOLD_OUT, AVAILABLE } = TicketTypeState;

describe("eventEnd", () => {
  test("is the end time when there is one", () => {
    expect(eventEnd(makeEvent())).toEqual(at("2026-12-10T23:00:00Z"));
  });

  test("falls back to the start time without an end time", () => {
    expect(eventEnd(makeEvent({ endsAt: null }))).toEqual(
      at("2026-12-10T19:00:00Z"),
    );
  });
});

describe("ticketTypeState", () => {
  const event = makeEvent();
  const now = at("2026-12-01T12:00:00Z");

  test("AVAILABLE: sale open with remaining stock", () => {
    expect(ticketTypeState(makeTicketType(), event, now)).toBe(AVAILABLE);
  });

  test("SOLD_OUT: sale open with no remaining stock", () => {
    expect(
      ticketTypeState(makeTicketType({ quantityRemaining: 0 }), event, now),
    ).toBe(SOLD_OUT);
  });

  test("NOT_YET_ON_SALE: sale starts later", () => {
    const tt = makeTicketType({ saleStartsAt: at("2026-12-02T10:00:00Z") });
    expect(ticketTypeState(tt, event, now)).toBe(NOT_YET_ON_SALE);
  });

  test("NOT_YET_ON_SALE wins over sold out before the sale starts", () => {
    const tt = makeTicketType({
      saleStartsAt: at("2026-12-02T10:00:00Z"),
      quantityRemaining: 0,
    });
    expect(ticketTypeState(tt, event, now)).toBe(NOT_YET_ON_SALE);
  });

  test("HIDDEN: sale end has passed", () => {
    const tt = makeTicketType({ saleEndsAt: at("2026-11-30T00:00:00Z") });
    expect(ticketTypeState(tt, event, now)).toBe(HIDDEN);
  });

  test("HIDDEN: no sale end and the event has ended", () => {
    expect(
      ticketTypeState(makeTicketType(), event, at("2026-12-11T00:00:00Z")),
    ).toBe(HIDDEN);
  });

  test("HIDDEN: no sale end, no event end, and the event has started", () => {
    const noEnd = makeEvent({ endsAt: null });
    expect(
      ticketTypeState(makeTicketType(), noEnd, at("2026-12-10T19:00:01Z")),
    ).toBe(HIDDEN);
  });

  test("null sale bounds: on sale immediately, until the event ends", () => {
    const tt = makeTicketType({ saleStartsAt: null, saleEndsAt: null });
    expect(ticketTypeState(tt, event, at("2000-01-01T00:00:00Z"))).toBe(
      AVAILABLE,
    );
    expect(ticketTypeState(tt, event, at("2026-12-10T22:59:59.999Z"))).toBe(
      AVAILABLE,
    );
  });

  test("a sale end after the event end still hides at the sale end only", () => {
    const tt = makeTicketType({ saleEndsAt: at("2026-12-20T00:00:00Z") });
    expect(ticketTypeState(tt, event, at("2026-12-15T00:00:00Z"))).toBe(
      AVAILABLE,
    );
  });

  describe("boundaries", () => {
    const saleStart = at("2026-12-01T10:00:00Z");
    const saleEnd = at("2026-12-05T10:00:00Z");
    const tt = makeTicketType({ saleStartsAt: saleStart, saleEndsAt: saleEnd });
    const ms = (d: Date, delta: number) => new Date(d.getTime() + delta);

    test("sale start is inclusive", () => {
      expect(ticketTypeState(tt, event, ms(saleStart, -1))).toBe(
        NOT_YET_ON_SALE,
      );
      expect(ticketTypeState(tt, event, saleStart)).toBe(AVAILABLE);
    });

    test("sale end is exclusive", () => {
      expect(ticketTypeState(tt, event, ms(saleEnd, -1))).toBe(AVAILABLE);
      expect(ticketTypeState(tt, event, saleEnd)).toBe(HIDDEN);
    });

    test("event end is exclusive when there is no sale end", () => {
      const open = makeTicketType();
      const end = eventEnd(event);
      expect(ticketTypeState(open, event, ms(end, -1))).toBe(AVAILABLE);
      expect(ticketTypeState(open, event, end)).toBe(HIDDEN);
    });

    test("spec: sale start moment is reached -> available with stock", () => {
      const vip = makeTicketType({
        saleStartsAt: at("2026-12-01T09:00:00Z"), // 1 Dec 10:00 Amsterdam
        quantityRemaining: 40,
      });
      expect(ticketTypeState(vip, event, at("2026-12-01T09:00:00Z"))).toBe(
        AVAILABLE,
      );
      expect(ticketTypeState(vip, event, at("2026-12-01T15:00:00Z"))).toBe(
        AVAILABLE,
      );
    });
  });
});

describe("isListed", () => {
  const now = at("2026-12-01T12:00:00Z");
  const open = [makeTicketType()];

  test("published upcoming event with a visible ticket type is listed", () => {
    expect(isListed(makeEvent(), open, now)).toBe(true);
  });

  test("draft event is hidden", () => {
    expect(isListed(makeEvent({ status: "draft" }), open, now)).toBe(false);
  });

  test("cancelled event is hidden", () => {
    expect(isListed(makeEvent({ status: "cancelled" }), open, now)).toBe(false);
  });

  test("event in progress (started, not ended) is listed", () => {
    const event = makeEvent({
      startsAt: at("2026-12-01T10:00:00Z"),
      endsAt: at("2026-12-01T18:00:00Z"),
    });
    expect(isListed(event, open, now)).toBe(true);
  });

  test("event past its end time is hidden", () => {
    const event = makeEvent({
      startsAt: at("2026-11-30T19:00:00Z"),
      endsAt: at("2026-11-30T23:00:00Z"),
    });
    expect(isListed(event, open, now)).toBe(false);
  });

  test("event exactly at its end time is hidden", () => {
    const event = makeEvent({
      startsAt: at("2026-12-01T08:00:00Z"),
      endsAt: now,
    });
    expect(isListed(event, open, now)).toBe(false);
  });

  test("event without end time past its start time is hidden", () => {
    const event = makeEvent({
      startsAt: at("2026-12-01T11:59:59Z"),
      endsAt: null,
    });
    expect(isListed(event, open, now)).toBe(false);
  });

  test("upcoming event without end time is listed", () => {
    expect(isListed(makeEvent({ endsAt: null }), open, now)).toBe(true);
  });

  test("all ticket sales closed before the event: hidden", () => {
    const closed = [
      makeTicketType({ saleEndsAt: at("2026-11-30T00:00:00Z") }),
      makeTicketType({ name: "VIP", saleEndsAt: at("2026-12-01T12:00:00Z") }),
    ];
    expect(isListed(makeEvent(), closed, now)).toBe(false);
  });

  test("one open sale among closed ones keeps the event listed", () => {
    const mixed = [
      makeTicketType({ saleEndsAt: at("2026-11-30T00:00:00Z") }),
      makeTicketType({ name: "VIP" }),
    ];
    expect(isListed(makeEvent(), mixed, now)).toBe(true);
  });

  test("sold-out and not-yet-on-sale ticket types still count as visible", () => {
    expect(
      isListed(makeEvent(), [makeTicketType({ quantityRemaining: 0 })], now),
    ).toBe(true);
    expect(
      isListed(
        makeEvent(),
        [makeTicketType({ saleStartsAt: at("2026-12-05T00:00:00Z") })],
        now,
      ),
    ).toBe(true);
  });

  test("event with no ticket types is hidden", () => {
    expect(isListed(makeEvent(), [], now)).toBe(false);
  });
});

describe("visibleTicketTypes", () => {
  const event = makeEvent();
  const now = at("2026-11-20T12:00:00Z");

  test("drops HIDDEN ticket types and attaches states", () => {
    const result = visibleTicketTypes(
      event,
      [
        makeTicketType({
          name: "Closed",
          saleEndsAt: at("2026-11-19T00:00:00Z"),
        }),
        makeTicketType({ name: "Regular" }),
      ],
      now,
    );
    expect(result.map((v) => [v.ticketType.name, v.state])).toEqual([
      ["Regular", AVAILABLE],
    ]);
  });

  test("spec: ticket types ordered by price, lowest first", () => {
    const result = visibleTicketTypes(
      event,
      [
        makeTicketType({ name: "VIP", priceAmount: 8000 }),
        makeTicketType({ name: "Regular", priceAmount: 3500 }),
      ],
      now,
    );
    expect(result.map((v) => v.ticketType.name)).toEqual(["Regular", "VIP"]);
  });

  test("sorts across states, ties broken by name", () => {
    const result = visibleTicketTypes(
      event,
      [
        makeTicketType({ name: "B", priceAmount: 3500 }),
        makeTicketType({
          name: "Early bird",
          priceAmount: 2500,
          quantityRemaining: 0,
        }),
        makeTicketType({ name: "A", priceAmount: 3500 }),
        makeTicketType({
          name: "VIP",
          priceAmount: 8000,
          saleStartsAt: at("2026-12-01T09:00:00Z"),
        }),
      ],
      now,
    );
    expect(result.map((v) => [v.ticketType.name, v.state])).toEqual([
      ["Early bird", SOLD_OUT],
      ["A", AVAILABLE],
      ["B", AVAILABLE],
      ["VIP", NOT_YET_ON_SALE],
    ]);
  });
});

describe("eventSummary", () => {
  const event = makeEvent();
  const now = at("2026-11-20T12:00:00Z");
  const summarize = (...tts: Parameters<typeof makeTicketType>[0][]) =>
    eventSummary(visibleTicketTypes(event, tts.map(makeTicketType), now));

  test("spec: available EUR 35 and EUR 80 -> from EUR 35", () => {
    expect(
      summarize({ priceAmount: 8000, name: "VIP" }, { priceAmount: 3500 }),
    ).toEqual({ kind: "FROM", priceAmount: 3500, currency: "EUR" });
  });

  test("spec: cheapest available, not cheapest overall", () => {
    expect(
      summarize(
        { name: "Early bird", priceAmount: 2500, quantityRemaining: 0 },
        { name: "Regular", priceAmount: 3500 },
      ),
    ).toEqual({ kind: "FROM", priceAmount: 3500, currency: "EUR" });
  });

  test("cheaper not-yet-on-sale and hidden types do not lower the price", () => {
    expect(
      summarize(
        {
          name: "Presale",
          priceAmount: 1000,
          saleEndsAt: at("2026-11-01T00:00:00Z"),
        },
        {
          name: "Later",
          priceAmount: 2000,
          saleStartsAt: at("2026-11-25T00:00:00Z"),
        },
        { name: "Regular", priceAmount: 3500 },
      ),
    ).toEqual({ kind: "FROM", priceAmount: 3500, currency: "EUR" });
  });

  test("spec: nothing available, upcoming sales -> on sale from the earliest start", () => {
    expect(
      summarize(
        { name: "Sold", quantityRemaining: 0 },
        { name: "VIP", saleStartsAt: at("2026-12-03T09:00:00Z") },
        { name: "Stalls", saleStartsAt: at("2026-12-01T09:00:00Z") },
      ),
    ).toEqual({
      kind: "ON_SALE_FROM",
      saleStartsAt: at("2026-12-01T09:00:00Z"),
    });
  });

  test("spec: all visible ticket types sold out -> sold out", () => {
    expect(
      summarize(
        { name: "Standing", quantityRemaining: 0 },
        { name: "Seated", quantityRemaining: 0 },
      ),
    ).toEqual({ kind: "SOLD_OUT" });
  });
});
