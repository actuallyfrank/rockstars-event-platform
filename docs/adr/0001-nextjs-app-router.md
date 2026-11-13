# 0001. Next.js App Router with TypeScript

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The platform starts with a public, anonymous event catalog (list and detail pages) and will grow into ticket purchase and organiser management. The design asks for server-rendered or pre-rendered public pages for search indexing and link previews, a not-found response for hidden events, and a short cache window. One team owns both the UI and the data access.

## Options considered

- **Next.js (App Router)**: full-stack React with Server Components, server-side data access without a separate API, built-in `notFound()`, metadata API for link previews, route-level caching controls.
- **Separate SPA + API** (e.g. Vite React + Node API): clear split, but two deployables, and the design would need the rules behind a read-only API.
- **Other meta-frameworks** (Remix/React Router, SvelteKit, Astro): workable, but the team's starting preference is Next.js.

## Decision

Use **Next.js 16 with the App Router** and React Server Components, written in **TypeScript with `strict` on**. Use **Node.js 24 LTS** and **pnpm** as the package manager.

- Public pages are async Server Components that query the database directly on the server.
- Server Actions and route handlers are reserved for later changes (purchase, organiser tools).
- Domain logic (visibility and sale-state rules) lives in plain TypeScript modules outside `app/`, with no Next.js imports, so it can be unit-tested without the framework.

## Consequences

- No public API is needed for the catalog change.
- Async Server Components can't be rendered by React Testing Library the normal way. Page tests therefore run in a real browser with Playwright against the built app, and RTL is used for presentational components only (see [0004](0004-vitest-playwright.md)).
- Caching in Next.js has changed between major versions. The cache window for catalog pages must be set explicitly and kept at 60 seconds or less, not left to defaults.
- pnpm's strict `node_modules` layout can surface undeclared dependencies early. That is intended.
