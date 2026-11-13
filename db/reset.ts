import { rmSync } from "node:fs";
import { createDb, localDbPath } from "./client";
import { migrateDb } from "./migrate";
import { seed } from "./seed";

/** Deletes a local database file, then migrates and seeds a fresh one. */
export async function resetDb(url: string, now: Date = new Date()) {
  const path = localDbPath(url);
  if (!path || path === ":memory:") {
    throw new Error(`Refusing to reset a non-file database: ${url}`);
  }
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    rmSync(path + suffix, { force: true });
  }

  const db = createDb(url);
  try {
    await migrateDb(db);
    await seed(db, now);
  } finally {
    db.$client.close();
  }
}
