import { migrate } from "drizzle-orm/libsql/migrator";
import { fileURLToPath } from "node:url";
import type { Db } from "./client";

export const migrationsFolder = fileURLToPath(
  new URL("../drizzle", import.meta.url),
);

/** Applies all committed drizzle-kit migrations. */
export async function migrateDb(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder });
}
