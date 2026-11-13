import "./load-env";
import { requireDatabaseUrl } from "../db/client";
import { resetDb } from "../db/reset";

const url = requireDatabaseUrl();
await resetDb(url);
console.log(`Reset ${url} (deleted, migrated, seeded)`);
