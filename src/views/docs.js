/* "How Ascend works" — the documentation, in the product. */
import { S } from "../state.js";
import { esc, fmtDate } from "../helpers.js";
import { SCALE, BANDS, CHECKIN_STAGES, FIXED_COMPETENCIES, COACH_FIXED_THIRD } from "../config.js";
import { LIB } from "../data/library.js";
import { cycle, me, isAdmin, isCoach } from "../domain.js";
import { scaleLegend } from "../ui.js";

/* ---------- 14. DOCUMENTATION ---------- */
export function viewDocs(){
  const c = cycle();
  const secs = [
    ["what","What this system is"],
    ["arch","The two scores and the scale"],
    ["roles","Who does what"],
    ["flow","The cycle, end to end"],
    ["s1","Step 1 · Goal setting"],
    ["s2","Step 2 · Monthly check-ins"],
    ["s3","Step 3 · The Impact Statement"],
    ["s4","Step 4 · Quarterly scoring"],
    ["s5","Step 5 · Calibration, release, acknowledgment"],
    ["s6","Step 6 · Half-yearly and annual scores"],
    ["screens","Every screen, and what it does"],
    ["records","Records, transcripts and downloads"],
    ["setup","Setting the system up"],
    ["gov","Fairness, privacy and governance"],
    ["faq","Questions people ask"]
  ];

  return `
  <div class="hero mb24">
    <div class="eyebrow" style="color:#8FC5C0">Documentation</div>
    <h1 class="mt8">How ${esc(S.product.name)} works</h1>
    <div class="sub">Everything the system does, in the order it happens: how goals are set, how conversations are recorded, how a score is built, and where every record can be downloaded from.</div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 200px; gap:32px; align-items:start">
    <div class="doc">

      <h2 id="what">What this system is</h2>
      <p>${esc(S.product.name)} runs one clear performance rhythm: <strong>goals set in advance</strong>, <strong>a coach who talks with you every month</strong>, and <strong>a fair score at each quarter end</strong>. It replaces scattered impressions with a written record everyone can see and trust.</p>
      <p>Three things follow from that design. Nobody is surprised at review time, because the goals were written and approved before the cycle started and feedback happened monthly. Decisions about growth get made on evidence, because every goal names the data source it will be judged from. And the record belongs to both sides — the team member writes their own account of their impact, and can add a verbatim comment to any score.</p>
      <div class="callout"><strong>Read the scale once, properly.</strong> On a five-point scale, <strong>3 is a good rating</strong>. It means you reliably delivered what was agreed — which is exactly what the organisation asks. A well-set charter usually averages 0.7–0.8 on goal attainment; a row of perfect 1.0s usually means the goals were set too safe.</div>

      <h2 id="arch">The two scores and the scale</h2>
      <p>Every person carries two scores each quarter, both on a 1–5 scale:</p>
      <div class="tbl-wrap mb16"><table>
        <thead><tr><th style="width:180px">Score</th><th style="width:80px">Weight</th><th>What it measures</th></tr></thead>
        <tbody>
          <tr><td><strong>Score 1 — OKR attainment</strong></td><td class="num">${c.weights.okr*100}%</td><td>What you delivered against the approved goals in your Goal Charter (maximum ${c.maxGoals}).</td></tr>
          <tr><td><strong>Score 2 — Competency</strong></td><td class="num">${c.weights.comp*100}%</td><td>How you delivered it — assessed orally by your coach at each quarterly scoring against your written competency commitments, as one rating out of 5.</td></tr>
        </tbody></table></div>
      ${scaleLegend()}
      <p class="mt16"><strong>Quarterly score = (Score 1 × ${c.weights.okr}) + (Score 2 × ${c.weights.comp}).</strong> Half-yearly = the plain average of the cycle's quarters. Annual = the plain average of the halves. Nothing else is weighted.</p>

      <h2 id="roles">Who does what</h2>
      <div class="tbl-wrap"><table>
        <thead><tr><th style="width:130px">Role</th><th>Responsibilities in the system</th></tr></thead>
        <tbody>
          <tr><td><span class="tag grey">Team member</span></td><td>Drafts the Goal Charter (goals, targets, data sources, competency commitments) · records what was actually achieved · writes the Impact Statement each quarter and shares it three days before the conversation · signs each check-in · acknowledges each score with an optional verbatim comment.</td></tr>
          <tr><td><span class="tag teal">Coach</span></td><td>Reviews each coachee's draft first — refining targets, checking measurability, confirming the competency commitments · holds and records a 15-minute check-in every month · verifies the Impact Statement against the data sources · scores each goal 0.0–1.0 and records Score 2 · writes the verified impact summary and the development needs · owns one development action per coachee per cycle · brings ratings to calibration.</td></tr>
          <tr><td><span class="tag amber">Administrator</span></td><td>Everything a coach does, plus: final approval of every charter · calibration and release of scores · people, coach allocation and cycle settings · download of every record and transcript.</td></tr>
        </tbody></table></div>
      <p class="mt16">A coach carries <strong>${esc(COACH_FIXED_THIRD)}</strong> as their third fixed competency instead of Collaboration — growing their coachees is measured, not assumed.</p>

      <h3 class="mt24">What each person can see</h3>
      <p>You sign in with your work email, and the roster decides what opens:</p>
      <div class="tbl-wrap"><table>
        <thead><tr><th style="width:130px">Signed in as</th><th>Sees</th><th style="width:220px">Can download</th></tr></thead>
        <tbody>
          <tr><td><span class="tag grey">Team member</span></td>
            <td>Their own charter, check-ins, Impact Statements and released scores. Nobody else's record is reachable — not by a link, not by a typed address.</td>
            <td>Their own forms, from the screen they sit on (Print / PDF).</td></tr>
          <tr><td><span class="tag teal">Coach</span></td>
            <td>Their own record, plus the full record of each person they coach: charters, every check-in, Impact Statements, scores and conversation transcripts. Another coach's coachees stay closed.</td>
            <td>Records &amp; downloads, scoped to themselves and their coachees — the CSV files and the team record book.</td></tr>
          <tr><td><span class="tag amber">Administrator</span></td>
            <td>Everyone. The programme dashboard, every person's record, the activity log.</td>
            <td>Everything: every CSV, the whole-programme record book, and the full JSON backup.</td></tr>
        </tbody></table></div>
      <div class="callout"><strong>Scores stay private.</strong> A released score is known to the person, their coach and ${esc(S.settings.approverLabel)} — and to ${esc(S.settings.hrLabel)}, who runs the programme. A coach sees their own coachees' numbers, never the rest of the company's.</div>

      <h2 id="flow">The cycle, end to end</h2>
      <div class="timeline mt16">
        <div class="ev done"><strong>Goal-setting window</strong> — ten days before the cycle. Team member drafts → coach reviews and signs → ${esc(S.settings.approverLabel)} approves. The approved sheet is the Goal Charter, locked for the cycle.</div>
        <div class="ev done"><strong>Every month</strong> — a 15-minute check-in. No ratings, no status labels. Summary and way forward recorded and signed by both.</div>
        <div class="ev done"><strong>Three days before each quarter end</strong> — the team member shares their Impact Statement.</div>
        <div class="ev done"><strong>At each quarter end</strong> — a 30-minute scoring conversation: each goal scored 0.0–1.0 from its data source, competencies discussed orally, Score 1 and Score 2 recorded.</div>
        <div class="ev done"><strong>Quarter end + one week</strong> — calibration across all coaches, then sign-off and release.</div>
        <div class="ev done"><strong>At the half-year</strong> — the full 60-minute review and feedback session. Half-yearly score = the average of the two quarters.</div>
        <div class="ev"><strong>At the year end</strong> — final annual score = the average of the halves; it informs growth and reward decisions.</div>
      </div>

      <h2 id="s1">Step 1 · Goal setting</h2>
      <p>Goal setting happens once before each six-month cycle, on <em>My Goal Charter</em>.</p>
      <ol>
        <li><strong>The team member drafts.</strong> Up to ${c.maxGoals} goals. Each one can be picked from the library — ${LIB.okrs.length} example key results across the units — or written from scratch. Every goal needs a measurable key result, a baseline, a target, and a named data source. The system will not let a charter be sent without them.</li>
        <li><strong>Competencies are chosen.</strong> Three are fixed for everyone: Communication, Discipline &amp; Documentation, and Collaboration (or ${esc(COACH_FIXED_THIRD)} for coaches). Two more are chosen with the coach from the library of ${LIB.competencies.length}. Each of the five carries a one-line commitment — what the person will actually <em>do</em> under it. That commitment is what the quarterly discussion is judged against, so "Communication" becomes "weekly written project update to all stakeholders".</li>
        <li><strong>The coach reviews first.</strong> On <em>Charter Reviews</em>, the coach either signs the review — sharpening targets and confirming measurability — or returns it with a written note saying what must change.</li>
        <li><strong>${esc(S.settings.approverLabel)} approves.</strong> The last signature. On approval the charter is locked for the cycle and becomes the single reference for what success means.</li>
      </ol>
      <div class="callout">The library is a menu, not a binding list. Adapt the wording to real work, and replace the illustrative numbers with your own baseline and target.</div>

      <h2 id="s2">Step 2 · Monthly check-ins</h2>
      <p>Fifteen minutes, once a month, on the four-stage framework — an adaptation of the GROW model — so quality is consistent across every coach:</p>
      <div class="tbl-wrap mb16"><table><thead><tr><th style="width:120px">Stage</th><th style="width:70px">Time</th><th>What the coach does</th></tr></thead>
        <tbody>${CHECKIN_STAGES.map(s=>`<tr><td><strong>${esc(s.t)}</strong></td><td class="num">${s.min} min</td><td>${esc(s.q)}</td></tr>`).join("")}</tbody></table></div>
      <p>The coach opens <em>Record a check-in</em> from the coachee's page, fills the four stages in the room, and signs. The team member then signs their own record. No ratings are given here — a check-in is a conversation, not an evaluation. Either side can add to the conversation record underneath, and everything added is downloadable by the administrator.</p>
      <p><strong>Ground rules:</strong> listen roughly 70/30 in the coachee's favour · ask before offering solutions · make feedback specific and behavioural ("the client deck went out with two data errors", not "be more careful") · name the specific thing done well rather than a general "good job" · protect the slot, because a skipped check-in tells someone their development is optional.</p>

      <h2 id="s3">Step 3 · The Impact Statement</h2>
      <p>This is the only part the team member writes at review time, and it is the most important one. On <em>Impact Statement</em> they write two things for the quarter: the impact created against their goals, with real numbers, and how they lived each of their five competency commitments. It is shared three days before the scoring conversation, and becomes read-only once shared, so the record cannot move after the fact.</p>
      <p>The coach reads it before scoring and verifies each claim against the Goal Charter, the check-in records, and the named data sources.</p>

      <h2 id="s4">Step 4 · Quarterly scoring</h2>
      <p>On <em>Quarterly Scoring</em> the coach opens each coachee for the quarter and works down one screen:</p>
      <ol>
        <li><strong>Read Part 1</strong> — the Impact Statement, alongside what the person recorded as their actuals.</li>
        <li><strong>Score each goal 0.0–1.0</strong> against its target, using the named data source. Delivered fully = 1.0; delivered 80% of the target ≈ 0.8.</li>
        <li>The system averages those and converts the average to <strong>Score 1</strong> on fixed bands: ${BANDS.map(b=>`${b.label} → ${b.score}`).join(" · ")}.</li>
        <li><strong>Discuss the five competencies orally</strong> against the written commitments and the library's level descriptions — what a 5, a 3 and a 1 look like — then record one overall rating as <strong>Score 2</strong>.</li>
        <li>Write the two sections of Part 2: <strong>the impact this person created</strong> (the coach's verified summary) and <strong>the development needs</strong>, with the training, exposure or support that will be provided.</li>
        <li>Choose a recommendation and sign. The quarterly score is computed, not typed.</li>
      </ol>
      <p><strong>Rating traps to avoid:</strong> recency bias (rating the last month instead of the quarter — re-read the check-ins first), central tendency (defaulting everyone to 3 to avoid conversations), and halo/horns (letting one win or one visible miss colour every judgment).</p>

      <h2 id="s5">Step 5 · Calibration, release, acknowledgment</h2>
      <p>A signed score is not yet a released score. All coaches and ${esc(S.settings.approverLabel)} align the quarter's ratings first, so that a 4 means the same thing everywhere and outliers get challenged. The administrator then signs off and releases, which is the moment the team member can see the score on <em>My Scores</em>.</p>
      <p>The team member acknowledges it and may add a comment, recorded verbatim on the form. Both the comment and the whole conversation record go into the downloadable file.</p>

      <h2 id="s6">Step 6 · Half-yearly and annual scores</h2>
      <p>No new arithmetic. The half-yearly score is the plain average of the cycle's two quarterly scores. The annual score is the plain average of the two half-yearly scores. The full 60-minute review and feedback conversation happens at the half-year — the quarters are scoring checkpoints.</p>
      <div class="callout"><strong>Worked example.</strong> Four goals score 0.95, 0.80, 0.65 and 0.75 → average 0.79 → that falls in the 0.65–0.79 band → Score 1 = 3. The competency discussion lands at strong-but-not-exceptional → Score 2 = 4. Quarterly = (3 × 0.6) + (4 × 0.4) = 3.4. If the four quarters of a year come in at 3.4, 3.6, 3.7 and 3.9, then H1 = 3.5, H2 = 3.8, and the annual score is 3.65.</div>

      <h2 id="screens">Every screen, and what it does</h2>
      <div class="tbl-wrap"><table><thead><tr><th style="width:200px">Screen</th><th>What happens there</th></tr></thead><tbody>
        <tr><td><strong>Overview</strong></td><td>What needs you next, your charter at a glance, and where you are in the cycle.</td></tr>
        <tr><td><strong>My Goal Charter</strong></td><td>Draft and send the charter; after approval, record what you actually achieved against each goal, each quarter. Printable.</td></tr>
        <tr><td><strong>My Check-ins</strong></td><td>Every monthly record, with the summary and way forward, and your signature.</td></tr>
        <tr><td><strong>Impact Statement</strong></td><td>Write and share your own account of your impact, one per quarter.</td></tr>
        <tr><td><strong>My Scores</strong></td><td>Released scores with the working shown, the development needs, your acknowledgment and your verbatim comment.</td></tr>
        <tr><td><strong>My Coachees</strong></td><td>The coach's list: charter status, check-in count, scores, and a way into each person's record.</td></tr>
        <tr><td><strong>Charter Reviews</strong></td><td>Sign or return drafts. Administrators also approve here.</td></tr>
        <tr><td><strong>Quarterly Scoring</strong></td><td>One row per coachee per quarter, and the scoring screen itself.</td></tr>
        <tr><td><strong>Programme Dashboard</strong></td><td>Completion, score distribution, coach load — the administrator's view of whether the rhythm is actually being kept.</td></tr>
        <tr><td><strong>People &amp; Coaches</strong></td><td>Add people, set units and titles, allocate coaches.</td></tr>
        <tr><td><strong>Cycles &amp; Settings</strong></td><td>Cycle dates, goal window, number of check-ins, maximum goals, the two weights, quarter labels and deadlines, and naming.</td></tr>
        <tr><td><strong>Records &amp; Downloads</strong></td><td>Every export, per record type or per person, plus the activity log.</td></tr>
        <tr><td><strong>Goal &amp; Competency Library</strong></td><td>${LIB.okrs.length} example key results and ${LIB.competencies.length} competencies with level descriptions, browsable by unit.</td></tr>
      </tbody></table></div>

      <h2 id="records">Records, transcripts and downloads</h2>
      <p>Every screen writes to a record, and every record can leave the system. Under <em>Records &amp; Downloads</em>:</p>
      <ul>
        <li><strong>Goal charters (CSV)</strong> — one row per goal with objective, key result, baseline, target, data source, actuals and each quarter's score; competency commitments follow as their own rows.</li>
        <li><strong>Monthly check-ins (CSV)</strong> — all four stages, both signatures, and the way forward agreed.</li>
        <li><strong>Impact statements (CSV)</strong> — exactly as written by the team member, with the date shared.</li>
        <li><strong>Quarterly scores (CSV)</strong> — goal-score average, Score 1, Score 2, the quarterly score, the coach's impact summary, development needs, recommendation, all three sign-offs and the member's verbatim comment.</li>
        <li><strong>Conversation transcript (CSV)</strong> — every entry either side added to any record, with author, role and timestamp.</li>
        <li><strong>Record book (HTML)</strong> — the whole programme, or one person's complete file, formatted to read and to print or save as PDF. This is the document to hand over in a promotion discussion, an audit, or an exit.</li>
        <li><strong>Full backup (JSON)</strong> — everything, restorable into another browser.</li>
      </ul>
      <p>Individual forms — charter, check-in, impact statement, review — also print to PDF from their own screens.</p>

      <h2 id="setup">Setting the system up</h2>
      <ol>
        <li><strong>Add your people</strong> under People &amp; Coaches: name, unit, title, and the one named coach each person reports to for development. Coaches themselves get a coach too.</li>
        <li><strong>Set the cycle</strong> under Cycles &amp; Settings: start and end, the goal-setting window, how many check-ins, the maximum number of goals, and which quarter carries the full review.</li>
        <li><strong>Check the weights.</strong> They default to ${c.weights.okr}/${c.weights.comp}. If you change them, keep them adding to 1.00 — the system will warn you if they do not.</li>
        <li><strong>Rename the roles</strong> if your organisation calls them something else. "${esc(S.settings.approverLabel)}" and "${esc(S.settings.hrLabel)}" appear throughout the interface and in every export.</li>
        <li><strong>Open the goal window</strong> and tell people to draft. Charters cannot be scored until they are approved.</li>
      </ol>
      <div class="callout"><strong>Where the data lives.</strong> This build stores everything in the browser it runs in — no server, nothing leaves the machine. Sign-in matches your email against the roster and applies your role; it identifies you rather than authenticating you, so treat it as it is meant: a working system for a real cycle, not a vault. That also makes backups your responsibility — take a JSON backup after each scoring round, and before clearing site data.</div>

      <h2 id="gov">Fairness, privacy and governance</h2>
      <ul>
        <li><strong>The system is public; the scores are private.</strong> A score is known to the person, their coach, and the approver.</li>
        <li><strong>Review order is fixed</strong> — coach first, then approver, for charters and for scores. Nothing changes silently after a conversation.</li>
        <li><strong>Goals must be measurable with a named data source</strong>, and every review is verified against those sources. Evidence over impression.</li>
        <li><strong>Everyone sees their review in writing</strong> and acknowledges it themselves, with space for their own comment on the record.</li>
        <li><strong>Calibration is mandatory</strong> before release, so ratings mean the same thing across coaches.</li>
        <li><strong>The framework itself is reviewed</strong> after every cycle. Feedback on it is welcome and expected.</li>
      </ul>

      <h2 id="faq">Questions people ask</h2>
      <p><strong>Is 3 a bad score?</strong> No. It means you delivered what was agreed, reliably. Most people should land there most of the time.</p>
      <p><strong>What if my goals change mid-cycle?</strong> The charter is locked so the target cannot move under you. If the work genuinely changes, raise it at a check-in — the change is recorded there, and the coach accounts for it when scoring against the data source.</p>
      <p><strong>What if I disagree with my score?</strong> Say so in the conversation, and put it in writing in your acknowledgment comment. It is recorded verbatim and travels with the record.</p>
      <p><strong>Can my coach change a score after we talked?</strong> Only before signing. After signing it goes to calibration, and after release it is fixed with all three signatures and timestamps attached.</p>
      <p><strong>What happens if a check-in is missed?</strong> It shows as missing on the dashboard and in the coach's completion count. Check-in completion is part of how coaching itself is assessed.</p>
      <p><strong>Do interns follow the same system?</strong> Yes, usually with two or three goals instead of five, and the intern-conversion recommendation on the review form.</p>
    </div>

    <div class="docnav">
      <div class="eyebrow mb8">On this page</div>
      ${secs.map(([id,t])=>`<a href="#${id}">${esc(t)}</a>`).join("")}
    </div>
  </div>`;
}

