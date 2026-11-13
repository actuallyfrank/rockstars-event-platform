# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is an index. Read the linked doc before working in that area; keep details in those docs, not here.

## Commands

pnpm only (version pinned in `package.json`; `corepack enable`). Full list in [`README.md`](README.md).

```bash
pnpm install
cp .env.example .env.local            # DATABASE_URL=file:./data/dev.db
pnpm db:reset                         # delete data/dev.db, migrate, seed
pnpm exec playwright install chromium # one-time, for e2e
pnpm dev                              # http://localhost:3000 (/ redirects to /events)
```

| Purpose                                  | Command                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Vitest (unit, integration, component)    | `pnpm test`                                                             |
| One Vitest file / one test               | `pnpm test lib/catalog/rules.test.ts` / `pnpm test -t "spec: sold out"` |
| One Vitest project only                  | `pnpm test --project node` or `--project component`                     |
| Playwright (builds app, serves on :3100) | `pnpm test:e2e`                                                         |
| One Playwright spec                      | `pnpm test:e2e e2e/event-list.spec.ts`                                  |
| Lint / format check / typecheck          | `pnpm lint` / `pnpm format:check` / `pnpm typecheck`                    |
| Schema change → migration                | edit `db/schema.ts`, then `pnpm db:generate` (commit `drizzle/`)        |
| Re-seed (refreshes relative dates)       | `pnpm db:seed`                                                          |

`pnpm typecheck` runs `next typegen` first, which generates the global `PageProps<"/route">` / `LayoutProps` types used by pages. Run it after adding routes.

Done means `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` all pass.

## Docs

| Topic                                                               | Source                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Setup, all `pnpm` commands, database and test overview              | [`README.md`](README.md)                                                                         |
| Requirements: proposal, design, specs, tasks per change             | [`openspec/changes/`](openspec/changes/); archived specs in [`openspec/specs/`](openspec/specs/) |
| Tech stack and how it maps to the design                            | [`docs/tech-stack.md`](docs/tech-stack.md)                                                       |
| Why each technology was chosen; changing a decision means a new ADR | [`docs/adr/`](docs/adr/)                                                                         |
| Testing and accessibility rules, definition of done                 | [`.claude/rules/testing.md`](.claude/rules/testing.md)                                           |
| Next.js 16 agent rules                                              | [`AGENTS.md`](AGENTS.md); API guides in `node_modules/next/dist/docs/`                           |
| OpenSpec workflow                                                   | `opsx:*` / `openspec-*` skills in [`.claude/skills/`](.claude/skills/)                           |
