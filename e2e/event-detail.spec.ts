import { expect, test, type Page } from "@playwright/test";
import { HIDDEN_SEED_SLUGS, SEED_SLUGS } from "../db/seed";

async function expectNotFoundPage(page: Page, slug: string) {
  await page.goto(`/events/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Event not found" }),
  ).toBeVisible();
  // Soft 404 (Next.js 16 streams before notFound()): status 200, but noindex.
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]').first(),
  ).toBeAttached();
}

test.describe("event detail", () => {
  test("unknown slug shows the not-found page", async ({ page }) => {
    await expectNotFoundPage(page, "no-such-event");
  });

  for (const slug of HIDDEN_SEED_SLUGS) {
    test(`hidden event ${slug} shows the not-found page`, async ({ page }) => {
      await expectNotFoundPage(page, slug);
      await expect(page.locator("[data-ticket-type]")).toHaveCount(0);
    });
  }

  test("shows the event details", async ({ page }) => {
    await page.goto(`/events/${SEED_SLUGS.mixedTickets}`);

    await expect(
      page.getByRole("heading", { level: 1, name: "Jazz Night" }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Jazz Night/);
    // Shown in the event timezone. Seed dates are relative to now, so the
    // exact hour depends on DST; exact local times are covered by
    // lib/catalog/format.test.ts.
    await expect(page.getByTestId("event-starts")).toHaveText(
      /\d{4}, \d{2}:\d{2} CES?T$/,
    );
    await expect(page.getByTestId("event-ends")).toHaveText(
      /\d{4}, \d{2}:\d{2} CES?T$/,
    );
    await expect(page.getByTestId("event-venue")).toContainText("Paradiso");
    await expect(page.getByTestId("event-venue")).toContainText(
      "Weteringschans 6-8, Amsterdam",
    );
    await expect(page.getByText(/modern jazz/)).toBeVisible();
    await expect(page.locator("article img")).toHaveCount(1);
  });

  test("event without end time or image shows neither", async ({ page }) => {
    await page.goto(`/events/${SEED_SLUGS.noEndTime}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Open-ended Meetup" }),
    ).toBeVisible();
    await expect(page.getByTestId("event-starts")).toBeVisible();
    await expect(page.getByTestId("event-ends")).toHaveCount(0);
    await expect(page.locator("article img")).toHaveCount(0);
  });

  test("mixed-ticket event: visible ticket types by price with their state", async ({
    page,
  }) => {
    await page.goto(`/events/${SEED_SLUGS.mixedTickets}`);
    const rows = page.locator("[data-ticket-type]");

    // Presale's sale has closed: hidden. The rest by price ascending.
    await expect(rows).toHaveCount(3);
    expect(
      await rows.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-ticket-type")),
      ),
    ).toEqual(["Early bird", "Regular", "VIP"]);
    await expect(page.getByText("Presale")).toHaveCount(0);

    const earlyBird = page.locator('[data-ticket-type="Early bird"]');
    await expect(earlyBird).toContainText("€25.00");
    await expect(
      earlyBird.getByText("Sold out", { exact: true }),
    ).toBeVisible();
    await expect(earlyBird).not.toContainText("left");

    const regular = page.locator('[data-ticket-type="Regular"]');
    await expect(regular).toContainText("€35.00");
    await expect(regular).toContainText("142 left");

    const vip = page.locator('[data-ticket-type="VIP"]');
    await expect(vip).toContainText("€80.00");
    await expect(vip).toContainText(/On sale from .+\d{4}, \d{2}:\d{2} CES?T/);
    await expect(vip).not.toContainText("left");
  });
});
