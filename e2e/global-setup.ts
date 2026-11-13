import { resetDb } from "../db/reset";
import { E2E_DATABASE_URL } from "./env";

/**
 * Resets, migrates and seeds the e2e database before the run.
 * Playwright starts `webServer` before global setup; the app opens the
 * database lazily on the first request, so this runs before any query.
 */
export default async function globalSetup() {
  await resetDb(E2E_DATABASE_URL);
}
