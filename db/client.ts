import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

/**
 * Creates a Drizzle database for a libSQL URL (`file:./data/dev.db`, `:memory:`, ...).
 *
 * Foreign key enforcement: libSQL turns `foreign_keys` on by default for every
 * connection, including the extra connections its pool opens lazily, so no
 * per-connection PRAGMA is needed. `db/client.test.ts` guards this.
 */
export function createDb(url: string) {
  ensureParentDir(url);
  const client = createClient({ url });
  return drizzle(client, { schema });
}

let cached: Db | undefined;

/** The app-wide database, configured only by `DATABASE_URL`. */
export function getDb(): Db {
  if (!cached) {
    cached = createDb(requireDatabaseUrl());
  }
  return cached;
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local (see README).",
    );
  }
  return url;
}

/** Local file path for a `file:` URL, or undefined for other URLs. */
export function localDbPath(url: string): string | undefined {
  if (!url.startsWith("file:")) return undefined;
  if (url.startsWith("file://")) return fileURLToPath(url);
  return url.slice("file:".length);
}

function ensureParentDir(url: string) {
  const path = localDbPath(url);
  if (path) mkdirSync(dirname(path), { recursive: true });
}
