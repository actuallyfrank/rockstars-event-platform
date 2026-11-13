import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { ListedEvent } from "@/lib/catalog/queries";
import { EventList } from "./event-list";

describe("EventList", () => {
  test("empty list shows the no-upcoming-events message", () => {
    render(<EventList events={[]} />);
    expect(
      screen.getByText("There are no upcoming events."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  test("a non-empty list shows its events and no empty message", () => {
    const listed: ListedEvent = {
      event: {
        id: 1,
        slug: "jazz",
        title: "Jazz Night",
        description: "D",
        imageUrl: null,
        venueName: "Paradiso",
        location: "Amsterdam",
        timezone: "Europe/Amsterdam",
        startsAt: new Date("2026-12-10T19:00:00Z"),
        endsAt: null,
        status: "published",
      },
      ticketTypes: [],
      summary: { kind: "FROM", priceAmount: 3500, currency: "EUR" },
    };
    render(<EventList events={[listed]} />);

    expect(screen.getByRole("link", { name: "Jazz Night" })).toHaveAttribute(
      "href",
      "/events/jazz",
    );
    expect(screen.getByText("from €35.00")).toBeInTheDocument();
    expect(
      screen.getByText(/Thu,? 10 Dec 2026, 20:00 CET/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("There are no upcoming events."),
    ).not.toBeInTheDocument();
  });
});
