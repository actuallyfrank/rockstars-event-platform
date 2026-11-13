# 0005. Tailwind CSS

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The catalog needs a handful of server-rendered pages: an event list with cards, a detail page, ticket rows, and badges (sold out, on sale from). Styling must work with Server Components and add no client-side runtime.

## Options considered

- **Tailwind CSS**: utility classes, the default in `create-next-app`, zero runtime, works with Server Components.
- **Tailwind + shadcn/ui**: adds copy-in accessible components. Speeds up richer UI, but adds many files for a few pages.
- **CSS Modules**: built in, plain scoped CSS, no dependency. More hand-written CSS for layout and states.

## Decision

Use **Tailwind CSS 4** with the PostCSS setup that `create-next-app` generates. No component library for now.

## Consequences

- Small repeated pieces (badge, price, ticket row) become small React components instead of copied class lists.
- Use semantic HTML and visible text for states ("Sold out", "On sale from …") so they are accessible and easy to assert on in tests. Don't rely on color alone.
- Adding shadcn/ui later is additive and doesn't need this decision reversed.
