# Ascend — Performance Management System

The performance management system for **Build Fast with AI**, deployed as a
Vite application and seeded from `HC_Report_BSWA_v2.xlsx`: the real roster,
the real units and levels, and the real coach allocation.

Goal charters, monthly check-ins, impact statements, quarterly scoring and
half-yearly scores — with access scoped by role, on screen and in every
download.

## Who can see what

One rule, applied everywhere: **you see yourself, and a coach also sees the
people they coach.** The same rule decides what a page renders and what a
download contains, so no export ever reaches further than the view.

| Role | Reads and downloads | Does not have |
| --- | --- | --- |
| **admin** — Founder, People & HR | Every person's charter, check-ins, impact statements, scores and transcript. Programme dashboard, people and coaching map, organisation-wide record book, full JSON backup, activity log. | — |
| **coach** — anyone with coachees | Their own record, plus the full record of each person they coach. CSV exports and a team record book, limited to that same set of people. | Another coach's coachees; the dashboard, people admin, cycle settings, org-wide record book, JSON backup, activity log. |
| **member** | Their own charter, check-ins, impact statements and released scores. | Anyone else's record; the Records & Downloads page. |

Enforcement lives in `src/core/access.js` and is applied in three places, so
a stale link or a leftover button cannot reach past a scope:

1. **Routing** — `canRoute` decides which routes a role may open at all.
2. **Views** — every record page checks `canView` and renders a refusal panel
   instead of the record.
3. **Exports** — `personRecord` returns nothing outside scope, `csvOf` filters
   every row set through `scopeRecords`, and each download action re-checks at
   the moment the file is produced.

Coaching is one level deep by design: a coach who coaches another coach sees
that coach's own record, not the records of the people below them.

> **No authentication.** There is no server and no password, so the sign-in
> screen selects an identity rather than proving one, and all data lives in the
> browser it runs in. The boundary above is enforced consistently in the
> application, but it is not a substitute for auth — deploy this where the
> people who can open it are the people on the roster.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve the build
npm test           # build, serve, then run the access and route suites
```

The build in `dist/` is fully static — any static host will serve it.

## Data

Seeded from `HC_Report_BSWA_v2.xlsx` into `src/data/roster.js`: 17 people —
2 administrators, 6 coaches, 9 team members; 10 full-time, 7 interns.

Roles are derived rather than invented: the Founder and People & HR are
administrators, anyone who appears in another person's *Coach* column is a
coach, everyone else is a team member.

Two decisions worth knowing:

- **Units** are normalised to the competency library's spelling
  (`Marketing` → `Marketing & Growth`, `Admin` → `Operations & Support`).
- **Avi's coach** is Sanjeev. The *Roster* tab says Aryan, but both *Reporting
  Lines* and *Performance Tracker* say Sanjeev, so the majority is used. Avi's
  *team leader* stays Aryan, which all three tabs agree on.

The *Performance Tracker* tab carries no ratings yet — everyone is "Pending" —
so **no charters, check-ins or scores are seeded for real colleagues**. The app
opens with the true roster and an empty cycle, ready for the team to fill in.

Changing someone's coach under *People & Coaches* immediately changes which
records the old and new coach can open and download. That column is the access
control.

## Layout

```
src/
  main.js              entry: event delegation, migration, boot
  actions.js           every data-act handler, each scope-checked
  core/
    access.js          who may read and download what          ← the access rule
    state.js           S / UI, localStorage persistence
    domain.js          people, cycles, records, score maths
    records.js         scope-aware record assembly
    seed.js            first-run state from the roster
    helpers.js         formatting, escaping, CSV, download
  data/
    roster.js          the headcount report, as data
    library.js         goal & competency library
    constants.js       scale, bands, units, levels, check-in stages
  ui/
    shell.js           nav, routing, render (route guard)
    fragments.js       shared UI pieces, incl. the scope bar
    modals.js          goal picker, competency picker, view-as
    bind.js            input binding
  views/               signin · member · coach · admin · records · library · docs
  exports/
    csv.js             CSV builders, scoped
    documents.js       printable record books, scoped
```

## Tests

`npm test` builds the app, serves it, and runs two Playwright suites:

- `scripts/smoke.mjs` — checks that each role's sidebar offers only what it may
  reach, and that driving the router straight at a restricted route is refused.
- `scripts/access.test.mjs` — plants records across three coaching trees, then
  downloads as an administrator, a coach and a member and reads the files back,
  asserting a coach's exports contain their own team and no one else's.
- `scripts/routes.test.mjs` — renders every route as six different people and
  fails on any runtime error or empty view.
