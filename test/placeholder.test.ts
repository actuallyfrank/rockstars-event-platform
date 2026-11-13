import { expect, test } from "vitest";

test("vitest runs in node", () => {
  expect(typeof window).toBe("undefined");
});
