import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createDb, type Db } from "@/db/client";
import { migrateDb } from "@/db/migrate";

export type TestDb = {
  db: Db;
  url: string;
  path: string;
  /** Closes the client and deletes the database file. */
  destroy: () => void;
};

/** A fresh, migrated libSQL database in its own temp file. */
export async function createTestDb(): Promise<TestDb> {
  const dir = mkdtempSync(join(tmpdir(), "rockstars-test-"));
  const path = join(dir, "test.db");
  const url = pathToFileURL(path).href;
  const db = createDb(url);
  await migrateDb(db);
  return {
    db,
    url,
    path,
    destroy: () => {
      db.$client.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

type SchemaObject = {
  type: string;
  name: string;
  tbl_name: string;
  sql: string | null;
};

/** Every table, index and trigger, sorted, for schema comparisons. */
export async function dumpSchema(db: Db): Promise<SchemaObject[]> {
  const result = await db.$client.execute(
    "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
  );
  return result.rows.map((row) => ({
    type: String(row.type),
    name: String(row.name),
    tbl_name: String(row.tbl_name),
    sql: row.sql === null ? null : String(row.sql),
  }));
}

/**
 * Asserts that a query fails with a SQLite error matching `pattern`.
 * Drizzle wraps driver errors ("Failed query: ..."), keeping the SQLite message on `cause`.
 */
export async function rejectsWithSqlError(
  query: PromiseLike<unknown>,
  pattern: RegExp,
): Promise<void> {
  let error: unknown;
  try {
    await query;
  } catch (e) {
    error = e;
  }
  if (!(error instanceof Error)) {
    throw new Error(`Expected query to fail with ${pattern}, but it succeeded`);
  }
  const messages = [error.message];
  if (error.cause instanceof Error) messages.push(error.cause.message);
  if (!messages.some((m) => pattern.test(m))) {
    throw new Error(
      `Expected SQL error matching ${pattern}, got: ${messages.join(" | ")}`,
    );
  }
}
