# Ascend

Ascend is the performance management workspace for Build Fast with AI. It is a
native Next.js App Router application built with React 19, TypeScript,
Tailwind CSS v4, Shadcn UI, Biome, and pnpm.

## Run locally

Use Node.js 20.9 or newer. The repository pins pnpm through the
`packageManager` field in `package.json`; Corepack may ask to download that
exact pnpm version the first time.

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

To enable the coach check-in transcript assistant, add the server-only
`GEMINI_API_KEY` to `.env.local`. The optional `GEMINI_MODEL` setting defaults
to `gemini-2.5-flash`.

The development server runs at [http://localhost:3000](http://localhost:3000).

## Architecture

```text
src/
  app/
    (workspace)/
      page.tsx                 overview
      charter/                 goal charter routes
      check-ins/               member check-in history
      impact/                  quarterly evidence
      scores/                  released scores
      coaching/                coach-only routes
      admin/                   administrator-only routes
      records/                 scoped records and downloads
      library/                 competency library
      docs/                    operating guide
    components/                product compositions and client forms
    signin/page.tsx            browser identity selection
    layout.tsx                 root Server Component
    globals.css                Tailwind v4 and Shadcn theme only
  components/ui/               Shadcn UI primitives
  data/                        typed roster, cycle, navigation, and library
  hooks/                       browser session and responsive hooks
  lib/                         shared types and utilities
```

Every sidebar destination is a real App Router route. Route pages and layouts
are Server Components by default. Client Components are limited to stateful
forms, browser storage, downloads, and the interactive Shadcn sidebar.

## Data and access

The roster is the real 17-person Build Fast with AI roster: two
administrators, six coaches, and nine members. The performance tracker source
contained no ratings, so Ascend does not fabricate charters, check-ins, or
scores for named colleagues.

This prototype uses the existing `ascend:pms:v1` localStorage key. Selecting a
person merges the `session.userId` into the existing object instead of
overwriting saved records.

- Members see their own workspace.
- Coaches see their own workspace and direct coachees.
- Administrators see programme settings and the complete roster.
- Direct record URLs are checked against the same role and coaching scope.

Identity selection is not authentication. A production deployment should use
server-backed authentication and authorization.

## Tooling

- Next.js 16.3.3 and React 19.2.8
- TypeScript 5.9 in strict mode with JavaScript disabled
- Tailwind CSS 4.3.3 and Shadcn UI
- Biome 2.5.10 for linting and formatting
- pnpm 11.23.0 with a committed lockfile

See [NEXTJS_MIGRATION_TASKS.md](./NEXTJS_MIGRATION_TASKS.md) for the completed
architecture migration and validation checklist.
