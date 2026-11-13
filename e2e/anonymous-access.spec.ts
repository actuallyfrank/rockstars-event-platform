import { expect, test, type Browser } from "@playwright/test";
import { LISTED_SEED_SLUGS, SEED_SLUGS } from "../db/seed";

/** A brand-new context: no cookies, no local storage, no session. */
async function anonymousPage(browser: Browser) {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  return { context, page: await context.newPage() };
}

test.describe("anonymous access", () => {
  test("event list: 200 and shows the list without login", async ({
    browser,
  }) => {
    const { context, page } = await anonymousPage(browser);
    expect(await context.cookies()).toEqual([]);

    const response = await page.goto("/events");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["set-cookie"]).toBeUndefined();
    await expect(page.locator("[data-event-slug]")).toHaveCount(
      LISTED_SEED_SLUGS.length,
    );
    await expect(page.getByText(/log ?in|sign ?in|register/i)).toHaveCount(0);
    await context.close();
  });

  test("event detail: 200 and shows the details without login", async ({
    browser,
  }) => {
    const { context, page } = await anonymousPage(browser);

    const response = await page.goto(`/events/${SEED_SLUGS.mixedTickets}`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["set-cookie"]).toBeUndefined();
    await expect(
      page.getByRole("heading", { level: 1, name: "Jazz Night" }),
    ).toBeVisible();
    await expect(page.getByText(/log ?in|sign ?in|register/i)).toHaveCount(0);
    await context.close();
  });
});
