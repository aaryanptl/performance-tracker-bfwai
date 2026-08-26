# Ascend Supabase implementation plan

> **Implementation status — 26 Aug 2026:** The schema and roster are live in the
> `performance-tracker` Supabase project: 29 RLS-protected public tables, 17 people,
> 5 units, and 15 active coach assignments. The Next.js application now uses
> cookie-backed Supabase Auth with protected routes. Admin-provisioned Auth users
> and temporary credentials are the remaining activation step. Canonical SQL is
> under `supabase/migrations/`, with repeatable roster data in `supabase/seed.sql`.

## 1. Goal

Replace the browser-only identity selector and `localStorage` placeholders with:

- invite-only Supabase authentication;
- server-readable cookie sessions for Next.js App Router;
- a relational performance-management schema;
- database-enforced access using Postgres Row Level Security (RLS);
- auditable workflow transitions for charters, check-ins, reviews, calibration, sign-off, and acknowledgment.

This plan is based on the current repository and the Google Doc **Ascend - Performance Management System**, including its Employee Handbook and Coach Guide.

## 2. What exists today

The current app is a well-structured UI prototype, but it has no production identity or data boundary:

- `src/hooks/use-session.tsx` trusts a person ID stored in `ascend:pms:v1` in the browser.
- `src/app/components/sign-in-panel.tsx` exposes every employee as a selectable identity.
- `src/app/components/role-gate.tsx` is a client-side display gate, not authorization.
- `src/data/people.ts` ships the full roster and employment details in the application bundle.
- The forms only set local saved-state indicators; the charter writes only a timestamp to `localStorage`.
- People, coaching relationships, cycle dates, competencies, and ratings are hard-coded.
- There are no API/server actions, database migrations, RLS policies, or audit records.

Production authorization must therefore be implemented in the database and repeated at the server route/action boundary. Hiding a route in the sidebar is only a UX decision.

## 3. Product rules extracted from the handbook

The schema and policies must preserve these rules:

1. A performance cycle lasts six months and contains two quarters.
2. Each participant creates no more than five goals and exactly five competency commitments.
3. Competencies are three fixed plus two selected. For coaches, `Coaching & Collaboration` replaces `Collaboration`.
4. Goals require a measurable key result, baseline, target, and named data source.
5. Goal approval order is participant draft -> assigned coach review -> Founder approval -> lock.
6. There is one check-in per participant per month, with no score or rating.
7. A check-in records a summary, way forward, owners/support, and acknowledgment from both people.
8. Each goal is scored from `0.0` to `1.0` at quarter end.
9. Score 1 is derived from the unweighted average of goal attainment:
   - `>= 0.95` -> 5
   - `>= 0.80` -> 4
   - `>= 0.65` -> 3
   - `>= 0.45` -> 2
   - `< 0.45` -> 1
10. Score 2 is one overall competency rating from 1 to 5.
11. Quarterly score = `(Score 1 * 0.6) + (Score 2 * 0.4)`.
12. Half-year score = average of the cycle's two quarterly scores. Annual score = average of the two half-year scores.
13. Ratings are calibrated before release. The Founder signs off; the participant acknowledges and may leave a verbatim comment.
14. Approved goals are intended to be visible across the organisation. Scores are private to the participant, assigned coach, and Founder.
15. People & HR administers the programme but is not listed among those allowed to see scores.
16. Nothing should change silently after a review conversation or approval.

## 4. Decisions needed before implementation

These are real source conflicts or missing decisions, not technical questions:

1. **Review cadence conflict.** The main handbook says quarter ends are short scoring checkpoints and the full Impact Statement/review happens every half-year. The Coach Guide and its Quarterly Review Form describe an Impact Statement and 60-minute review every quarter. Recommended default: keep quarterly scoring and half-year reviews as separate record types, with the schema able to support an Impact Statement at either level until HR confirms the cadence.
2. **Approved-goal visibility.** The handbook says everyone's goals are visible. Confirm whether that means all approved goal text and targets are visible to every employee, or only status/summary. Recommended default: all authenticated employees can read approved charters, but drafts and review comments stay private.
3. **Founder access to check-in notes.** The handbook does not explicitly grant the Founder routine access to private monthly conversation notes. Recommended default: participant and assigned coach only; Founder and HR see completion metadata, not content.
4. **Roster email correction.** `Rishu` currently has `Rishi@buildfastwithai.com`. Confirm the correct address before invitations are sent.
5. **Cycle status.** On 26 Aug 2026 the configured cycle is in its goal-setting window and starts on 1 Sep, so it should not yet be represented as simply `Active`. Add explicit states such as `draft`, `goal_setting`, `active`, `calibration`, and `closed`.

