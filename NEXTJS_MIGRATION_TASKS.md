# Ascend clean Next.js architecture tasks

## What is our goal

Rebuild Ascend as a native Next.js 16 App Router application. Every sidebar
destination must be a real route, all application code must be TypeScript, and
all interface primitives must come from Shadcn UI with Tailwind CSS v4.

## What outcome we want

- `src/app/page.tsx` is the overview page.
- Every sidebar destination has its own `src/app/**/page.tsx` route.
- Shared product compositions live in `src/app/components/`.
- Shadcn primitives live in `src/components/ui/` and are the only UI
  primitives used by product components.
- Typed source data lives in `src/data/`, browser-state hooks in `src/hooks/`,
  and framework-independent helpers and types in `src/lib/`.
- There is no catch-all route, legacy renderer, HTML-string rendering, global
  DOM event delegation, `app.css`, or source `.js` file.
- `globals.css` contains only Tailwind v4 and the Shadcn theme/base layer.
- pnpm and Biome remain the only package manager and lint/format tool.

## What are the steps to do it

### Task 1: Create the typed domain and data layer

- [x] Define shared `Person`, `Role`, `Cycle`, navigation, and record types.
- [x] Move the real roster into a typed `src/data/people.ts` module.
- [x] Move cycle, competency, scale, and workflow content into typed data.
- [x] Preserve the `ascend:pms:v1` browser-storage key without overwriting
  existing saved records.

### Task 2: Build the native App Router shell

- [x] Keep the root layout as a Server Component.
- [x] Add a narrow client session provider for localStorage and interaction.
- [x] Compose the application shell from the Shadcn Sidebar, Avatar, Button,
  Badge, Select, Separator, and Skeleton components.
- [x] Filter navigation by the selected person's role.
- [x] Add route-group layouts and role gates for workspace, coaching, records,
  and admin sections.

### Task 3: Create dedicated page routes

- [x] Add overview, sign-in, charter, check-ins, impact, and scores pages.
- [x] Add coachees, approvals, scoring, coach check-in, and review pages.
- [x] Add admin dashboard, people, and cycles pages.
- [x] Add records, person record, library, and documentation pages.
- [x] Keep dynamic person routes typed and validate unknown IDs with
  `notFound()`.

### Task 4: Replace legacy UI with Shadcn compositions

- [x] Build shared page headers, metric cards, status/empty states, people
  tables, and forms under `src/app/components/`.
- [x] Use Shadcn Card, Table, Tabs, Input, Textarea, Alert, Progress, Empty,
  Badge, and Button primitives throughout.
- [x] Keep interactive forms as small Client Components and route content as
  Server Components by default.

### Task 5: Remove the compatibility layer

- [x] Remove `src/app/[[...slug]]/page.tsx`.
- [x] Remove the dynamic import bridge and legacy mount entry.
- [x] Remove all source `.js` files and disable JavaScript in TypeScript config.
- [x] Remove `src/styles/app.css` and its import.
- [x] Update README architecture documentation.

### Task 6: Verify the rebuilt application

- [x] Run Biome lint and format checks.
- [x] Run strict TypeScript checks.
- [x] Build the production Next.js application.
- [x] Confirm there are no source `.js` files or legacy imports.
