import "./load-env";
import { createDb, requireDatabaseUrl } from "../db/client";
import { migrateDb } from "../db/migrate";

const url = requireDatabaseUrl();
const db = createDb(url);
await migrateDb(db);
db.$client.close();
console.log(`Migrated ${url}`);
