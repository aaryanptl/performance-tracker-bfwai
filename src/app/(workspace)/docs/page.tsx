import type { ReactNode } from "react";

import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LIBRARY_COMPETENCIES, LIBRARY_OKRS } from "@/data/library";
import {
  ACTIVE_CYCLE,
  APPROVER_LABEL,
  CHECKIN_STAGES,
  PROGRAMME_OWNER_LABEL,
  RATINGS,
  SCORE_BANDS,
} from "@/data/performance";

const SECTIONS = [
  ["what", "What this system is"],
  ["arch", "The two scores and the scale"],
  ["roles", "Who does what"],
  ["flow", "The cycle, end to end"],
  ["s1", "Step 1 · Goal setting"],
  ["s2", "Step 2 · Monthly check-ins"],
  ["s3", "Step 3 · The Impact Statement"],
  ["s4", "Step 4 · Quarterly scoring"],
  ["s5", "Step 5 · Calibration, release, acknowledgment"],
  ["s6", "Step 6 · Half-yearly and annual scores"],
  ["screens", "Every screen, and what it does"],
  ["access", "Who can see what"],
  ["records", "Records, transcripts and downloads"],
  ["setup", "Setting the system up"],
  ["gov", "Fairness, privacy and governance"],
  ["faq", "Questions people ask"],
] as const;

const { okr, competency } = ACTIVE_CYCLE.weights;
const BAND_LADDER = SCORE_BANDS.map((band) => `${band.range} → ${band.rating}`).join(" · ");

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 grid gap-4 text-sm leading-6">{children}</div>
    </section>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <Card className="bg-accent/40">
      <CardContent className="text-sm leading-6">{children}</CardContent>
    </Card>
  );
}

