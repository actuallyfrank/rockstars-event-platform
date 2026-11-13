import { expect, test } from "@playwright/test";
import { SEED_SLUGS } from "../db/seed";
import { expectNoA11yViolations } from "./a11y";

const pages = [
  { name: "event list", path: "/events" },
  {
    name: "detail: mixed tickets (image, end time, every ticket state)",
    path: `/events/${SEED_SLUGS.mixedTickets}`,
  },
  {
    name: "detail: no image, no end time",
    path: `/events/${SEED_SLUGS.noEndTime}`,
  },
  {
    name: "detail: sold out",
    path: `/events/${SEED_SLUGS.soldOut}`,
  },
  { name: "not found", path: `/events/${SEED_SLUGS.draft}` },
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility (${colorScheme} mode)`, () => {
    test.use({ colorScheme });

    for (const { name, path } of pages) {
      test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("main h1")).toBeVisible();
        await expectNoA11yViolations(page);
      });
    }
  });
}

test.describe("accessibility: structure and keyboard", () => {
  test("pages have a lang, a title, one h1 and a main landmark", async ({
    page,
  }) => {
    for (const { path } of pages) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
    }
  });

  test("an event can be opened with the keyboard alone", async ({ page }) => {
    await page.goto("/events");
    const link = page.getByRole("link", { name: "Winter Festival" });
    // Tab from the start of the page until the first event link has focus.
    for (
      let i = 0;
      i < 5 && !(await link.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { level: 1, name: "Winter Festival" }),
    ).toBeVisible();
  });
});

// Guards the helper itself: it must fail on a real violation.
test("expectNoA11yViolations fails on a contrast violation", async ({
  page,
}) => {
  await page.setContent(
    '<html lang="en"><head><title>t</title></head><body><main><p style="color:#ccc;background:#fff">Low contrast</p></main></body></html>',
  );
  await expect(expectNoA11yViolations(page)).rejects.toThrow(/color-contrast/);
});
