import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { expectNoA11yViolations } from "@/test/a11y";
import { makeListedEvent } from "@/test/fixtures/catalog";
import { EventDetail } from "./event-detail";

describe("EventDetail", () => {
  test("shows title, start and end in the event timezone, venue, description and tickets", () => {
    render(<EventDetail listed={makeListedEvent()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Jazz Night" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("event-starts")).toHaveTextContent(
      /10 Dec 2026, 20:00 CET/,
    );
    expect(screen.getByTestId("event-ends")).toHaveTextContent(
      /11 Dec 2026, 00:00 CET/,
    );
    expect(screen.getByTestId("event-venue")).toHaveTextContent(
      "ParadisoWeteringschans 6-8, Amsterdam",
    );
    expect(screen.getByText("An evening of modern jazz.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  test("omits end time and image when the event has none", () => {
    const { container } = render(
      <EventDetail
        listed={makeListedEvent({ event: { endsAt: null, imageUrl: null } })}
      />,
    );
    expect(screen.queryByTestId("event-ends")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  describe("accessibility", () => {
    test("full event with image, end time and every ticket state has no violations", async () => {
      const { container } = render(<EventDetail listed={makeListedEvent()} />);
      await expectNoA11yViolations(container);
    });

    test("event without image or end time has no violations", async () => {
      const { container } = render(
        <EventDetail
          listed={makeListedEvent({ event: { endsAt: null, imageUrl: null } })}
        />,
      );
      await expectNoA11yViolations(container);
    });

    test("sections are labelled by their headings and the image is decorative", () => {
      const { container } = render(<EventDetail listed={makeListedEvent()} />);
      expect(screen.getByRole("region", { name: "About" })).toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: "Tickets" }),
      ).toBeInTheDocument();
      expect(container.querySelector("img")).toHaveAttribute("alt", "");
    });
  });
});