function Framed({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}

function List({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const className = "grid gap-2 pl-5 text-sm leading-6 marker:text-muted-foreground";
  return ordered ? (
    <ol className={`list-decimal ${className}`}>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static prose list
        <li key={index}>{item}</li>
      ))}
    </ol>
  ) : (
    <ul className={`list-disc ${className}`}>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static prose list
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const TIMELINE = [
  [
    "Goal-setting window",
    `ten days before the cycle. Team member drafts → coach reviews and signs → ${APPROVER_LABEL} approves. The approved sheet is the Goal Charter, locked for the cycle.`,
  ],
  [
    "Every month",
    "a 15-minute check-in. No ratings, no status labels. Summary and way forward recorded and signed by both.",
  ],
  ["Three days before each quarter end", "the team member shares their Impact Statement."],
  [
    "At each quarter end",
    "a 30-minute scoring conversation: each goal scored 0.0–1.0 from its data source, competencies discussed orally, Score 1 and Score 2 recorded.",
  ],
  ["Quarter end + one week", "calibration across all coaches, then sign-off and release."],
  [
    "At the half-year",
    "the full 60-minute review and feedback session. Half-yearly score = the average of the two quarters.",
  ],
  [
    "At the year end",
    "final annual score = the average of the halves; it informs growth and reward decisions.",
  ],
] as const;

const SCREENS = [
  ["Overview", "What needs you next, your charter at a glance, and where you are in the cycle."],
  [
    "My Goal Charter",
    "Draft and send the charter; after approval, record what you actually achieved against each goal, each quarter. Printable.",
  ],
  [
    "My Check-ins",
    "Every monthly record, with the summary and way forward, and your signature.",
  ],
  ["Impact Statement", "Write and share your own account of your impact, one per quarter."],
  [
    "My Scores",
    "Released scores with the working shown, the development needs, your acknowledgment and your verbatim comment.",
  ],
  [
    "My Coachees",
    "The coach's list: charter status, check-in count, scores, and a way into each person's record.",
  ],
  ["Charter Reviews", `Sign or return drafts. ${APPROVER_LABEL} also approves here.`],
  ["Quarterly Scoring", "One row per coachee per quarter, and the scoring screen itself."],
  [
    "Programme Dashboard",
    "Completion, score distribution, coach load — the administrator's view of whether the rhythm is actually being kept.",
  ],
  ["People & Coaches", "Add people, set units and titles, allocate coaches."],
  [
    "Cycles & Settings",
    "Cycle dates, goal window, number of check-ins, maximum goals, the two weights, quarter labels and deadlines, and naming.",
  ],
  ["Records & Downloads", "Every export, per record type or per person, plus the activity log."],
  [
    "Goal & Competency Library",
    `${LIBRARY_OKRS.length} example key results and ${LIBRARY_COMPETENCIES.length} competencies with level descriptions, browsable by unit.`,
  ],
] as const;

const ACCESS = [
  [
    "admin",
    "Every person's charter, check-ins, impact statements, scores and transcript. The programme dashboard, the people and coaching map, the organisation-wide record book, the full JSON backup and the activity log.",
    "—",
  ],
  [
    "coach",
    "Their own record, and the full record of each person they coach: charters, check-ins, impact statements, scores and transcripts. CSV exports and a team record book, both limited to that same set of people.",
    "Another coach's coachees. The programme dashboard, people admin, cycle settings, the organisation-wide record book, the JSON backup and the activity log.",
  ],
  [
    "member",
    "Their own charter, check-ins, impact statements and released scores, and the printable copies of each from their own screens.",
    "Anyone else's record, and the Records & Downloads page.",
  ],
] as const;

const FAQ = [
  [
    "Is 3 a bad score?",
    "No. It means you delivered what was agreed, reliably. Most people should land there most of the time.",
  ],
  [
    "What if my goals change mid-cycle?",
    "The charter is locked so the target cannot move under you. If the work genuinely changes, raise it at a check-in — the change is recorded there, and the coach accounts for it when scoring against the data source.",
  ],
  [
    "What if I disagree with my score?",
    "Say so in the conversation, and put it in writing in your acknowledgment comment. It is recorded verbatim and travels with the record.",
  ],
  [
    "Can my coach change a score after we talked?",
    "Only before signing. After signing it goes to calibration, and after release it is fixed with all three signatures and timestamps attached.",
  ],
  [
    "What happens if a check-in is missed?",
    "It shows as missing on the dashboard and in the coach's completion count. Check-in completion is part of how coaching itself is assessed.",
  ],
  [
    "Do interns follow the same system?",
    "Yes, usually with two or three goals instead of five, and the intern-conversion recommendation on the review form.",
  ],
] as const;

export default function DocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Documentation"
        title="How Ascend works"
        description="Everything the system does, in the order it happens: how goals are set, how conversations are recorded, how a score is built, and where every record can be downloaded from."
      />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="grid gap-10">
          <Section id="what" title="What this system is">
            <p>
              Ascend runs one clear performance rhythm: <strong>goals set in advance</strong>,{" "}
              <strong>a coach who talks with you every month</strong>, and{" "}
              <strong>a fair score at each quarter end</strong>. It replaces scattered impressions
              with a written record everyone can see and trust.
            </p>
            <p>
              Three things follow from that design. Nobody is surprised at review time, because the
              goals were written and approved before the cycle started and feedback happened
              monthly. Decisions about growth get made on evidence, because every goal names the
              data source it will be judged from. And the record belongs to both sides — the team
              member writes their own account of their impact, and can add a verbatim comment to any
              score.
            </p>
            <Callout>
              <strong>Read the scale once, properly.</strong> On a five-point scale,{" "}
              <strong>3 is a good rating</strong>. It means you reliably delivered what was agreed —
              which is exactly what the organisation asks. A well-set charter usually averages
              0.7–0.8 on goal attainment; a row of perfect 1.0s usually means the goals were set too
              safe.
            </Callout>
          </Section>

          <Section id="arch" title="The two scores and the scale">
            <p>Every person carries two scores each quarter, both on a 1–5 scale:</p>
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-52">Score</TableHead>
                    <TableHead className="w-24">Weight</TableHead>
                    <TableHead>What it measures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Score 1 — OKR attainment</TableCell>
                    <TableCell className="tabular-nums">{okr * 100}%</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      What you delivered against the approved goals in your Goal Charter (maximum{" "}
                      {ACTIVE_CYCLE.maxGoals}).
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Score 2 — Competency</TableCell>
                    <TableCell className="tabular-nums">{competency * 100}%</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      How you delivered it — assessed orally by your coach at each quarterly scoring
                      against your written competency commitments, as one rating out of 5.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Framed>
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rating</TableHead>
                    <TableHead className="w-52">Label</TableHead>
                    <TableHead>Meaning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RATINGS.map((rating) => (
                    <TableRow key={rating.value} className={rating.value === 3 ? "bg-accent/40" : ""}>
                      <TableCell className="font-semibold tabular-nums">{rating.value}</TableCell>
                      <TableCell className="font-medium">{rating.label}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {rating.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Framed>
            <p>
              <strong>
                Quarterly score = (Score 1 × {okr}) + (Score 2 × {competency}).
              </strong>{" "}
              Half-yearly = the plain average of the cycle's quarters. Annual = the plain average of
              the halves. Nothing else is weighted.
            </p>
          </Section>

          <Section id="roles" title="Who does what">
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Role</TableHead>
                    <TableHead>Responsibilities in the system</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">Team member</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      Drafts the Goal Charter (goals, targets, data sources, competency commitments)
                      · records what was actually achieved · writes the Impact Statement each
                      quarter and shares it three days before the conversation · signs each check-in
                      · acknowledges each score with an optional verbatim comment.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge>Coach</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      Reviews each coachee's draft first — refining targets, checking measurability,
                      confirming the competency commitments · holds and records a 15-minute check-in
                      every month · verifies the Impact Statement against the data sources · scores
                      each goal 0.0–1.0 and records Score 2 · writes the verified impact summary and
                      the development needs · owns one development action per coachee per cycle ·
                      brings ratings to calibration.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Administrator</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      Everything a coach does, plus: final approval of every charter · calibration
                      and release of scores · people, coach allocation and cycle settings · download
                      of every record and transcript.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Framed>
          </Section>

          <Section id="flow" title="The cycle, end to end">
            <Card>
              <CardContent className="grid gap-3">
                {TIMELINE.map(([when, what]) => (
                  <p key={when} className="text-sm leading-6">
                    <strong>{when}</strong> — <span className="text-muted-foreground">{what}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          </Section>

          <Section id="s1" title="Step 1 · Goal setting">
            <p>
              Goal setting happens once before each six-month cycle, on <em>My Goal Charter</em>.
            </p>
            <List
              ordered
              items={[
                <>
                  <strong>The team member drafts.</strong> Up to {ACTIVE_CYCLE.maxGoals} goals. Each
                  one can be picked from the library — {LIBRARY_OKRS.length} example key results
                  across the units — or written from scratch. Every goal needs a measurable key
                  result, a baseline, a target, and a named data source.
                </>,
                <>
                  <strong>Competencies are chosen.</strong> Three are fixed for everyone:
                  Communication, Discipline &amp; Documentation, and Collaboration. Two more are
                  chosen with the coach from the library of {LIBRARY_COMPETENCIES.length}. Each of
                  the five carries a one-line commitment — what the person will actually{" "}
                  <em>do</em> under it. That commitment is what the quarterly discussion is judged
                  against, so "Communication" becomes "weekly written project update to all
                  stakeholders".
                </>,
                <>
                  <strong>The coach reviews first.</strong> On <em>Charter Reviews</em>, the coach
                  either signs the review — sharpening targets and confirming measurability — or
                  returns it with a written note saying what must change.
                </>,
                <>
                  <strong>{APPROVER_LABEL} approves.</strong> The last signature. On approval the
                  charter is locked for the cycle and becomes the single reference for what success
                  means.
                </>,
              ]}
            />
            <Callout>
              The library is a menu, not a binding list. Adapt the wording to real work, and replace
              the illustrative numbers with your own baseline and target.
            </Callout>
          </Section>

          <Section id="s2" title="Step 2 · Monthly check-ins">
            <p>
              Fifteen minutes, once a month, on the four-stage framework — an adaptation of the GROW
              model — so quality is consistent across every coach:
            </p>
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Stage</TableHead>
                    <TableHead className="w-20">Time</TableHead>
                    <TableHead>What the coach does</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CHECKIN_STAGES.map((stage) => (
                    <TableRow key={stage.key}>
                      <TableCell className="font-medium">{stage.title}</TableCell>
                      <TableCell className="tabular-nums">{stage.minutes} min</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {stage.prompt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Framed>
            <p>
              The coach opens <em>Record a check-in</em> from the coachee's page, fills the four
              stages in the room, and signs. The team member then signs their own record. No ratings
              are given here — a check-in is a conversation, not an evaluation. Either side can add
              to the conversation record underneath, and everything added is downloadable by the
              administrator.
            </p>
            <p>
              <strong>Ground rules:</strong> listen roughly 70/30 in the coachee's favour · ask
              before offering solutions · make feedback specific and behavioural ("the client deck
              went out with two data errors", not "be more careful") · name the specific thing done
              well rather than a general "good job" · protect the slot, because a skipped check-in
              tells someone their development is optional.
            </p>
          </Section>

          <Section id="s3" title="Step 3 · The Impact Statement">
            <p>
              This is the only part the team member writes at review time, and it is the most
              important one. On <em>Impact Statement</em> they write two things for the quarter: the
              impact created against their goals, with real numbers, and how they lived each of
              their five competency commitments. It is shared three days before the scoring
              conversation, and becomes read-only once shared, so the record cannot move after the
              fact.
            </p>
            <p>
              The coach reads it before scoring and verifies each claim against the Goal Charter,
              the check-in records, and the named data sources.
            </p>
          </Section>

          <Section id="s4" title="Step 4 · Quarterly scoring">
            <p>
              On <em>Quarterly Scoring</em> the coach opens each coachee for the quarter and works
              down one screen:
            </p>
            <List
              ordered
              items={[
                <>
                  <strong>Read Part 1</strong> — the Impact Statement, alongside what the person
                  recorded as their actuals.
                </>,
                <>
                  <strong>Score each goal 0.0–1.0</strong> against its target, using the named data
                  source. Delivered fully = 1.0; delivered 80% of the target ≈ 0.8.
                </>,
                <>
                  The system averages those and converts the average to <strong>Score 1</strong> on
                  fixed bands: {BAND_LADDER}.
                </>,
                <>
                  <strong>Discuss the five competencies orally</strong> against the written
                  commitments and the library's level descriptions — what a 5, a 3 and a 1 look like
                  — then record one overall rating as <strong>Score 2</strong>.
                </>,
                <>
                  Write the two sections of Part 2: <strong>the impact this person created</strong>{" "}
                  (the coach's verified summary) and <strong>the development needs</strong>, with
                  the training, exposure or support that will be provided.
                </>,
                <>Choose a recommendation and sign. The quarterly score is computed, not typed.</>,
              ]}
            />
            <p>
              <strong>Rating traps to avoid:</strong> recency bias (rating the last month instead of
              the quarter — re-read the check-ins first), central tendency (defaulting everyone to 3
              to avoid conversations), and halo/horns (letting one win or one visible miss colour
              every judgment).
            </p>
          </Section>

          <Section id="s5" title="Step 5 · Calibration, release, acknowledgment">
            <p>
              A signed score is not yet a released score. All coaches and {APPROVER_LABEL} align the
              quarter's ratings first, so that a 4 means the same thing everywhere and outliers get
              challenged. The administrator then signs off and releases, which is the moment the
              team member can see the score on <em>My Scores</em>.
            </p>
            <p>
              The team member acknowledges it and may add a comment, recorded verbatim on the form.
              Both the comment and the whole conversation record go into the downloadable file.
            </p>
          </Section>

          <Section id="s6" title="Step 6 · Half-yearly and annual scores">
            <p>
              No new arithmetic. The half-yearly score is the plain average of the cycle's two
              quarterly scores. The annual score is the plain average of the two half-yearly scores.
              The full 60-minute review and feedback conversation happens at the half-year — the
              quarters are scoring checkpoints.
            </p>
            <Callout>
              <strong>Worked example.</strong> Four goals score 0.95, 0.80, 0.65 and 0.75 → average
              0.79 → that falls in the 0.65–0.79 band → Score 1 = 3. The competency discussion lands
              at strong-but-not-exceptional → Score 2 = 4. Quarterly = (3 × {okr}) + (4 ×{" "}
              {competency}) = 3.4. If the four quarters of a year come in at 3.4, 3.6, 3.7 and 3.9,
              then H1 = 3.5, H2 = 3.8, and the annual score is 3.65.
            </Callout>
          </Section>

          <Section id="screens" title="Every screen, and what it does">
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">Screen</TableHead>
                    <TableHead>What happens there</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SCREENS.map(([screen, what]) => (
                    <TableRow key={screen}>
                      <TableCell className="font-medium">{screen}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {what}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Framed>
          </Section>

          <Section id="access" title="Who can see what">
            <p>
              Access follows one rule, applied everywhere:{" "}
              <strong>you see yourself, and a coach also sees the people they coach.</strong> The
              same rule decides what appears on screen and what a download contains — there is no
              view that shows more than the corresponding export, and no export that reaches further
              than the view.
            </p>
            <Framed>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Role</TableHead>
                    <TableHead>Reads and downloads</TableHead>
                    <TableHead>Does not have</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACCESS.map(([role, has, hasNot]) => (
                    <TableRow key={role}>
                      <TableCell>
                        <Badge variant="outline">{role}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {has}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {hasNot}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Framed>
            <p>
              A coach's scope is defined by the <em>Coach</em> column under People &amp; Coaches,
              which is seeded from the headcount report. Changing someone's coach changes,
              immediately, which records the old and the new coach can open. Coaching is one level
              deep on purpose: a coach who coaches another coach sees that coach's own record, not
              the records of the people below them.
            </p>
          </Section>

          <Section id="records" title="Records, transcripts and downloads">
            <p>
              Every screen writes to a record, and every record can leave the system. Under{" "}
              <em>Records &amp; Downloads</em> — scoped, as above, to the people you may read:
            </p>
            <List
              items={[
                <>
                  <strong>Goal charters (CSV)</strong> — one row per goal with objective, key
                  result, baseline, target, data source, actuals and each quarter's score;
                  competency commitments follow as their own rows.
                </>,
                <>
                  <strong>Monthly check-ins (CSV)</strong> — all four stages, both signatures, and
                  the way forward agreed.
                </>,
                <>
                  <strong>Impact statements (CSV)</strong> — exactly as written by the team member,
                  with the date shared.
                </>,
                <>
                  <strong>Quarterly scores (CSV)</strong> — goal-score average, Score 1, Score 2,
                  the quarterly score, the coach's impact summary, development needs,
                  recommendation, all three sign-offs and the member's verbatim comment.
                </>,
                <>
                  <strong>Conversation transcript (CSV)</strong> — every entry either side added to
                  any record, with author, role and timestamp.
                </>,
                <>
                  <strong>Score summary (CSV)</strong> — one row per person: each quarter's Score 1,
                  Score 2 and quarterly score, the half-yearly score, and the standing
                  recommendation.
                </>,
                <>
                  <strong>People and coaching map (CSV)</strong> — position, unit, year-at-level,
                  employment type, team leader and coach.
                </>,
                <>
                  <strong>Record book (HTML)</strong> — one person's complete file, or everyone in
                  your scope at once, formatted to read and to print or save as PDF. This is the
                  document to hand over in a promotion discussion, an audit, or an exit.
                </>,
                <>
                  <strong>Full backup (JSON)</strong> — everything, restorable elsewhere.{" "}
                  {PROGRAMME_OWNER_LABEL} only, because it contains every person's record.
                </>,
              ]}
            />
            <p>
              Individual forms — charter, check-in, impact statement, review — also print to PDF
              from their own screens.
            </p>
          </Section>

          <Section id="setup" title="Setting the system up">
            <List
              ordered
              items={[
                <>
                  <strong>Check your people</strong> under People &amp; Coaches. The roster is
                  seeded from the headcount report — name, email, position, unit, year-at-level,
                  employment type, team leader and coach. Coaches themselves have a coach too.
                  Remember that the <em>Coach</em> column is also the access control: it decides
                  whose records that coach can open and download.
                </>,
                <>
                  <strong>Set the cycle</strong> under Cycles &amp; Settings: start and end, the
                  goal-setting window, how many check-ins, the maximum number of goals, and which
                  quarter carries the full review.
                </>,
                <>
                  <strong>Check the weights.</strong> They default to {okr}/{competency}. If you
                  change them, keep them adding to 1.00.
                </>,
                <>
                  <strong>Rename the roles</strong> if your organisation calls them something else.
                  "{APPROVER_LABEL}" appears throughout the interface and in every export.
                </>,
                <>
                  <strong>Open the goal window</strong> and tell people to draft. Charters cannot be
                  scored until they are approved.
                </>,
              ]}
            />
          </Section>

          <Section id="gov" title="Fairness, privacy and governance">
            <List
              items={[
                <>
                  <strong>The system is public; the scores are private.</strong> A score is known to
                  the person, their coach, and the approver — and the application enforces exactly
                  that, on screen and in every download.
                </>,
                <>
                  <strong>Review order is fixed</strong> — coach first, then approver, for charters
                  and for scores. Nothing changes silently after a conversation.
                </>,
                <>
                  <strong>Goals must be measurable with a named data source</strong>, and every
                  review is verified against those sources. Evidence over impression.
                </>,
                <>
                  <strong>Everyone sees their review in writing</strong> and acknowledges it
                  themselves, with space for their own comment on the record.
                </>,
                <>
                  <strong>Calibration is mandatory</strong> before release, so ratings mean the same
                  thing across coaches.
                </>,
                <>
                  <strong>The framework itself is reviewed</strong> after every cycle. Feedback on
                  it is welcome and expected.
                </>,
              ]}
            />
          </Section>

          <Section id="faq" title="Questions people ask">
            <div className="grid gap-3">
              {FAQ.map(([question, answer]) => (
                <p key={question} className="text-sm leading-6">
                  <strong>{question}</strong>{" "}
                  <span className="text-muted-foreground">{answer}</span>
                </p>
              ))}
            </div>
          </Section>
        </div>

        <nav aria-label="On this page" className="sticky top-24 hidden lg:grid">
          <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            On this page
          </p>
          {SECTIONS.map(([id, title]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {title}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
