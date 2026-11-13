import { describe, expect, test } from "vitest";
import { formatDateTime, formatPrice } from "./format";

describe("formatPrice", () => {
  test("2500 EUR displays as EUR 25.00 (en-GB: €25.00)", () => {
    expect(formatPrice(2500, "EUR")).toBe("€25.00");
  });

  test("uses the ticket type's currency and its minor units", () => {
    expect(formatPrice(3550, "USD")).toBe("US$35.50");
    expect(formatPrice(1200, "JPY")).toBe("JP¥1,200");
  });

  test("zero is shown as a price", () => {
    expect(formatPrice(0, "EUR")).toBe("€0.00");
  });
});

describe("formatDateTime", () => {
  // 19:00 UTC on 10 Dec is 20:00 in Amsterdam (CET, UTC+1).
  const amsterdamEight = new Date("2026-12-10T19:00:00Z");

  test("spec: an Amsterdam event at 20:00 local time displays as 20:00", () => {
    const text = formatDateTime(amsterdamEight, "Europe/Amsterdam");
    expect(text).toContain("20:00");
    expect(text).toMatch(/^Thu,? 10 Dec 2026, 20:00 CET$/);
  });

  test("uses the event's timezone, not the server's", () => {
    expect(formatDateTime(amsterdamEight, "America/New_York")).toContain(
      "14:00",
    );
    expect(formatDateTime(amsterdamEight, "UTC")).toContain("19:00");
  });

  test("handles summer time (CEST, UTC+2)", () => {
    expect(
      formatDateTime(new Date("2026-07-01T18:00:00Z"), "Europe/Amsterdam"),
    ).toContain("20:00");
  });

  test("the local date can differ from the UTC date", () => {
    expect(
      formatDateTime(new Date("2026-12-10T23:30:00Z"), "Europe/Amsterdam"),
    ).toMatch(/^Fri,? 11 Dec 2026, 00:30 CET$/);
  });
});
