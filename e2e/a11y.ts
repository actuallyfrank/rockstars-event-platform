import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { formatViolations, WCAG_TAGS } from "../test/a11y-config";

/** Runs axe (WCAG 2.2 A/AA, including colour contrast) on the current page. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags([...WCAG_TAGS])
    .analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}
