import { expect, test } from "@playwright/test";
import { LISTED_SEED_SLUGS, SEED_SLUGS } from "../db/seed";

const card = (page: import("@playwright/test").Page, slug: string) =>
  page.locator(`[data-event-slug="${slug}"]`);

test.describe("event list", () => {
  test("/ redirects to /events", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/events$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Upcoming events" }),
    ).toBeVisible();
  });

  test("shows only listed events, soonest first", async ({ page }) => {
    await page.goto("/events");
    const slugs = await page
      .locator("[data-event-slug]")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-event-slug")),
      );
    expect(slugs).toEqual([...LISTED_SEED_SLUGS]);
  });

  test("shows the expected ticket summaries", async ({ page }) => {
    await page.goto("/events");

    // Cheapest available (Regular), not the sold-out Early bird or hidden Presale.
    await expect(card(page, SEED_SLUGS.mixedTickets)).toContainText(
      "from €35.00",
    );
    await expect(card(page, SEED_SLUGS.inProgress)).toContainText(
      "from €45.00",
    );

    const soldOut = card(page, SEED_SLUGS.soldOut);
    await expect(soldOut.getByText("Sold out", { exact: true })).toBeVisible();
    await expect(soldOut).not.toContainText("from €");

    const upcoming = card(page, SEED_SLUGS.notYetOnSale);
    await expect(upcoming).toContainText(/On sale from .+\d{2}:\d{2}/);
    await expect(upcoming).not.toContainText("from €");
  });

  test("each entry shows title, start time, venue, image when present and a link", async ({
    page,
  }) => {
    await page.goto("/events");

    const jazz = card(page, SEED_SLUGS.mixedTickets);
    await expect(
      jazz.getByRole("heading", { name: "Jazz Night" }),
    ).toBeVisible();
    await expect(jazz.locator("time")).toHaveText(/\d{4}, \d{2}:\d{2} CES?T$/);
    await expect(jazz).toContainText("Paradiso");
    await expect(jazz.locator("img")).toHaveCount(1);
    await expect(
      jazz.getByRole("link", { name: "Jazz Night" }),
    ).toHaveAttribute("href", `/events/${SEED_SLUGS.mixedTickets}`);

    // No image for this event: none rendered.
    await expect(card(page, SEED_SLUGS.noEndTime).locator("img")).toHaveCount(
      0,
    );
  });

  test("selecting an event opens its detail page", async ({ page }) => {
    await page.goto("/events");
    await card(page, SEED_SLUGS.mixedTickets)
      .getByRole("link", { name: "Jazz Night" })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/events/${SEED_SLUGS.mixedTickets}$`),
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Jazz Night" }),
    ).toBeVisible();
  });
});
