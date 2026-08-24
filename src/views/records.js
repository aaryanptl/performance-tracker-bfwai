/* ---------- Records & downloads, and the on-screen record transcript ---------- */
import { S, UI } from "../core/state.js";
import { esc, nl2, initials, fmtDate, fmtDT, download } from "../core/helpers.js";
import { me, user, cycle, charterOf, reviewOf, impactOf, checkinsOf, quarterly,
         halfYearScore, charterStatusTag } from "../core/domain.js";
import { CHECKIN_STAGES } from "../data/constants.js";
import { transcriptLines, personRecord } from "../core/records.js";
import { personLine, threadHTML, scopeBar } from "../ui/fragments.js";
import { visibleUsers, canDownloadAll, scopeRecords, deniedPanel, scopeLabel } from "../core/access.js";
import { go } from "../ui/shell.js";

/* ---------- RECORDS & DOWNLOADS ---------- */
export function viewExports(){
  const c = cycle();
  const all = canDownloadAll();
  const people = visibleUsers();

  /* Counts describe the caller's scope, not the organisation, so the
     numbers on this page always match what the buttons will produce. */
  const inCycle = list => scopeRecords(list).filter(x => x.cycleId === c.id).length;
  const counts = {
    charters: inCycle(S.charters),
    checkins: inCycle(S.checkins),
    impacts:  inCycle(S.impacts),
    lines:    transcriptLines(null, c.id).length
  };

  const csvRows = [
    ["csvCharters","Goal charters","One row per goal: objective, key result, baseline, target, data source, actuals and each quarter's score."],
    ["csvCheckins","Monthly check-ins","One row per check-in: all four stages, signatures, and the way forward agreed."],
    ["csvImpacts","Impact statements","One row per person per quarter, exactly as written by the team member."],
    ["csvReviews","Quarterly scores","Score 1, Score 2, the quarterly score, impact summary, development needs, recommendation and sign-offs."],
    ["csvScores","Score summary","One row per person: every quarter's scores, the half-yearly score and the standing recommendation."],
    ["csvTranscript","Conversation transcript","Every entry added by a coach or a team member, with author, role and timestamp."],
    ["csvPeople","People and coaching map","One row per person: position, unit, level, employment type, team leader and coach."]
  ];

  return `
  <div class="mb16"><h1>Records &amp; downloads</h1>
    <div class="small muted">Everything written in ${esc(S.product.name)} is downloadable: the charters, every monthly check-in, every Impact Statement, every scoring conversation, and the full transcript of what the coach and the team member each put on the record.</div></div>

  ${scopeBar()}

  <div class="grid g4 mb24">
    <div class="kpi"><div class="v">${people.length}</div><div class="l">People in your scope</div></div>
    <div class="kpi"><div class="v">${counts.charters}</div><div class="l">Goal charters</div></div>
    <div class="kpi"><div class="v">${counts.checkins}</div><div class="l">Monthly check-ins</div></div>
    <div class="kpi"><div class="v">${counts.lines}</div><div class="l">Transcript entries</div></div>
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="card-head">
        <h2>${all ? "Whole-programme downloads" : "My team's downloads"}</h2>
        <span class="tag teal">${esc(c.name)}</span>
      </div>
      <div class="small muted mb16">
        Spreadsheet-ready CSV, one row per record. ${all
          ? "Every person in the organisation is included."
          : "Only you and the people you coach are included — no other coach's team appears in these files."}
      </div>
      <div class="stack">
        ${csvRows.map(([act,label,d])=>`<div class="spread" style="border-top:1px solid var(--line-2);padding-top:11px">
          <div><div style="font-weight:600" class="small">${esc(label)}</div><div class="tiny muted">${esc(d)}</div></div>
          <button class="btn sm" data-act="${act}">CSV</button></div>`).join("")}
      </div>
      <div class="row wrap mt16">
        ${all
          ? `<button class="btn dark" data-act="fullBook">Download the full record book (HTML)</button>
             <button class="btn" data-act="exportJSON">Full backup (JSON)</button>`
          : `<button class="btn dark" data-act="teamBook">Download my team's record book (HTML)</button>`}
      </div>
      ${all ? "" : `<div class="tiny muted mt12">The organisation-wide record book, the JSON backup and the activity log cover everyone, so they are available to ${esc(S.settings.hrLabel)} only.</div>`}
    </div>

    <div class="card">
      <div class="card-head"><h2>One person's complete record</h2><span class="tag grey">${people.length}</span></div>
      <div class="small muted mb16">The whole file for one person across the cycle — charter, every check-in, every Impact Statement, every score and the full conversation transcript. Open the record to read it on screen, or download it to keep or to send.</div>
      <div class="tbl-wrap"><table id="person-record-list">
        <thead><tr><th>Person</th><th>Coach</th><th>Entries</th><th></th></tr></thead>
        <tbody>${people.map(u=>`<tr>
          <td>${personLine(u)}</td><td class="small">${esc(u.coachId?user(u.coachId).name:"—")}</td>
          <td class="num">${transcriptLines(u.id,c.id).length}</td>
          <td class="right"><div class="row" style="justify-content:flex-end">
            <button class="btn sm" data-act="go" data-route="transcript" data-id="${u.id}">Read</button>
            <button class="btn sm" data-act="personBook" data-id="${u.id}">Download</button></div></td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
  </div>

  ${all ? `<div class="card">
    <div class="card-head"><h2>Activity log</h2><span class="tag grey">${S.audit.length} events</span></div>
    ${S.audit.length?`<div class="tbl-wrap"><table><thead><tr><th style="width:170px">When</th><th style="width:140px">Who</th><th>What</th></tr></thead>
      <tbody>${S.audit.slice(0,40).map(a=>`<tr><td class="small muted">${fmtDT(a.ts)}</td><td class="small">${esc(user(a.userId).name)}</td>
        <td class="small"><strong>${esc(a.action)}</strong> — ${esc(a.detail)}</td></tr>`).join("")}</tbody></table></div>
      <div class="right mt12"><button class="btn sm" data-act="csvAudit">Download the log</button></div>`
    :`<div class="empty small">No activity recorded yet.</div>`}
  </div>` : ""}`;
}

export function viewTranscript(){
  const r = personRecord(UI.params.id);
  if (!r) return deniedPanel("That person's record");
  const u = r.person, c = r.cycle;
  return `
  <div class="spread mb24">
    <div class="row"><div class="avatar" style="width:44px;height:44px;font-size:15px;background:var(--teal-light);color:var(--teal-dark)">${esc(initials(u.name))}</div>
      <div><h1>${esc(u.name)} — complete record</h1>
        <div class="small muted">${esc(c.name)} · ${esc(u.unit)} · coached by ${esc(r.coach.name)}</div></div></div>
    <div class="row">
      <button class="btn" data-act="personBook" data-id="${u.id}">Download (HTML)</button>
      <button class="btn" data-act="personCSV" data-id="${u.id}">Download transcript (CSV)</button>
      <button class="btn sm" data-act="go" data-route="exports">Back</button>
    </div>
  </div>

  <div class="grid g4 mb24">
    <div class="kpi"><div class="v">${r.charter?r.charter.goals.length:0}</div><div class="l">Goals</div></div>
    <div class="kpi"><div class="v">${r.checkins.length}</div><div class="l">Check-ins</div></div>
    <div class="kpi"><div class="v">${r.reviews.filter(x=>x.released).length}</div><div class="l">Scores released</div></div>
    <div class="kpi"><div class="v">${r.half!=null?r.half.toFixed(2):"—"}</div><div class="l">Half-yearly score</div></div>
  </div>

  ${r.charter?`<div class="card mb24"><div class="card-head"><h2>Goal Charter</h2>${charterStatusTag(r.charter)}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Key result</th><th>Baseline</th><th>Target</th><th>Data source</th>
      ${c.quarters.map(q=>`<th>${esc(q.id)} actuals</th><th>${esc(q.id)}</th>`).join("")}</tr></thead>
      <tbody>${r.charter.goals.map(g=>`<tr><td>${esc(g.kr)}</td><td class="num">${esc(g.baseline||"—")}</td><td class="num">${esc(g.target||"—")}</td>
        <td class="small muted">${esc(g.source||"—")}</td>
        ${c.quarters.map(q=>`<td class="small">${esc((g.actuals&&g.actuals[q.id])||"—")}</td><td class="num">${g.scores&&g.scores[q.id]!=null?g.scores[q.id].toFixed(2):"—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="mt16">${r.charter.competencies.map(cp=>`<div class="small" style="padding:6px 0;border-top:1px solid var(--line-2)"><strong>${esc(cp.name)}</strong> — ${esc(cp.commitment||"—")}</div>`).join("")}</div>
  </div>`:""}

  ${r.checkins.map(ci=>`<div class="card mb16">
    <div class="card-head"><h3>Check-in ${ci.no} · ${fmtDate(ci.date)}</h3>
      <span class="tag ${ci.memberAckAt?"green":"amber"}">${ci.memberAckAt?"Both signed":"Awaiting signature"}</span></div>
    <div class="grid g2">${CHECKIN_STAGES.map(s=>`<div><div class="eyebrow">${esc(s.t)}</div><div class="small mt8">${nl2(ci[s.k]||"—")}</div></div>`).join("")}</div>
    ${(ci.transcript||[]).length?`<div class="mt16" style="border-top:1px solid var(--line-2);padding-top:12px">${threadHTML(ci,false)}</div>`:""}
  </div>`).join("")}

  ${r.impacts.map(im=>`<div class="card mb16">
    <div class="card-head"><h3>Impact Statement · ${esc(im.period)}</h3><span class="tag ${im.submittedAt?"green":"grey"}">${im.submittedAt?`Shared ${fmtDate(im.submittedAt)}`:"Draft"}</span></div>
    <div class="eyebrow">Results against goals</div><div class="small mt8">${nl2(im.results||"—")}</div>
    <div class="eyebrow mt16">Competency commitments lived</div><div class="small mt8">${nl2(im.behaviours||"—")}</div>
    ${(im.transcript||[]).length?`<div class="mt16" style="border-top:1px solid var(--line-2);padding-top:12px">${threadHTML(im,false)}</div>`:""}
  </div>`).join("")}

  ${r.reviews.map(rv=>`<div class="card mb16">
    <div class="card-head"><h3>Quarterly scoring · ${esc(rv.period)}</h3>
      <span class="tag ${rv.released?"green":"amber"} num">${rv.quarterly!=null?rv.quarterly.toFixed(2):"draft"}</span></div>
    <div class="grid g2">
      <div><div class="eyebrow">Impact — coach's verified summary</div><div class="small mt8">${nl2(rv.impactSummary||"—")}</div></div>
      <div><div class="eyebrow">Development needs and support</div><div class="small mt8">${nl2(rv.developmentNeeds||"—")}</div></div>
    </div>
    <div class="row wrap mt16"><span class="tag ink">${esc(rv.recommendation||"no recommendation")}</span>
      <span class="tiny muted">Score 1 ${rv.score1==null?"—":rv.score1} · Score 2 ${rv.score2==null?"—":rv.score2}</span>
      <span class="tiny muted">Coach ${fmtDT(rv.coachSignedAt)} · ${esc(S.settings.approverLabel)} ${fmtDT(rv.approverSignedAt)} · acknowledged ${fmtDT(rv.memberAckAt)}</span></div>
    ${rv.memberComment?`<div class="card flat mt16" style="background:var(--surface)"><div class="eyebrow">Team member comment, verbatim</div><div class="small mt8">${nl2(rv.memberComment)}</div></div>`:""}
    ${(rv.transcript||[]).length?`<div class="mt16" style="border-top:1px solid var(--line-2);padding-top:12px">${threadHTML(rv,false)}</div>`:""}
  </div>`).join("")}`;
}
