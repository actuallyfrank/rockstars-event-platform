import { expect, test } from "@playwright/test";
import { count } from "drizzle-orm";
import { createDb } from "../db/client";
import { event } from "../db/schema";
import { buildSeedEvents } from "../db/seed";
import { E2E_DATABASE_URL } from "./env";

test("home page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});

test("runs against the freshly seeded e2e database", async () => {
  const db = createDb(E2E_DATABASE_URL);
  try {
    const [{ n }] = await db.select({ n: count() }).from(event);
    expect(n).toBe(buildSeedEvents(new Date()).length);
  } finally {
    db.$client.close();
  }
});
