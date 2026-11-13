// Load .env files with the same precedence as Next.js (.env.local over .env).
// Variables already set in the environment win, so `DATABASE_URL=... pnpm db:reset` works.
import * as nextEnvModule from "@next/env";

// @next/env is CommonJS: Node's ESM loader exposes it as `default`, while
// drizzle-kit's CJS bundling of drizzle.config.ts exposes named exports.
type NextEnv = typeof nextEnvModule;
const nextEnv: NextEnv =
  (nextEnvModule as NextEnv & { default?: NextEnv }).default ?? nextEnvModule;

nextEnv.loadEnvConfig(process.cwd());