## 5. Authentication design

### Recommended sign-in method

Use **admin-provisioned email/password accounts without SMTP** for the first release:

- HR/Founder preloads the roster; a server-only provisioning script creates confirmed Auth users with unique temporary passwords.
- Public sign-up is disabled, so unknown email addresses cannot create accounts.
- Sign-in uses `signInWithPassword`.
- Every new Auth user receives a server-controlled `app_metadata.must_change_password` flag and is forced to replace the temporary password before any Data API access is allowed.
- Password recovery is manual until custom SMTP is added. An administrator resets the password and securely gives the user a new temporary credential.
- Configure localhost, preview, and production URLs explicitly even though this flow does not send email links.

Google OAuth can be added later, but an email-domain-only check is insufficient because the current HR account uses Gmail. Access must be based on a pre-provisioned roster row, not merely the email domain.

### Next.js session architecture

Install `@supabase/supabase-js` and `@supabase/ssr`.

Create:

- `src/lib/supabase/client.ts` — browser client with the publishable key;
- `src/lib/supabase/server.ts` — server client backed by `next/headers` cookies;
- `src/lib/supabase/proxy.ts` — session refresh helper;
- `src/proxy.ts` — Next.js 16 proxy that refreshes authentication cookies and redirects anonymous users;
- `src/app/change-password` — mandatory temporary-password replacement;
- server actions for sign-in, sign-out, password change, and authenticated mutations.

Use `getClaims()` in the proxy/session refresh path and verify the user again for sensitive server actions. Do not trust `getSession()` in server authorization code. RLS remains the final enforcement layer even when a route is protected.

### Environment variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only, only if the app sends invitations or performs trusted administration:

- `SUPABASE_SECRET_KEY`

Never expose the secret/service-role key through a `NEXT_PUBLIC_` variable. Prefer current publishable and secret keys over legacy `anon` and `service_role` naming for a new project.

### Identity linking

Keep the HR roster independent from Auth so the roster can exist before a person accepts an invitation:

- `people.auth_user_id` references `auth.users.id`, but is nullable and unique; pending roster rows have no linked user.
- An invite/linking transaction matches a normalized, pre-approved email to exactly one `people` row.
- Never auto-create a person from arbitrary `user_metadata`.
- Authorization roles live in database tables or server-controlled `app_metadata`, never in user-editable `user_metadata`.

## 6. Proposed database schema

Use UUID primary keys, `timestamptz` timestamps, `created_at`/`updated_at`, foreign keys, explicit checks, and RLS on every exposed table. Use `citext` or a unique index on `lower(email)` for normalized email matching.

### A. Identity and organisation

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `organizations` | Build Fast with AI tenant and future isolation boundary | `id`, `name`, `slug unique` |
| `units` | Product, AI & Engineering, Sales & Service, etc. | `id`, `organization_id`, `name`, unique per organisation |
| `people` | HR roster and Auth identity link, including pending invitees | `id`, `organization_id`, `auth_user_id nullable unique`, `work_email`, `display_name`, `title`, `unit_id`, `job_level`, `employment_type`, `authority_role`, `active` |
| `coach_assignments` | Effective-dated coaching relationships | `coachee_id`, `coach_id`, `effective_from`, `effective_to`, `created_by`; prevent self-coaching and overlapping active assignments |

`authority_role` should be `member`, `hr_admin`, or `founder`. Do not store `coach` as the sole authorization role: coaching rights come from an active assignment. The Founder can therefore also coach people without losing Founder authority.

