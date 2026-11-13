import "./load-env";
import { createDb, requireDatabaseUrl } from "../db/client";
import { seed } from "../db/seed";

const url = requireDatabaseUrl();
const db = createDb(url);
await seed(db);
db.$client.close();
console.log(`Seeded ${url}`);
