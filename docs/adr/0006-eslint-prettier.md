# 0006. ESLint and Prettier

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

We want consistent formatting and the React/Next.js-specific lint rules (hooks rules, `next/image` and `next/link` guidance, Core Web Vitals checks).

## Options considered

- **ESLint + Prettier**: Next.js's official ESLint config covers framework rules. Prettier handles formatting. The most familiar setup.
- **Biome**: one fast tool for lint and format, but it doesn't cover all the Next.js and React ESLint rules.

## Decision

Use **ESLint** with a flat config (`eslint.config.mjs`) that extends the Next.js config (`eslint-config-next`, Core Web Vitals + TypeScript), and **Prettier** for formatting, with `eslint-config-prettier` so the two don't conflict. Run them via `pnpm lint` and `pnpm format`.

## Consequences

- Two tools to configure and keep in step. `eslint-config-prettier` turns off the overlapping rules.
- Recent Next.js versions removed the `next lint` command, so ESLint runs through its own CLI script.
- `pnpm lint`, `pnpm format --check` (or equivalent), type-checking (`tsc --noEmit`) and `pnpm test` together form the local "done" check for each task.