### B. Calendar and participant snapshots

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `cycles` | Six-month performance cycle | dates, goal window, weights, max goals, lifecycle status |
| `quarters` | Two scoring periods per cycle | `cycle_id`, `sequence` 1/2, start/end/scoring due dates, unique `(cycle_id, sequence)` |
| `cycle_participants` | Historical snapshot of each person's role and relationships for the cycle | `cycle_id`, `person_id`, `coach_id`, `leader_id`, `unit_id`, title/level/employment snapshots; unique `(cycle_id, person_id)` |

All performance records should reference `cycle_participants`, not the mutable current roster. This preserves history when a title, unit, or coach changes later.

### C. Competency and goal libraries

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `competencies` | Organisation competency library | name, category, description, fixed audience, active flag |
| `competency_levels` | What ratings 1–5 mean for a competency/level | `competency_id`, optional job level, rating 1–5, behaviour description |

Goal-template examples remain in the companion workbook for the first release; they can be promoted to a database table later if the product needs in-app template management.

Add the missing `Coaching & Collaboration` competency before seeding. Align rating labels with the handbook (`Partially Meets`, `Does Not Meet`) unless HR approves the prototype wording.

### D. Goal charters

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `goal_charters` | One charter per participant per cycle | `cycle_participant_id unique`, workflow status, version, submitted/reviewed/approved/locked timestamps |
| `charter_goals` | Up to five measurable goals | `charter_id`, `sort_order`, outcome, key result, baseline, target, measurement unit, data source; unique ordering |
| `charter_competencies` | Exactly five competencies and commitments | `charter_id`, `competency_id`, commitment, `selection_type` fixed/selected, sort order |
| `charter_decisions` | Immutable coach and Founder decisions | actor, actor capacity, decision, comment, timestamp, charter version |

Do not include goal weights: the handbook's Score 1 uses an unweighted mean. Enforce the maximum-five-goal rule and exactly-five-competency rule in the submit transaction, not merely in the UI. The final-approval transaction locks the charter.

### E. Monthly check-ins

Split administrative metadata from confidential content so HR can monitor completion without reading conversations.

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `check_ins` | Monthly occurrence and completion metadata | participant, coach, month, scheduled/held dates, status; unique `(cycle_participant_id, month_start)` |
| `check_in_notes` | Confidential conversation content | `check_in_id unique`, summary, blockers, way forward, recognition, support |
| `check_in_actions` | Explicit next actions | check-in, owner person, action, due date, completion state |
| `check_in_acknowledgments` | Digital signatures/acknowledgments | check-in, actor, capacity, acknowledged_at; unique per actor/capacity |

Use an authenticated user ID plus timestamp as the initial signature. Do not collect image signatures unless there is a legal requirement.

### F. Impact and quarterly scoring

| Table | Purpose | Important columns / constraints |
| --- | --- | --- |
| `impact_statements` | Participant-authored narrative for a quarter or half-year period | participant, period type/id, status, submitted_at, learning carried forward |
| `impact_items` | Structured impact entries | statement, optional goal, result/evidence text, optional competency, competency evidence, sort order |
| `evidence_links` | URLs or references supporting an impact/goal score | owner record type/id, label, URL, data-source note |
| `quarterly_reviews` | One review per participant per quarter | goal average, Score 1, Score 2, quarterly score, recommendation, workflow status, release timestamp |
| `goal_scores` | Per-goal attainment and evidence | review, charter goal, actual result, attainment between 0 and 1, evidence note |
| `competency_review_notes` | Evidence discussed against each commitment | review, charter competency, evidence note; no required individual rating |
| `development_actions` | One owned development action per coachee/cycle | participant, coach owner, action, support type, due date, status |
| `calibration_events` | Append-only calibration changes and rationale | review, actor, before/after ratings, rationale, timestamp |
| `review_acknowledgments` | Founder sign-off and employee acknowledgment/comment | review, actor, capacity, decision, verbatim comment, timestamp |

The client must never send calculated aggregate scores as trusted values. Use a database function/transaction to:

1. validate every goal has a score;
2. calculate the unweighted goal average;
3. map it to Score 1;
4. validate Score 2 is 1–5;
5. calculate the quarterly score;
6. write an audit event atomically.

Only the assigned coach can draft scoring. Only calibration/Founder actions can move it to releasable/released states. After release, corrections create a new version/event; they do not silently overwrite history.

### G. Derived summaries and audit

