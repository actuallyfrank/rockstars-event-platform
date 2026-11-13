import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { expectNoA11yViolations } from "@/test/a11y";
import { makeListedEvent } from "@/test/fixtures/catalog";
import { EventList } from "./event-list";

/** One listed event per ticket-summary state; one without an image. */
const events = [
  makeListedEvent(),
  makeListedEvent({
    event: { id: 2, slug: "rock-show", title: "Rock Show", imageUrl: null },
    summary: { kind: "SOLD_OUT" },
  }),
  makeListedEvent({
    event: { id: 3, slug: "gala", title: "New Year Gala" },
    summary: {
      kind: "ON_SALE_FROM",
      saleStartsAt: new Date("2026-12-01T09:00:00Z"),
    },
  }),
];

describe("EventList", () => {
  test("empty list shows the no-upcoming-events message", () => {
    render(<EventList events={[]} />);
    expect(
      screen.getByText("There are no upcoming events."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  test("an entry shows title link, start time, venue and summary", () => {
    render(<EventList events={[makeListedEvent()]} />);

    expect(screen.getByRole("link", { name: "Jazz Night" })).toHaveAttribute(
      "href",
      "/events/jazz-night",
    );
    expect(screen.getByText("from €35.00")).toBeInTheDocument();
    expect(
      screen.getByText(/Thu,? 10 Dec 2026, 20:00 CET/),
    ).toBeInTheDocument();
    expect(screen.getByText("Paradiso")).toBeInTheDocument();
    expect(
      screen.queryByText("There are no upcoming events."),
    ).not.toBeInTheDocument();
  });

  test("shows each ticket-summary state as text", () => {
    render(<EventList events={events} />);
    expect(screen.getByText("from €35.00")).toBeInTheDocument();
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    const gala = screen
      .getByRole("link", { name: "New Year Gala" })
      .closest("article");
    expect(gala).toHaveTextContent(/On sale from Tue,? 1 Dec 2026, 10:00 CET/);
  });

  describe("accessibility", () => {
    test("empty list has no violations", async () => {
      const { container } = render(<EventList events={[]} />);
      await expectNoA11yViolations(container);
    });

    test("list with every summary state has no violations", async () => {
      const { container } = render(<EventList events={events} />);
      await expectNoA11yViolations(container);
    });

    test("entries are a named list of headed articles with one link each", () => {
      render(<EventList events={events} />);
      expect(
        screen.getByRole("list", { name: "Upcoming events" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(3);
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });
});
