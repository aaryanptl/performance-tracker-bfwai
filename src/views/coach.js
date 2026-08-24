/* ---------- Coach views: coachees, charter reviews, check-in form, scoring ---------- */
import { S, UI } from "../core/state.js";
import { esc, nl2, uid, initials, fmtDate, fmtDT, download } from "../core/helpers.js";
import { me, user, cycle, isAdmin, coacheesOf, charterOf, reviewOf, impactOf, checkinsOf,
         bandFor, goalAverage, quarterly, halfYearScore, charterStatusTag,
         competencyMeta } from "../core/domain.js";
import { BANDS, SCALE, CHECKIN_STAGES, RECOMMENDATIONS } from "../data/constants.js";
import { spine, blendBar, personLine, threadHTML, scopeBar } from "../ui/fragments.js";
import { canView, deniedPanel, visibleOthers } from "../core/access.js";
import { go } from "../ui/shell.js";

export function viewCoachees(){
  const c = cycle(), list = coacheesOf(S.session.userId);
  if (!list.length) return `<div class="empty"><h3>No coachees allocated to you</h3><div class="small">Allocations are maintained by ${esc(S.settings.hrLabel)} under People & Coaches.</div></div>`;

  return `
  <div class="spread mb16">
    <div><h1>My coachees</h1><div class="small muted">You are a development partner, not a task supervisor. One 15-minute check-in each month, scoring at each quarter end, and one development action per person per cycle.</div></div>
    <span class="tag teal">${list.length} ${list.length===1?"person":"people"}</span>
  </div>

  ${scopeBar()}

  <div class="tbl-wrap mb24"><table>
    <thead><tr><th>Person</th><th>Charter</th><th>Check-ins</th>${c.quarters.map(q=>`<th>${esc(q.id)}</th>`).join("")}<th>Impact statement</th><th></th></tr></thead>
    <tbody>${list.map(u=>{
      const ch = charterOf(u.id), done = checkinsOf(u.id).length;
      return `<tr>
        <td>${personLine(u)}</td>
        <td>${charterStatusTag(ch)}</td>
        <td class="num">${done}/${c.checkins}</td>
        ${c.quarters.map(q=>{ const r = reviewOf(u.id,q.id);
          return `<td class="num">${r? (r.released? r.quarterly.toFixed(2) : `<span class="tag amber">draft</span>`) : "—"}</td>`;}).join("")}
        <td>${c.quarters.map(q=>{const im=impactOf(u.id,q.id); return `<span class="tag ${im&&im.submittedAt?"green":"grey"}" style="margin-right:4px">${esc(q.id)}</span>`;}).join("")}</td>
        <td class="right"><button class="btn sm" data-act="go" data-route="coachee" data-id="${u.id}">Open</button></td>
      </tr>`;}).join("")}</tbody>
  </table></div>

  <div class="grid g2">
    <div class="card"><div class="eyebrow">The 15-minute framework</div>
      <table class="mt8"><tbody>${CHECKIN_STAGES.map((s,i)=>`<tr><td style="width:30px" class="num muted">${i+1}</td>
        <td style="width:100px;font-weight:600">${esc(s.t)}</td><td class="num muted" style="width:52px">${s.min} min</td>
        <td class="small muted">${esc(s.q)}</td></tr>`).join("")}</tbody></table>
      <div class="small muted mt12">Listen roughly 70/30 in their favour. Ask before offering solutions. Complete the form in the room — it takes two minutes.</div>
    </div>
    <div class="card"><div class="eyebrow">Common rating traps</div>
      <div class="stack mt8">
        <div><strong class="small">Recency bias</strong><div class="small muted">Rating the last month instead of the quarter. Re-read the quarter's check-in records before scoring.</div></div>
        <div><strong class="small">Central tendency</strong><div class="small muted">Defaulting everyone to 3 to avoid conversations. If someone exceeded, say 4 and defend it; if they fell short, say 2 and coach it.</div></div>
        <div><strong class="small">Halo and horns</strong><div class="small muted">Letting one win or one visible miss colour everything. Score goals on their numbers; discuss competencies on their own evidence.</div></div>
      </div>
    </div>
  </div>`;
}