| Table / object | Purpose | Notes |
| --- | --- | --- |
| `performance_summaries` | Half-year or annual score from two released components | Generated final average; same score privacy as reviews |
| `workflow_events` | Append-only state history | record type/id, from/to state, actor, reason, timestamp |
| `audit_log` | Administrative security events | Restricted to Founder and HR; do not duplicate confidential score/note bodies |

If views are introduced, create them with `security_invoker = true` on supported Postgres versions. Keep `security definer` helper functions in a non-exposed `private` schema with an empty `search_path` and narrowly granted execution.

### H. Optional file storage

Defer uploads for the first release unless the team needs evidence attachments. URLs and named data sources are enough for the current handbook. If uploads are added, use a private bucket and policies aligned with the owning record. Storage upserts require select, insert, and update permissions.

## 7. Access-control matrix

The database should recognize four effective capacities: self, assigned coach, Founder, and HR administrator. A person may have more than one capacity.

| Data / action | Employee (self) | Assigned coach | Founder | HR admin | Other employees |
| --- | --- | --- | --- | --- | --- |
| Own profile | Read; limited safe edits | Read coachee work profile | Read | Manage roster | Read minimal directory fields |
| Coach assignments | Read own | Read own assignments | Read/manage | Manage | No |
| Cycles / quarters | Read | Read | Manage | Manage | Read |
| Competency library | Read | Read | Manage | Manage | Read |
| Charter draft | Create/edit until submission | Read/comment direct coachees | Read | Status only | No |
| Coach charter decision | No | Direct coachees only | Read | Status only | No |
| Founder approval / lock | No | No | All | Workflow status only | No |
| Approved charter | Read own | Read direct coachees | Read all | Read non-sensitive content | Read organisation-wide if handbook rule is confirmed |
| Check-in occurrence/status | Read own | Create/manage direct coachees | Read status | Read/manage status | No |
| Check-in notes/actions | Read/acknowledge own | Create/read direct coachees | No by default | No | No |
| Impact draft | Create/edit own | No until submitted | No until submitted | Status only | No |
| Submitted impact | Read own | Read direct coachees | Read | Status only | No |
| Goal scores / review draft | No direct write | Create/update direct coachees before calibration | Read all | Status only | No |
| Calibration | No | Participate in assigned reviews | Final authority | Status only | No |
| Released score/review | Read own | Read direct coachees | Read all | No score/content | No |
| Founder sign-off | No | No | All | Status only | No |
| Employee acknowledgment/comment | Own only | Read afterward | Read | Completion status only | No |
| Organisation exports | Own record only | Direct coachees | Full, including scores | Administrative export without private scores/notes | No |

RLS helpers should answer questions such as:

- `private.current_person_id()`
- `private.current_authority_role()`
- `private.is_founder()`
- `private.is_hr_admin()`
- `private.is_assigned_coach(cycle_participant_id)`
- `private.can_read_released_score(cycle_participant_id)`

Every table gets explicit policies for each required operation (`select`, `insert`, `update`, `delete`) plus matching grants. Do not use a broad `for all` policy. The `anon` role receives no application-table access.

## 8. Workflow state machines

### Charter

`draft -> submitted -> coach_changes_requested | coach_reviewed -> founder_changes_requested | approved_locked`

- Employee may edit only `draft` or a returned revision.
- Assigned coach may decide only after submission.
- Founder may approve only after coach review.
- Approval records the charter version and locks child rows.

### Check-in

`planned -> held -> coach_recorded -> employee_acknowledged -> complete`

No score fields exist in this workflow.

### Quarterly review

`not_open -> employee_input_open -> employee_submitted -> coach_draft -> calibration -> founder_signed -> released -> employee_acknowledged`

The exact placement of employee input depends on the cadence decision in section 4.

## 9. Repository changes by phase

### Phase 0 — Confirm product decisions

- Resolve the five decisions in section 4.
- Confirm production URL and who is allowed to provision/reset users. SMTP can be added later for self-service recovery.
- Confirm the roster and all email addresses before touching Auth.

### Phase 1 — Bootstrap Supabase and authentication

