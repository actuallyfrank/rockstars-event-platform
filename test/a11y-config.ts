import type { Result } from "axe-core";

/** WCAG 2.2 level A and AA: the accessibility bar for every component and page. */
export const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

/** Readable failure message: rule, impact, help text and offending nodes. */
export function formatViolations(violations: Result[]): string {
  if (violations.length === 0) return "No accessibility violations";
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.target.join(" ")}: ${n.failureSummary ?? ""}`)
        .join("\n");
      return `[${v.impact ?? "unknown"}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes}`;
    })
    .join("\n\n");
}
