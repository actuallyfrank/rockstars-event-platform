import axe from "axe-core";
import { expect } from "vitest";
import { formatViolations, WCAG_TAGS } from "./a11y-config";

/**
 * Runs axe (WCAG 2.2 A/AA) on a rendered component and fails with a readable
 * list of violations.
 *
 * jsdom has no layout or computed colours, so `color-contrast` is skipped here.
 * Contrast is checked on real pages by `e2e/a11y.ts` (light and dark).
 */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: [...WCAG_TAGS] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}