- Create separate Supabase projects for development/staging and production, or at minimum keep production isolated.
- Initialize/link the Supabase CLI after checking the installed CLI's `--help` and version.
- Add `@supabase/supabase-js` and `@supabase/ssr`.
- Add browser/server clients, Next.js proxy session refresh, sign-in, sign-out, password change, and protected workspace redirect.
- Replace identity selection with an email/password screen.
- Disable public user creation and configure the password policy plus application URLs.
- Add a safe server-only user provisioning workflow with temporary credentials.

### Phase 2 — Identity, roster, and RLS foundation

- Create migrations for organisations, people, units, assignments, cycles, quarters, and cycle participants.
- Seed the 17-person roster only after validating email addresses.
- Link accepted invitations to pre-provisioned roster rows.
- Replace `PEOPLE`, `ACTIVE_CYCLE`, and client role gates with server queries and RLS-backed data.
- Keep lightweight client gates only for navigation/UX.

### Phase 3 — Libraries and goal-charter workflow

- Import the approved competency/OKR library after comparing the companion workbook with current placeholder data.
- Build charter tables, constraints, submit/review/approve functions, and policy tests.
- Update the UI from three weighted goals to up to five unweighted goals plus exactly five competency commitments.
- Implement coach-first and Founder-second approval with immutable events.

### Phase 4 — Check-ins

- Implement monthly check-in metadata, private notes, actions, and two acknowledgments.
- Give HR completion dashboards without note access.
- Add due/late indicators derived from cycle months.

### Phase 5 — Scoring, calibration, and release

- Implement impact statements according to the confirmed cadence.
- Implement goal scores and server/database-calculated aggregates.
- Implement calibration, Founder sign-off, score release, employee acknowledgment, and verbatim comments.
- Build half-year and annual summaries only from released component scores.

### Phase 6 — Exports, audit, and production hardening

- Scope exports through server actions and RLS; never assemble a full roster/score export in the browser.
- Add audit logs, version history, backup/restore checks, and retention rules.
- Add rate limits and bot protection to OTP requests.
- Enable leaked-password protection if password login is introduced later; consider MFA for Founder/HR.
- Run Supabase database/security advisors and fix findings before launch.

## 10. Testing and acceptance criteria

### Authentication

- Unknown email cannot create an account or enter the workspace.
- Provisioned user can sign in and is linked to exactly one roster row.
- A temporary-password user cannot read application tables before changing the password.
- Sign-out clears the cookie session; protected routes redirect.
- Secret keys never appear in client bundles, network responses, or logs.

### RLS role tests

Test every important operation as:

- unauthenticated;
- employee A;
- employee B;
- A's assigned coach;
- an unrelated coach;
- Founder;
- HR admin.

Minimum negative tests:

- one employee cannot read another person's private draft, check-in, impact, or score;
- an unrelated coach cannot read or mutate the record;
- HR cannot read score rows or check-in-note rows;
- coach cannot approve a charter as Founder;
- employee cannot change a locked charter or calculated score;
- no client can forge its role through metadata or submitted IDs.

### Data integrity

- Cannot submit more than five goals or anything other than five competencies.
- Required fixed competencies are present; coach substitution is correct.
- Goal attainment remains between 0 and 1.
- Score conversion and 60/40 calculation match the handbook's worked example (`0.79 -> Score 1 = 3`, Score 2 `4`, quarterly `3.4`).
- Half-year and annual averages use only signed/released records.
- Every state transition produces an immutable workflow event.

### Application verification

- Every existing route loads under a real authenticated session.
- Direct URLs are denied by the server/database, not just hidden in navigation.
- Loading, empty, validation, error, and concurrent-update states are handled.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build` pass.
- Generated Supabase TypeScript types are current with the migrations.

## 11. Recommended first implementation slice

The safest first vertical slice is:

1. admin-provisioned email/password authentication;
2. people/Auth linking, coach assignments, and cycle-participant snapshot;
3. RLS helpers and tests;
4. authenticated self dashboard plus coach coachee list;
5. one draft -> coach review -> Founder approval charter flow.

Do not build scoring before this slice proves that identity linking, relationship-based access, versioning, and the two-step approval chain work correctly.

## 12. Current Supabase references

- [Server-side rendering](https://supabase.com/docs/guides/auth/server-side)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework)
- [Passwordless email login](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [User invitations](https://supabase.com/docs/guides/auth/users)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