export function viewCoachee(){
  if (!canView(UI.params.id)) return deniedPanel("That person's record");
  const u = user(UI.params.id), c = cycle(), ch = charterOf(u.id);
  const cis = checkinsOf(u.id);
  return `
  <div class="spread mb24">
    <div class="row">
      <div class="avatar" style="width:44px;height:44px;font-size:15px;background:var(--teal-light);color:var(--teal-dark)">${esc(initials(u.name))}</div>
      <div><h1>${esc(u.name)}</h1><div class="small muted">${esc(u.title)} · ${esc(u.unit)} · coached by ${esc(user(u.coachId).name)}</div></div>
    </div>
    <div class="row">
      <button class="btn" data-act="newCheckin" data-id="${u.id}">Record a check-in</button>
      <button class="btn primary" data-act="go" data-route="scoring">Quarterly scoring</button>
    </div>
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="card-head"><h2>Goal Charter</h2>${charterStatusTag(ch)}</div>
      ${ch? `<div class="tbl-wrap"><table><thead><tr><th>Key result</th><th>Target</th><th>Data source</th>${c.quarters.map(q=>`<th>${esc(q.id)}</th>`).join("")}</tr></thead>
        <tbody>${ch.goals.map(g=>`<tr><td>${esc(g.kr)}</td><td class="num">${esc(g.target||"—")}</td><td class="small muted">${esc(g.source||"—")}</td>
        ${c.quarters.map(q=>`<td class="num">${g.scores&&g.scores[q.id]!=null?g.scores[q.id].toFixed(2):"—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="mt16"><div class="eyebrow mb8">Competency commitments</div>
        ${ch.competencies.map(cp=>`<div class="small" style="padding:6px 0;border-top:1px solid var(--line-2)"><strong>${esc(cp.name)}</strong> — ${esc(cp.commitment||"no commitment written")}</div>`).join("")}</div>`
      : `<div class="empty small">No charter drafted yet.</div>`}
    </div>

    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>Check-ins</h2><span class="tag ${cis.length>=c.checkins?"green":"amber"}">${cis.length} of ${c.checkins}</span></div>
        ${cis.length? `<div class="stack">${cis.map(ci=>`<div class="spread" style="border-top:1px solid var(--line-2);padding-top:9px">
          <div><div style="font-weight:600" class="small">Check-in ${ci.no} · ${fmtDate(ci.date)}</div>
          <div class="tiny muted">${esc((ci.forward||"").slice(0,70))}${(ci.forward||"").length>70?"…":""}</div></div>
          <button class="btn sm" data-act="go" data-route="checkin" data-id="${ci.id}">Open</button></div>`).join("")}</div>`
        : `<div class="empty small">No check-ins recorded. A skipped check-in tells the coachee their development is optional.</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h2>Impact statements & scores</h2></div>
        ${c.quarters.map(q=>{ const im = impactOf(u.id,q.id), r = reviewOf(u.id,q.id);
          return `<div class="spread" style="border-top:1px solid var(--line-2);padding-top:9px">
            <div><div class="small" style="font-weight:600">${esc(q.label)}</div>
              <div class="tiny muted">${im&&im.submittedAt?`Impact statement shared ${fmtDate(im.submittedAt)}`:"Impact statement not shared yet"}</div></div>
            <div class="row">${r?(r.released?`<span class="tag green num">${r.quarterly.toFixed(2)}</span>`:`<span class="tag amber">In progress</span>`):`<span class="tag grey">Not scored</span>`}
            <button class="btn sm" data-act="openReview" data-uid="${u.id}" data-q="${q.id}">${r?"Open":"Start scoring"}</button></div>
          </div>`;}).join("")}
      </div>
    </div>
  </div>`;
}

/* ---------- CHARTER REVIEWS ---------- */
export function viewApprovals(){
  const mine = S.charters.filter(c=>c.status==="coach_review" && coacheesOf(S.session.userId).some(u=>u.id===c.userId));
  const forApproval = isAdmin() ? S.charters.filter(c=>c.status==="approval") : [];
  const done = S.charters.filter(c=>c.status==="approved" && (isAdmin() || coacheesOf(S.session.userId).some(u=>u.id===c.userId)));

  const card = (ch, mode)=>{
    const u = user(ch.userId);
    return `<div class="card mb16">
      <div class="card-head">
        <div>${personLine(u)}</div>
        <div class="row">${charterStatusTag(ch)}<span class="tiny muted">${ch.goals.length} goals · ${ch.competencies.length} competencies</span></div>
      </div>
      <div class="tbl-wrap mb16"><table>
        <thead><tr><th style="width:34%">Key result</th><th>Baseline</th><th>Target</th><th>Data source</th></tr></thead>
        <tbody>${ch.goals.map(g=>`<tr><td>${esc(g.kr)}<div class="tiny muted">${esc(g.objective)}</div></td>
          <td class="num">${esc(g.baseline||"—")}</td><td class="num">${esc(g.target||"—")}</td>
          <td class="small ${g.source?"":"muted"}">${esc(g.source||"missing — ask for one")}</td></tr>`).join("")}</tbody></table></div>
      <div class="mb16">${ch.competencies.map(cp=>`<div class="small" style="padding:6px 0;border-top:1px solid var(--line-2)">
        <span class="tag ${cp.fixed?"teal":"grey"}">${cp.fixed?"fixed":"chosen"}</span>
        <strong style="margin-left:6px">${esc(cp.name)}</strong> — ${cp.commitment?esc(cp.commitment):`<span class="muted">no commitment written</span>`}</div>`).join("")}</div>
      ${mode==="approval"?`<div class="card flat" style="background:var(--surface)">
        <div class="eyebrow">Coach review</div><p class="small mt8">${nl2(ch.coachNote||"—")}</p>
        <div class="tiny muted">${esc(user(ch.coachId).name)} · ${fmtDT(ch.coachSignedAt)}</div></div>`:""}
      <label class="f mt16"><span class="lb">${mode==="approval"?`${esc(S.settings.approverLabel)} note`:"Your review note"}</span>
        <textarea data-bind="note_${ch.id}" placeholder="${mode==="approval"?"Anything to record with the approval — ambition level, a target to watch.":"What you refined, what you confirmed, or what needs changing before this can move on."}"></textarea></label>
      <div class="row">
        ${mode==="coach"?`<button class="btn primary" data-act="coachApprove" data-id="${ch.id}">Sign review and send for approval</button>
          <button class="btn danger" data-act="returnCharter" data-id="${ch.id}">Return for edits</button>`:""}
        ${mode==="approval"?`<button class="btn primary" data-act="finalApprove" data-id="${ch.id}">Approve and lock for the cycle</button>
          <button class="btn danger" data-act="returnCharter" data-id="${ch.id}">Return for edits</button>`:""}
      </div>
    </div>`;
  };

  return `
  <div class="mb16"><h1>Charter reviews</h1>
    <div class="small muted">Review order is fixed: coach first, then ${esc(S.settings.approverLabel)}. Nothing changes silently after a conversation.</div></div>

  <h2 class="mb8">Waiting for your review${mine.length?` · ${mine.length}`:""}</h2>
  ${mine.length ? mine.map(ch=>card(ch,"coach")).join("") : `<div class="empty mb24 small">Nothing waiting on you. Charters appear here when a coachee sends theirs.</div>`}

  ${isAdmin()?`<h2 class="mb8 mt32">Waiting for final approval${forApproval.length?` · ${forApproval.length}`:""}</h2>
  ${forApproval.length ? forApproval.map(ch=>card(ch,"approval")).join("") : `<div class="empty mb24 small">No charters are waiting for approval.</div>`}`:""}

  <h2 class="mb8 mt32">Approved this cycle · ${done.length}</h2>
  ${done.length?`<div class="tbl-wrap"><table><thead><tr><th>Person</th><th>Goals</th><th>Coach</th><th>Approved</th><th></th></tr></thead>
    <tbody>${done.map(ch=>`<tr><td>${esc(user(ch.userId).name)}</td><td class="num">${ch.goals.length}</td>
      <td>${esc(user(ch.coachId).name)}</td><td class="small muted">${fmtDate(ch.approvedAt)}</td>
      <td class="right"><button class="btn sm" data-act="go" data-route="coachee" data-id="${ch.userId}">Open</button></td></tr>`).join("")}</tbody></table></div>`
  :`<div class="empty small">Nothing approved yet.</div>`}`;
}

/* ---------- MONTHLY CHECK-IN FORM ---------- */
export function viewCheckinForm(){
  const ci = S.checkins.find(x=>x.id===UI.params.id);
  if (ci && !canView(ci.userId)) return deniedPanel("That check-in");
  if (!ci) return `<div class="empty"><h3>That check-in record is not available</h3></div>`;
  const u = user(ci.userId), isMine = ci.userId===S.session.userId;
  const canEdit = ci.coachId===S.session.userId && !ci.coachSignedAt;
  const ch = charterOf(ci.userId, ci.cycleId);

  return `
  <div class="spread mb16">
    <div><div class="eyebrow">Check-in ${ci.no} · ${esc(cycle(ci.cycleId).name)}</div>
      <h1 class="mt8">${esc(u.name)} with ${esc(user(ci.coachId).name)}</h1>
      <div class="small muted">15 minutes · no ratings are given in a check-in</div></div>
    <div class="row">
      <button class="btn sm" data-act="printCheckin" data-id="${ci.id}">Print / PDF</button>
      <button class="btn sm" data-act="go" data-route="${isMine?"checkins":"coachee"}" data-id="${ci.userId}">Back</button>
    </div>
  </div>

  <div class="grid g2">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>The conversation</h2>
          <input type="date" style="width:auto" value="${esc(ci.date)}" ${canEdit?"":"readonly"} data-set="checkins/${ci.id}/date"></div>
        ${CHECKIN_STAGES.map(s=>`
          <label class="f"><span class="lb">${esc(s.t)} · ${s.min} min</span><span class="hint">${esc(s.q)}</span>
            <textarea ${canEdit?"":"readonly"} data-set="checkins/${ci.id}/${s.k}" placeholder="${canEdit?"Recorded by the coach, in the room.":""}">${esc(ci[s.k]||"")}</textarea></label>`).join("")}
        ${canEdit?`<div class="right"><button class="btn primary" data-act="signCheckin" data-id="${ci.id}">Sign and share with ${esc(u.name)}</button></div>`:""}
      </div>

      <div class="card">
        <div class="eyebrow mb8">Signatures</div>
        <div class="stack">
          <div class="signrow ${ci.coachSignedAt?"done":""}"><div class="grow"><strong class="small">Coach — ${esc(user(ci.coachId).name)}</strong>
            <div class="tiny muted">${ci.coachSignedAt?`Signed ${fmtDT(ci.coachSignedAt)}`:"Not signed yet"}</div></div>
            ${ci.coachSignedAt?`<span class="tag green">Signed</span>`:`<span class="tag grey">Pending</span>`}</div>
          <div class="signrow ${ci.memberAckAt?"done":""}"><div class="grow"><strong class="small">Team member — ${esc(u.name)}</strong>
            <div class="tiny muted">${ci.memberAckAt?`Signed ${fmtDT(ci.memberAckAt)}`:"Not signed yet"}</div></div>
            ${ci.memberAckAt?`<span class="tag green">Signed</span>`
              :(isMine&&ci.coachSignedAt?`<button class="btn primary sm" data-act="signCheckinMember" data-id="${ci.id}">Sign this record</button>`:`<span class="tag grey">Pending</span>`)}</div>
        </div>
      </div>
    </div>

    <div class="stack">
      ${ch&&ch.status==="approved"?`<div class="card">
        <div class="eyebrow mb8">Goal Charter — for the walk-through</div>
        ${ch.goals.map(g=>`<div class="small" style="padding:7px 0;border-top:1px solid var(--line-2)">
          <div style="font-weight:550">${esc(g.kr)}</div><div class="tiny muted">baseline ${esc(g.baseline||"—")} → target ${esc(g.target||"—")} · ${esc(g.source||"—")}</div></div>`).join("")}
      </div>`:""}
      <div class="card">
        <div class="eyebrow mb8">Conversation record</div>
        <div class="small muted mb16">Anything either of you wants on the record — recognition, a concern raised, a commitment made. The administrator can download this in full.</div>
        ${threadHTML(ci, isMine||ci.coachId===S.session.userId||isAdmin(), "postCheckin")}
      </div>
    </div>
  </div>`;
}

/* ---------- QUARTERLY SCORING ---------- */
export function viewScoring(){
  const c = cycle(), list = coacheesOf(S.session.userId);
  return `
  <div class="mb16"><h1>Quarterly scoring</h1>
    <div class="small muted">Scoring happens every quarter end. The full review and feedback session happens at the half-year — do not confuse the two. Read the Impact Statement first, verify it against the data sources and your check-in records, then score.</div></div>

  ${!list.length?`<div class="empty"><h3>No coachees allocated to you</h3></div>`:
  c.quarters.map(q=>`
    <h2 class="mb8 mt24">${esc(q.label)} · score by ${fmtDate(q.scoreBy)}${q.review?` · half-yearly review`:""}</h2>
    <div class="tbl-wrap mb16"><table>
      <thead><tr><th>Person</th><th>Impact statement</th><th>Goals scored</th><th>Score 1</th><th>Score 2</th><th>Quarterly</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.map(u=>{
        const ch = charterOf(u.id), r = reviewOf(u.id,q.id), im = impactOf(u.id,q.id);
        const scored = ch? ch.goals.filter(g=>g.scores&&g.scores[q.id]!=null).length : 0;
        return `<tr>
          <td>${personLine(u)}</td>
          <td>${im&&im.submittedAt?`<span class="tag green">Shared ${fmtDate(im.submittedAt)}</span>`:`<span class="tag grey">Not shared</span>`}</td>
          <td class="num">${ch?`${scored}/${ch.goals.length}`:"—"}</td>
          <td class="num">${r&&r.score1!=null?r.score1:"—"}</td>
          <td class="num">${r&&r.score2!=null?r.score2:"—"}</td>
          <td class="num" style="font-weight:700">${r&&r.quarterly!=null?r.quarterly.toFixed(2):"—"}</td>
          <td>${!r?`<span class="tag grey">Not started</span>`:r.released?`<span class="tag green">Released</span>`:r.coachSignedAt?`<span class="tag amber">In calibration</span>`:`<span class="tag amber">Draft</span>`}</td>
          <td class="right"><button class="btn sm" ${ch&&ch.status==="approved"?"":"disabled"} data-act="openReview" data-uid="${u.id}" data-q="${q.id}">${r?"Open":"Start"}</button></td>
        </tr>`;}).join("")}</tbody>
    </table></div>`).join("")}`;
}

export function viewReview(){
  const r = S.reviews.find(x=>x.id===UI.params.id);
  if (r && !canView(r.userId)) return deniedPanel("That scoring record");
  if (!r) return `<div class="empty"><h3>That review is not available</h3></div>`;
  const c = cycle(r.cycleId), q = c.quarters.find(x=>x.id===r.period);
  const u = user(r.userId), ch = charterOf(r.userId, r.cycleId), im = impactOf(r.userId, r.period, r.cycleId);
  const isCoachHere = r.coachId===S.session.userId;
  const canScore = isCoachHere && !r.coachSignedAt;
  const avg = goalAverage(ch?ch.goals:[], r.period);
  const s1 = bandFor(avg);
  const qs = quarterly(s1, r.score2, c);

  return `
  <div class="spread mb16">
    <div><div class="eyebrow">${esc(q.label)} · ${esc(c.name)}</div>
      <h1 class="mt8">Scoring — ${esc(u.name)}</h1>
      <div class="small muted">${esc(u.title)} · ${esc(u.unit)} · coach ${esc(user(r.coachId).name)}</div></div>
    <div class="row">
      ${r.released?`<span class="tag green">Released to the team member</span>`:r.coachSignedAt?`<span class="tag amber">Signed — in calibration</span>`:`<span class="tag grey">Draft</span>`}
      <button class="btn sm" data-act="printReview" data-id="${r.id}">Print / PDF</button>
      <button class="btn sm" data-act="go" data-route="scoring">Back</button>
    </div>
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="card-head"><h2>Part 1 — Impact Statement</h2>${im&&im.submittedAt?`<span class="tag green">Shared ${fmtDate(im.submittedAt)}</span>`:`<span class="tag amber">Not shared</span>`}</div>
      ${im?`<div class="eyebrow">Results against goals</div><p class="small mt8">${nl2(im.results||"—")}</p>
        <div class="eyebrow mt16">Competency commitments lived</div><p class="small mt8 mb0">${nl2(im.behaviours||"—")}</p>`
      :`<div class="empty small">The team member writes this and shares it three days before the conversation. Ask for it before you score.</div>`}
    </div>
    <div class="card">
      <div class="card-head"><h2>Score 1 — what was delivered</h2><span class="tag teal">weight ${c.weights.okr}</span></div>
      ${ch&&ch.goals.length?`<div class="tbl-wrap"><table>
        <thead><tr><th style="width:38%">Key result</th><th>Target</th><th>Their actuals</th><th style="width:110px">Score 0.0–1.0</th></tr></thead>
        <tbody>${ch.goals.map(g=>`<tr>
          <td>${esc(g.kr)}<div class="tiny muted">${esc(g.source||"no data source")}</div></td>
          <td class="num">${esc(g.target||"—")}</td>
          <td class="small">${esc((g.actuals&&g.actuals[r.period])||"—")}</td>
          <td><input type="number" min="0" max="1" step="0.05" ${canScore?"":"readonly"} data-live="1" data-type="num"
             data-set="charters/${ch.id}/goals/${g.id}/scores/${r.period}" value="${g.scores&&g.scores[r.period]!=null?g.scores[r.period]:""}"></td></tr>`).join("")}</tbody></table></div>
        <div class="spread mt16">
          <div><div class="eyebrow">Goal-score average</div><div class="num" style="font-size:22px;font-weight:600">${avg==null?"—":avg.toFixed(2)}</div></div>
          <div class="right"><div class="eyebrow">Score 1</div><div class="num" style="font-size:22px;font-weight:600">${s1==null?"—":s1}</div></div>
        </div>
        <div class="small muted mt8">${BANDS.map(b=>`${b.label} → ${b.score}`).join(" · ")}</div>`
      :`<div class="empty small">No approved charter to score against.</div>`}
    </div>
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="card-head"><h2>Score 2 — how it was delivered</h2><span class="tag ink">weight ${c.weights.comp}</span></div>
      <div class="small muted mb16">Discussed orally against the written commitments, then one overall rating out of 5. Anchor it in specifics from your check-in records — moments, deliverables, behaviours.</div>
      ${ch?ch.competencies.map(cp=>{const m=competencyMeta(cp.name); return `<div style="padding:9px 0;border-top:1px solid var(--line-2)">
        <div class="small" style="font-weight:600">${esc(cp.name)}</div>
        <div class="tiny muted">Commitment: ${esc(cp.commitment||"—")}</div>
        ${m?`<div class="tiny muted mt8"><strong>5:</strong> ${esc(m.l5)}<br><strong>3:</strong> ${esc(m.l3)}</div>`:""}</div>`;}).join(""):""}
      <label class="f mt16 mb0"><span class="lb">Score 2 — one rating out of 5</span>
        <select ${canScore?"":"disabled"} data-live="1" data-type="num" data-set="reviews/${r.id}/score2">
          <option value="">Not yet rated</option>
          ${SCALE.map(s=>`<option value="${s.n}" ${r.score2===s.n?"selected":""}>${s.n} — ${esc(s.label)}</option>`).join("")}
        </select></label>
    </div>

    <div class="card">
      <div class="card-head"><h2>Quarterly score</h2></div>
      ${spine(qs, `(Score 1 × ${c.weights.okr}) + (Score 2 × ${c.weights.comp})`)}
      ${blendBar(s1, r.score2, c)}
      <div class="grid g3 mt24">
        <div class="kpi"><div class="v">${s1==null?"—":s1}</div><div class="l">Score 1 · OKR attainment</div></div>
        <div class="kpi"><div class="v">${r.score2==null?"—":r.score2}</div><div class="l">Score 2 · competency</div></div>
        <div class="kpi"><div class="v">${qs==null?"—":qs.toFixed(2)}</div><div class="l">Quarterly score</div></div>
      </div>
      ${q.review?`<div class="card wash mt16"><div class="eyebrow">Half-yearly review</div>
        <div class="small mt8">This is the cycle-closing quarter. Half-yearly score = the plain average of ${c.quarters.map(x=>x.id).join(" and ")}: <strong class="num">${halfYearScore(r.userId)!=null?halfYearScore(r.userId).toFixed(2):"pending both quarters"}</strong></div></div>`:""}
    </div>
  </div>

  <div class="card mb24">
    <h2 class="mb16">Part 2 — Coach review</h2>
    <label class="f"><span class="lb">1 · The impact this person has created — your verified summary</span>
      <span class="hint">Verified against the charter, the check-in records and the named data sources.</span>
      <textarea ${canScore?"":"readonly"} style="min-height:110px" data-set="reviews/${r.id}/impactSummary">${esc(r.impactSummary||"")}</textarea></label>
    <label class="f"><span class="lb">2 · Development needs — and the training, exposure or support to be provided</span>
      <span class="hint">You own one development action per coachee per cycle. Name it here and follow it through.</span>
      <textarea ${canScore?"":"readonly"} style="min-height:110px" data-set="reviews/${r.id}/developmentNeeds">${esc(r.developmentNeeds||"")}</textarea></label>
    <label class="f"><span class="lb">3 · Recommendation</span>
      <select ${canScore?"":"disabled"} data-set="reviews/${r.id}/recommendation">
        <option value="">Not recorded</option>
        ${RECOMMENDATIONS.map(x=>`<option ${r.recommendation===x?"selected":""}>${esc(x)}</option>`).join("")}
      </select></label>
    ${canScore?`<div class="row"><button class="btn primary" data-act="signReview" data-id="${r.id}">Sign and send to calibration</button></div>`:""}
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="eyebrow mb8">Signatures and calibration</div>
      <div class="stack">
        <div class="signrow ${r.coachSignedAt?"done":""}"><div class="grow"><strong class="small">Coach — ${esc(user(r.coachId).name)}</strong>
          <div class="tiny muted">${r.coachSignedAt?fmtDT(r.coachSignedAt):"Not signed"}</div></div>
          ${r.coachSignedAt?`<span class="tag green">Signed</span>`:`<span class="tag grey">Pending</span>`}</div>
        <div class="signrow ${r.approverSignedAt?"done":""}"><div class="grow"><strong class="small">${esc(S.settings.approverLabel)} sign-off</strong>
          <div class="tiny muted">${r.approverSignedAt?fmtDT(r.approverSignedAt):"After calibration across all coaches"}</div></div>
          ${r.approverSignedAt?`<span class="tag green">Signed</span>`
            :(isAdmin()&&r.coachSignedAt?`<button class="btn primary sm" data-act="releaseReview" data-id="${r.id}">Calibrate, sign off and release</button>`:`<span class="tag grey">Pending</span>`)}</div>
        <div class="signrow ${r.memberAckAt?"done":""}"><div class="grow"><strong class="small">Team member acknowledgment — ${esc(u.name)}</strong>
          <div class="tiny muted">${r.memberAckAt?fmtDT(r.memberAckAt):"Available once the score is released"}</div></div>
          ${r.memberAckAt?`<span class="tag green">Acknowledged</span>`:`<span class="tag grey">Pending</span>`}</div>
      </div>
      ${r.memberComment?`<div class="card flat mt16" style="background:var(--surface)"><div class="eyebrow">Team member comment, verbatim</div>
        <p class="small mt8 mb0">${nl2(r.memberComment)}</p></div>`:""}
    </div>
    <div class="card">
      <div class="eyebrow mb8">Conversation record</div>
      <div class="small muted mb16">The transcript of this scoring conversation. Both sides can add to it; the administrator can download it in full.</div>
      ${threadHTML(r, true, "postReview")}
    </div>
  </div>`;
}
