# Ascend — Performance Management System

The performance system for **Build Fast with AI**: goals set in advance, a coach
who talks with you every month, and a fair score at each quarter end — with the
written record of all three in one place.

Built as a Vite application. Access is by email: the roster decides who you are
and what you can open.

---

## Who can see what

| Signed in as | Sees | Can download |
|---|---|---|
| **Team member** | Their own charter, check-ins, Impact Statements and released scores | Their own forms (Print / PDF) |
| **Coach** | Their own record, plus the complete record of each person they coach | Records & downloads, scoped to themselves and their coachees |
| **Administrator** | Everyone, the programme dashboard and the activity log | Everything: every CSV, the whole-programme record book, the JSON backup |

The rule lives in one file, [`src/access.js`](src/access.js), and is applied in
three places, so there is no way round it by hand:

1. the navigation hides screens a role may not open;
2. the router refuses those routes, and refuses a named person outside scope;
3. every export builder filters its rows to the same scope before writing a file.

**What this is not.** With no server, this is enforcement in the browser. It
scopes what the application shows and exports — which is what a performance
record needs day to day — but it is not a security boundary against someone
editing their own browser's storage. See *Making it multi-user* below for the
seam to close that.

---

## The roster

17 people, 7 coaches, one named coach each — from `HC_Report_BFWA_v2.xlsx`:

| Coach | Coaches |
|---|---|
| Satvik (Founder · administrator) | Aryan, Prathmesh, Sakshi, Sanjeev, Sanket, Ankit |
| Aryan Patel | Anshuman, Bikash |
| Prathmesh Sadake | Om Pandey, Rishu |
| Ankit Choudhary | Jyoti, Mansa |
| Sakshi | Nitish |
| Sanjeev Patel | Avi |
| Sanket | Pratik |

Sumedha (People & HR) is the second administrator and coaches nobody.

The roster tab and the Reporting Lines tab disagreed on one person: **Avi**'s
coach reads *Aryan* on Roster but *Sanjeev* on both Reporting Lines and the
Performance Tracker. Sanjeev is used here — it is the two-to-one reading, and it
gives the seven coaches the rollout deck describes.

### Changing it

- **Permanently, for every deployment** — edit [`src/data/roster.js`](src/data/roster.js)
  and push. Everyone's records are keyed to the `id` field, so never renumber or
  reuse an id. New joiners appear on the next visit; existing records are untouched.
- **For one browser** — People & Coaches inside the app. *Re-apply the roster file*
  pulls the committed list back over the top.

A person signs in with the address in the `email` column. Extra addresses that
should also work go in `emails: []` — Sumedha has both her work and personal
addresses there.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
npm run preview    # serve the built site
```

Tests — build first, leave `npm run preview` running, then in another shell:

```bash
npm run check      # every module imports what it uses
npm run smoke      # every screen, for every role, plus the access refusals
npm run flow       # one full cycle: charter → review → approval → check-in →
                   # impact → scoring → release → acknowledgment, then a check
                   # that each role's downloads carry only what they may see
node scripts/shot.mjs   # screenshots of the main screens, into /tmp
```

All three run in CI on every push, before anything is published.

---

## Deployment

Pushing to `main` (or to `claude/app-deploy-role-access-8trbq9`) builds the site,
runs both test suites, and publishes to GitHub Pages —
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**One-time setup:** repository **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site is then served at
`https://<owner>.github.io/talent-ascend-bfwa/`.

Deploying anywhere else — an intranet path, S3, Netlify, a shared drive — is the
same build with a different base path:

```bash
BASE_PATH=/ npm run build     # then publish dist/
```

---

## Where the data lives

Each browser holds its own copy, in `localStorage`. Nothing is transmitted
anywhere. That is fine for running a cycle where the coach enters the record of
the conversation they just had — and it means:

- **the JSON backup is the durable copy.** Take one after every scoring round
  (Records & Downloads, or Cycles & Settings);
- a person's records do not follow them to another machine or browser profile;
- clearing site data clears the records.

### Making it multi-user

Two functions carry every read and write: `loadState()` and `save()` in
[`src/state.js`](src/state.js). Point them at an API and everything else works
unchanged. Then replace `signIn()` in [`src/auth.js`](src/auth.js) with your
identity provider — Google Workspace SSO fits this roster — and move the checks
in `src/access.js` behind the API, where they become enforcement rather than
scoping.

---

## The framework, in short

- **Score 1 — OKR attainment (60%)**: each goal scored 0.0–1.0 against its target;
  the average converts to 1–5 on fixed bands.
- **Score 2 — Competency (40%)**: one rating out of 5, discussed orally against
  five written commitments (three fixed, two chosen).
- **Quarterly = (Score 1 × 0.6) + (Score 2 × 0.4)** · half-yearly is the plain
  average of the two quarters · annual is the plain average of the halves.
- **3 is a good rating.** It means you delivered what was agreed, reliably.

Weights, dates, quarter labels, the goal maximum and the role names are all
configurable per cycle under Cycles & Settings.

---

## Layout

```
index.html              the shell
src/
  main.js               boot, event delegation
  auth.js               email sign-in — the seam to replace with SSO
  access.js             who may see and download what
  state.js              storage, the opening cycle, roster sync
  domain.js             the arithmetic: bands, weights, aggregation
  router.js             navigation, and the access checks on every route
  config.js             scale, bands, fixed competencies, check-in stages, nav
  ui.js                 modals, toasts, the score spine, form binding
  reports.js            CSV and record-book builders, scoped before writing
  actions.js            every button in the application
  views/                one file per area: member · coach · admin · records …
  data/roster.js        the 17 people, their emails and coach allocation
  data/library.js       135 example key results, 49 competencies
scripts/                the two test suites, an import checker, screenshots
```
