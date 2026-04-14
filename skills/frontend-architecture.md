# Frontend Architecture

## Directory Structure
- `app/` — Next.js App Router pages. No API routes (static export).
- `components/layout/` — Shell components (Container, Navbar).
- `components/ui/` — Reusable primitive components (Button, Card, Badge).
- `components/practice/` — Domain-specific practice UI.
- `lib/` — Utilities and shared TypeScript types.
- `store/` — Zustand stores.
- `data/mock/` — Mock data and localStorage-backed record helpers.

## Component Rules
- UI primitives live in `components/ui/`.
- Page-specific logic stays in `app/**/page.tsx` or local `components/`.
- Use `cn()` from `lib/utils.ts` for conditional Tailwind classes.

## State Rules
- Global practice session state → `store/practiceStore.ts`.
- User identity → `store/userStore.ts`.
- Persistent records → `data/mock/records.ts` (localStorage).
- Teacher config → `data/mock/teacherConfig.ts` (localStorage).

## Static Export Constraints
- No API routes.
- No `headers()` or `cookies()` from next/headers.
- Images must use `unoptimized: true`.
- Dynamic routes must use `generateStaticParams()` if they fetch data at build time.
