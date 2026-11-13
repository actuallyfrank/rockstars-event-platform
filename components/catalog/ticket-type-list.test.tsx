import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { RulesTicketType, VisibleTicketType } from "@/lib/catalog/rules";
import { expectNoA11yViolations } from "@/test/a11y";
import { mixedTicketTypes } from "@/test/fixtures/catalog";
import { TicketTypeList } from "./ticket-type-list";

type Row = RulesTicketType & { id: number };

function row(id: number, overrides: Partial<Row>): Row {
  return {
    id,
    name: "Regular",
    priceAmount: 3500,
    currency: "EUR",
    quantityRemaining: 142,
    saleStartsAt: null,
    saleEndsAt: null,
    ...overrides,
  };
}

function renderList(ticketTypes: VisibleTicketType<Row>[]) {
  render(
    <TicketTypeList ticketTypes={ticketTypes} timeZone="Europe/Amsterdam" />,
  );
  return screen.getAllByRole("listitem");
}

describe("TicketTypeList", () => {
  test("AVAILABLE: name, price and exact remaining count", () => {
    const [item] = renderList([
      { ticketType: row(1, { name: "Regular" }), state: "AVAILABLE" },
    ]);
    const scope = within(item);
    expect(scope.getByText("Regular")).toBeInTheDocument();
    expect(scope.getByText("€35.00")).toBeInTheDocument();
    expect(scope.getByText("142 left")).toBeInTheDocument();
    expect(scope.queryByText("Sold out")).not.toBeInTheDocument();
  });

  test("SOLD_OUT: name, price and a sold-out badge instead of a count", () => {
    const [item] = renderList([
      {
        ticketType: row(1, {
          name: "Early bird",
          priceAmount: 2500,
          quantityRemaining: 0,
        }),
        state: "SOLD_OUT",
      },
    ]);
    const scope = within(item);
    expect(scope.getByText("Early bird")).toBeInTheDocument();
    expect(scope.getByText("€25.00")).toBeInTheDocument();
    expect(scope.getByText("Sold out")).toBeInTheDocument();
    expect(scope.queryByText(/left/)).not.toBeInTheDocument();
  });

  test("NOT_YET_ON_SALE: name, price and the sale start in the event timezone", () => {
    const [item] = renderList([
      {
        ticketType: row(1, {
          name: "VIP",
          priceAmount: 8000,
          quantityRemaining: 40,
          // 1 Dec 10:00 in Amsterdam (CET, UTC+1)
          saleStartsAt: new Date("2026-12-01T09:00:00Z"),
        }),
        state: "NOT_YET_ON_SALE",
      },
    ]);
    const scope = within(item);
    expect(scope.getByText("VIP")).toBeInTheDocument();
    expect(scope.getByText("€80.00")).toBeInTheDocument();
    expect(item).toHaveTextContent(/On sale from Tue,? 1 Dec 2026, 10:00 CET/);
    expect(
      scope.getByText(/1 Dec 2026, 10:00/).closest("time"),
    ).toHaveAttribute("dateTime", "2026-12-01T09:00:00.000Z");
    expect(scope.queryByText(/left/)).not.toBeInTheDocument();
  });

  test("renders ticket types in the given (price) order", () => {
    const items = renderList([
      { ticketType: row(1, { name: "Regular" }), state: "AVAILABLE" },
      {
        ticketType: row(2, { name: "VIP", priceAmount: 8000 }),
        state: "AVAILABLE",
      },
    ]);
    expect(items.map((li) => li.getAttribute("data-ticket-type"))).toEqual([
      "Regular",
      "VIP",
    ]);
  });

  describe("accessibility", () => {
    test("every ticket state has no violations", async () => {
      const { container } = render(
        <TicketTypeList
          ticketTypes={mixedTicketTypes()}
          timeZone="Europe/Amsterdam"
        />,
      );
      await expectNoA11yViolations(container);
    });
  });
});
