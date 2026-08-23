/* Team member screens: overview, goal charter, check-ins, impact statement,
   scores. Everything here is about the signed-in person's own record. */
import { S, UI, save } from "../state.js";
import { esc, nl2, fmtDate, fmtDT, today, uid } from "../helpers.js";
import { SCALE, BANDS, CHECKIN_STAGES, FIXED_COMPETENCIES, COACH_FIXED_THIRD } from "../config.js";
import { LIB } from "../data/library.js";
import { user, me, isAdmin, isCoach, cycle, coacheesOf, charterOf, reviewOf, impactOf,
         checkinsOf, bandFor, goalAverage, quarterly, halfYearScore, annualScore,
         charterStatusTag, competencyMeta, requiredFixed } from "../domain.js";
import { spine, blendBar, scaleLegend, personLine, threadHTML } from "../ui.js";

export function nextActions(){
  const u = me(), out = [];
  const ch = charterOf(u.id);
  if (!ch) out.push({t:"Draft your Goal Charter", d:`Up to ${cycle().maxGoals} measurable goals and ${cycle().competencies} competencies, before the cycle starts.`, r:"charter"});
  else if (ch.status==="draft") out.push({t:"Finish and send your Goal Charter to your coach", d:"Your coach reviews first, then it goes for final approval.", r:"charter"});
  else if (ch.status==="returned") out.push({t:"Your coach returned the charter with comments", d:esc(ch.coachNote||"See the notes on your charter."), r:"charter"});
  else if (ch.status==="approved"){
    const c = cycle();
    const done = checkinsOf(u.id).length;
    if (done < c.checkins) out.push({t:"Monthly check-in", d:`${done} of ${c.checkins} check-ins recorded this cycle. Your coach books the 15 minutes; come with your numbers.`, r:"checkins"});
    c.quarters.forEach(q=>{
      const im = impactOf(u.id, q.id);
      if (!im || !im.submittedAt) out.push({t:`Write your Impact Statement for ${q.label.split(" · ")[0]}`, d:"Share it three days before the scoring conversation — this is the only part you write.", r:"impact"});
      const rv = reviewOf(u.id, q.id);
      if (rv && rv.released && !rv.memberAckAt) out.push({t:`Acknowledge your ${q.id} review`, d:"Read the score and development needs, and add your own comment for the record.", r:"myscores"});
    });
  }
  if (isCoach()){
    const pend = S.charters.filter(c=>c.status==="coach_review" && coacheesOf(u.id).some(x=>x.id===c.userId));
    if (pend.length) out.push({t:`${pend.length} charter${pend.length>1?"s":""} waiting for your review`, d:"Refine targets, check measurability, confirm the competency commitments.", r:"approvals"});
  }
  if (isAdmin()){
    const ap = S.charters.filter(c=>c.status==="approval");
    if (ap.length) out.push({t:`${ap.length} charter${ap.length>1?"s":""} waiting for final approval`, d:"Coach review is complete; yours is the last signature before the cycle locks.", r:"approvals"});
  }
  return out;
}

export function viewHome(){
  const u = me(), c = cycle(), ch = charterOf(u.id);
  const acts = nextActions();
  const scores = c.quarters.map(q=>{ const r = reviewOf(u.id,q.id); return {q, r: r&&r.released ? r : null}; });
  const hy = halfYearScore(u.id);
  const done = checkinsOf(u.id).length;

  return `
  <div class="hero mb24">
    <div class="eyebrow" style="color:#8FC5C0">${esc(c.name)} · ${esc(u.unit)}</div>
    <h1 class="mt8">Hello, ${esc(u.name.split(/[\s.]+/).slice(-1)[0])}</h1>
    <div class="sub">Your goals are set once before the cycle, talked through every month, and scored at each quarter end. Nothing here is a surprise — everything you see, your coach sees too.</div>
  </div>

  <div class="grid g4 mb24">
    <div class="kpi"><div class="v">${ch&&ch.status==="approved"?ch.goals.length:"—"}</div><div class="l">Goals in your charter</div></div>
    <div class="kpi"><div class="v">${done}<span class="muted" style="font-size:16px">/${c.checkins}</span></div><div class="l">Check-ins recorded</div></div>
    <div class="kpi"><div class="v">${scores[0].r?scores[0].r.quarterly.toFixed(2):"—"}</div><div class="l">${esc(c.quarters[0].id)} score</div></div>
    <div class="kpi"><div class="v">${hy!=null?hy.toFixed(2):"—"}</div><div class="l">Half-yearly score</div></div>
  </div>

  <div class="grid g2">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>What needs you next</h2></div>
        ${acts.length ? `<div class="stack">${acts.map(a=>`
          <div class="row" style="align-items:flex-start;padding:11px 0;border-top:1px solid var(--line-2)">
            <div class="grow"><div style="font-weight:600">${esc(a.t)}</div><div class="small muted">${a.d}</div></div>
            <button class="btn sm" data-act="go" data-route="${a.r}">Open</button>
          </div>`).join("")}</div>`
        : `<div class="empty"><h3>You are up to date</h3><div class="small">Nothing is waiting on you right now.</div></div>`}
      </div>

      <div class="card">
        <div class="card-head"><h2>Your charter</h2>${charterStatusTag(ch)}</div>
        ${ch && ch.goals.length ? `<div class="stack">
          ${ch.goals.map((g,i)=>`<div style="border-top:1px solid var(--line-2);padding-top:9px">
            <div class="eyebrow">Goal ${i+1}</div>
            <div style="font-weight:550">${esc(g.kr)}</div>
            <div class="tiny muted">Baseline ${esc(g.baseline||"—")} → target ${esc(g.target||"—")} · ${esc(g.source||"no data source")}</div>
          </div>`).join("")}
          <button class="btn sm" data-act="go" data-route="charter">Open the full charter</button>
        </div>` : `<div class="empty"><h3>No charter yet</h3><div class="small mb16">Draft up to ${c.maxGoals} goals and ${c.competencies} competencies to begin the cycle.</div><button class="btn primary" data-act="go" data-route="charter">Start my charter</button></div>`}
      </div>
    </div>

    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>The cycle</h2><span class="tag teal">${esc(c.name)}</span></div>
        <div class="timeline">
          <div class="ev ${ch&&ch.status==="approved"?"done":""}"><div style="font-weight:600">Goal setting · ${fmtDate(c.goalWindow.from)} – ${fmtDate(c.goalWindow.to)}</div><div class="small muted">You draft → coach reviews → ${esc(S.settings.approverLabel)} approves. The approved sheet is your charter for the cycle.</div></div>
          <div class="ev ${done>0?"done":""}"><div style="font-weight:600">Monthly check-ins · 15 minutes</div><div class="small muted">A two-way conversation. No ratings, no status labels — blockers out, way forward agreed.</div></div>
          ${c.quarters.map(q=>{
            const r = reviewOf(u.id,q.id);
            return `<div class="ev ${r&&r.released?"done":"mute"}"><div style="font-weight:600">${esc(q.label)} · scoring by ${fmtDate(q.scoreBy)}</div>
            <div class="small muted">Goals scored 0.0–1.0 → Score 1, competencies discussed → Score 2, combined ${c.weights.okr}/${c.weights.comp}.${q.review?" Half-yearly review and feedback session happens here.":""}</div></div>`;
          }).join("")}
          <div class="ev mute"><div style="font-weight:600">Cycle close</div><div class="small muted">Half-yearly score = the average of the two quarters. Annual = the average of the halves.</div></div>
        </div>
      </div>

      <div class="card wash">
        <div class="eyebrow">Remember</div>
        <h3 class="mt8">On a five-point scale, 3 is a good rating.</h3>
        <p class="small muted mt8">It means you reliably delivered what was agreed. A well-set charter usually averages 0.7–0.8 on goal attainment — a row of perfect 1.0s usually means the goals were set too safe.</p>
      </div>
    </div>
  </div>`;
}

/* ---------- GOAL CHARTER ---------- */
export function charterSteps(ch){
  const order = ["draft","coach_review","approval","approved"];
  const at = ch ? (ch.status==="returned" ? 0 : order.indexOf(ch.status)) : -1;
  const labels = [
    {t:"You draft", d:"goals + competencies"},
    {t:"Coach reviews", d:"targets, measurability"},
    {t:`${S.settings.approverLabel} approves`, d:"final sign-off"},
    {t:"Locked for the cycle", d:"your Goal Charter"}
  ];
  return `<div class="steps mb16">${labels.map((l,i)=>`
    <div class="st ${i===at?"on":""} ${i<at?"ok":""}"><span class="n">${i<at?"✓":i+1}</span>
    <span><span style="display:block">${esc(l.t)}</span><span class="tiny muted">${esc(l.d)}</span></span></div>`).join("")}</div>`;
}

export function viewCharter(){
  const u = me(), c = cycle();
  let ch = charterOf(u.id);
  if (!ch){
    return `<div class="empty" style="padding:44px">
      <h3>Start your Goal Charter for ${esc(c.name)}</h3>
      <p class="small" style="max-width:520px;margin:8px auto 18px">You draft a maximum of ${c.maxGoals} goals — each with a measurable key result, a baseline, a target and a named data source — plus ${c.competencies} competencies, each carrying a one-line commitment.</p>
      <button class="btn primary" data-act="newCharter">Start drafting</button>
      <div class="mt16"><button class="btn ghost sm" data-act="go" data-route="library">Browse the goal library first</button></div>
    </div>`;
  }
  const editable = ch.status==="draft" || ch.status==="returned";
  const locked = ch.status==="approved";
  const fixed = requiredFixed(u);

  const goalCard = (g,i)=>`
    <div class="card flat mb16" style="border-left:3px solid var(--teal)">
      <div class="card-head">
        <div><div class="eyebrow">Goal ${i+1}</div><div style="font-weight:600;font-size:15px">${esc(g.objective||"Untitled objective")}</div></div>
        ${editable?`<button class="btn sm danger" data-act="delGoal" data-id="${ch.id}" data-gid="${g.id}">Remove</button>`:""}
      </div>
      <label class="f"><span class="lb">Key result — the measurable outcome</span>
        <input type="text" value="${esc(g.kr)}" ${editable?"":"readonly"} data-set="charters/${ch.id}/goals/${g.id}/kr"></label>
      <div class="grid g3">
        <label class="f"><span class="lb">Baseline</span><input type="text" value="${esc(g.baseline||"")}" ${editable?"":"readonly"} data-set="charters/${ch.id}/goals/${g.id}/baseline" placeholder="where you start"></label>
        <label class="f"><span class="lb">Target</span><input type="text" value="${esc(g.target||"")}" ${editable?"":"readonly"} data-set="charters/${ch.id}/goals/${g.id}/target" placeholder="what success is"></label>
        <label class="f"><span class="lb">Data source</span><input type="text" value="${esc(g.source||"")}" ${editable?"":"readonly"} data-set="charters/${ch.id}/goals/${g.id}/source" placeholder="where the number comes from"></label>
      </div>
      ${locked?`<div class="grid g2" style="border-top:1px solid var(--line-2);padding-top:12px">
        ${c.quarters.map(q=>{
          const sc = g.scores && g.scores[q.id];
          return `<label class="f mb0"><span class="lb">${esc(q.id)} — what you actually achieved</span>
          <span class="hint">Your own record of the outcome. Your coach scores it against the data source.</span>
          <input type="text" value="${esc((g.actuals&&g.actuals[q.id])||"")}" data-set="charters/${ch.id}/goals/${g.id}/actuals/${q.id}" placeholder="e.g. reached 92% — CRM export attached">
          <span class="tiny muted" style="display:block;margin-top:5px">Coach score: <strong class="num">${sc==null?"not scored yet":sc.toFixed(2)}</strong></span></label>`;
        }).join("")}
      </div>`:""}
    </div>`;

  const compCard = (cp,idx)=>{
    const meta = competencyMeta(cp.name);
    return `<div class="card flat mb16">
      <div class="card-head">
        <div class="grow"><div class="eyebrow">Competency ${idx+1} · ${cp.fixed?"fixed for everyone":cp.custom?"your own":"chosen with your coach"}</div>
          ${cp.custom&&editable
            ? `<input type="text" value="${esc(cp.name)}" data-live="1" data-set="charters/${ch.id}/competencies/${cp.name}/name" style="font-weight:600;font-size:15px;border:1px dashed var(--line);max-width:420px">`
            : `<div style="font-weight:600;font-size:15px">${esc(cp.name)}</div>`}
          ${meta?`<div class="small muted mt8">${esc(meta.definition)}</div>`:cp.custom?`<div class="small muted mt8">Your own competency. Your coach confirms it at review, and it is assessed at every quarterly scoring alongside the others.</div>`:""}</div>
        <div class="row">
          ${meta?`<button class="btn sm" data-act="compInfo" data-name="${esc(cp.name)}">What 5 / 3 / 1 looks like</button>`:""}
          ${editable && !cp.fixed?`<button class="btn sm danger" data-act="delComp" data-id="${ch.id}" data-name="${esc(cp.name)}">${cp.custom?"Remove":"Change"}</button>`:""}
        </div>
      </div>
      <label class="f mb0"><span class="lb">My commitment — one line</span>
        <span class="hint">What you will actually do under this competency. This is what the quarterly discussion is judged against.</span>
        <input type="text" value="${esc(cp.commitment||"")}" ${editable?"":"readonly"} data-set="charters/${ch.id}/competencies/${cp.name}/commitment" placeholder="e.g. weekly written project update to all stakeholders">
      </label>
    </div>`;
  };

  const chosen = ch.competencies.filter(x=>!x.fixed).length;
  const canPick = c.competencies - fixed.length;

  return `
  ${charterSteps(ch)}
  <div class="spread mb16">
    <div><h1>Goal Charter · ${esc(c.name)}</h1>
      <div class="small muted">${esc(u.name)} · ${esc(u.unit)} · coach: ${esc(user(u.coachId).name)}</div></div>
    <div class="row">${charterStatusTag(ch)}
      ${editable?`<button class="btn primary" data-act="submitCharter" data-id="${ch.id}">Send to my coach</button>`:""}
      <button class="btn sm" data-act="printCharter" data-id="${ch.id}">Print / PDF</button>
    </div>
  </div>

  ${ch.status==="returned"&&ch.coachNote?`<div class="card mb16" style="border-left:3px solid var(--red)">
    <div class="eyebrow">Returned by your coach</div><p class="mt8 mb0">${nl2(ch.coachNote)}</p></div>`:""}
  ${ch.status==="approved"?`<div class="card wash mb24">
    <div class="grid g2">
      <div><div class="eyebrow">Coach review</div><div class="small mt8">${nl2(ch.coachNote||"Reviewed.")}</div>
        <div class="tiny muted mt8">${esc(user(ch.coachId).name)} · ${fmtDT(ch.coachSignedAt)}</div></div>
      <div><div class="eyebrow">${esc(S.settings.approverLabel)} approval</div><div class="small mt8">${nl2(ch.approverNote||"Approved.")}</div>
        <div class="tiny muted mt8">${esc(user(ch.approvedBy).name)} · ${fmtDT(ch.approvedAt)}</div></div>
    </div></div>`:""}

  <div class="spread mb16 mt24">
    <div><h2>Goals</h2><div class="small muted">Maximum ${c.maxGoals}. Every goal needs a measurable key result and a named data source.</div></div>
    ${editable?`<div class="row">
      <button class="btn primary" data-act="pickOKR" ${ch.goals.length>=c.maxGoals?"disabled":""}>Add from the library</button>
      <button class="btn" data-act="addCustomGoal" data-id="${ch.id}" ${ch.goals.length>=c.maxGoals?"disabled":""}>Write my own</button>
    </div>`:""}
  </div>
  ${ch.goals.length ? ch.goals.map(goalCard).join("") : `<div class="empty mb24"><h3>No goals yet</h3><div class="small">Pick from the library for your unit, or write your own. Either way, adapt the wording to your real work.</div></div>`}

  <div class="spread mb16 mt32">
    <div><h2>Competencies</h2><div class="small muted">${fixed.length} fixed for everyone, ${canPick} chosen with your coach. Each carries a one-line commitment.</div></div>
    ${editable ? (chosen < canPick
      ? `<div class="row"><span class="tag amber">${canPick-chosen} still to choose</span><button class="btn primary" data-act="pickComp">Choose a competency</button></div>`
      : `<span class="tag green">All ${c.competencies} chosen</span>`) : ""}
  </div>
  ${ch.competencies.map(compCard).join("")}

  ${editable?`<div class="card mt24">
    <div class="spread">
      <div><h3>Ready to send?</h3><div class="small muted">Your coach reviews first — refining targets and checking measurability — then ${esc(S.settings.approverLabel)} gives final approval. After that the charter is locked for the cycle.</div></div>
      <button class="btn primary" data-act="submitCharter" data-id="${ch.id}">Send to my coach</button>
    </div></div>`:""}`;
}

/* ---------- MY CHECK-INS ---------- */
export function viewMyCheckins(){
  const u = me(), c = cycle(), list = checkinsOf(u.id);
  return `
  <div class="spread mb16">
    <div><h1>Monthly check-ins</h1><div class="small muted">15 minutes with ${esc(user(u.coachId).name)}, once a month. A conversation, not an evaluation — no ratings are given here.</div></div>
    <span class="tag teal">${list.length} of ${c.checkins} recorded</span>
  </div>

  <div class="card mb24">
    <div class="eyebrow">How to get the most from yours</div>
    <ul class="mt8 mb0 small" style="padding-left:18px;color:var(--muted)">
      <li>Come with your charter open and know your numbers — the 15 minutes are for discussion, not status recital.</li>
      <li>Raise blockers early and honestly, while there is still time to act on them.</li>
      <li>Ask for feedback, and expect it to be specific. Nothing at your review should be a surprise.</li>
      <li>Leave with clarity: you should be able to say exactly what happens next and who owes what.</li>
    </ul>
  </div>

  ${list.length ? `<div class="stack">${list.map(ci=>`
    <div class="card">
      <div class="card-head">
        <div><div class="eyebrow">Check-in ${ci.no} of ${c.checkins} · ${fmtDate(ci.date)}</div>
          <h3 class="mt8">${esc(user(ci.coachId).name)} — ${esc(ci.forward? ci.forward.slice(0,90)+(ci.forward.length>90?"…":"") : "no way forward recorded")}</h3></div>
        <div class="row">${ci.memberAckAt?`<span class="tag green">You signed</span>`:`<span class="tag amber">Needs your signature</span>`}
          <button class="btn sm" data-act="go" data-route="checkin" data-id="${ci.id}">Open</button></div>
      </div>
      <div class="grid g2">
        <div><div class="eyebrow">Summary of discussion</div><div class="small mt8">${nl2(ci.goals||"—")}</div></div>
        <div><div class="eyebrow">Way forward</div><div class="small mt8">${nl2(ci.forward||"—")}</div></div>
      </div>
    </div>`).join("")}</div>`
  : `<div class="empty"><h3>No check-ins recorded yet</h3><div class="small">Your coach records the conversation at the end of each 15-minute check-in, and you both sign it here.</div></div>`}`;
}

/* ---------- IMPACT STATEMENT ---------- */
export function viewImpact(){
  const u = me(), c = cycle();
  return `
  <div class="mb16"><h1>Impact Statement</h1>
    <div class="small muted">Your account, in your words, of the impact you created — with real numbers. Share it three days before the scoring conversation. This is the only section you write, and it is the most important one.</div></div>

  <div class="stack">
  ${c.quarters.map(q=>{
    const im = impactOf(u.id,q.id) || {id:"new_"+q.id, results:"", behaviours:"", transcript:[]};
    const submitted = !!im.submittedAt;
    const exists = !!impactOf(u.id,q.id);
    return `<div class="card">
      <div class="card-head">
        <div><div class="eyebrow">${esc(q.label)}</div><h2 class="mt8">Part 1 — written by you</h2></div>
        ${submitted?`<span class="tag green">Shared ${fmtDate(im.submittedAt)}</span>`:`<span class="tag amber">Not shared yet</span>`}
      </div>
      <label class="f"><span class="lb">Impact created — results against my goals</span>
        <span class="hint">What moved, by how much, against which target. Name the evidence your coach can verify.</span>
        <textarea ${submitted?"readonly":""} style="min-height:120px" ${exists?`data-set="impacts/${im.id}/results"`:`data-bind="res_${q.id}"`} placeholder="e.g. Inbound response within 48h moved from 70% to 95% (CRM export, Sep–Nov). Closed ₹16L of the ₹20L target…">${esc(im.results)}</textarea></label>
      <label class="f"><span class="lb">Competency commitments I lived — and how</span>
        <span class="hint">Take each of your five commitments and say, concretely, what you did.</span>
        <textarea ${submitted?"readonly":""} style="min-height:120px" ${exists?`data-set="impacts/${im.id}/behaviours"`:`data-bind="beh_${q.id}"`} placeholder="e.g. Communication — sent the weekly written pipeline update 12 of 12 weeks…">${esc(im.behaviours)}</textarea></label>
      <div class="spread">
        <div class="small muted">${submitted?`Shared with ${esc(user(u.coachId).name)}. It is now read-only — anything further goes in the record below.`:"Your coach cannot see this until you share it."}</div>
        <div class="row">
          ${!submitted?`<button class="btn" data-act="saveImpact" data-q="${q.id}">Save draft</button>
          <button class="btn primary" data-act="shareImpact" data-q="${q.id}">Share with my coach</button>`:
          `<button class="btn sm" data-act="printImpact" data-q="${q.id}">Print / PDF</button>`}
        </div>
      </div>
      ${exists?`<div class="mt24" style="border-top:1px solid var(--line-2);padding-top:14px">
        <div class="eyebrow mb8">Conversation record · ${esc(q.id)}</div>
        ${threadHTML(im, true, "postImpact")}</div>`:""}
    </div>`;
  }).join("")}
  </div>`;
}

/* ---------- MY SCORES ---------- */
export function viewMyScores(){
  const u = me(), c = cycle();
  const hy = halfYearScore(u.id), an = annualScore(u.id);
  const released = c.quarters.map(q=>reviewOf(u.id,q.id)).filter(r=>r&&r.released);

  return `
  <div class="mb16"><h1>My scores</h1>
    <div class="small muted">Scores are given every quarter. The half-yearly score is the plain average of the two; the annual score is the average of the halves. Nothing is weighted beyond the ${c.weights.okr}/${c.weights.comp} split between what you delivered and how.</div></div>

  <div class="grid g3 mb24">
    ${c.quarters.map(q=>{ const r = reviewOf(u.id,q.id);
      return `<div class="kpi"><div class="v">${r&&r.released?r.quarterly.toFixed(2):"—"}</div><div class="l">${esc(q.label)}</div></div>`;}).join("")}
    <div class="kpi"><div class="v">${hy!=null?hy.toFixed(2):"—"}</div><div class="l">Half-yearly · (${c.quarters.map(q=>q.id).join(" + ")}) ÷ ${c.quarters.length}</div></div>
  </div>
  ${an!=null?`<div class="card wash mb24"><div class="spread"><div><div class="eyebrow">Final annual score</div>
    <div class="num" style="font-size:30px;font-weight:600">${an.toFixed(2)}</div></div>
    <div class="small muted" style="max-width:400px">The average of your half-yearly scores. It informs growth and reward decisions, communicated to you individually.</div></div></div>`:""}

  ${released.length ? released.map(r=>{
    const q = c.quarters.find(x=>x.id===r.period);
    return `<div class="card mb24">
      <div class="card-head">
        <div><div class="eyebrow">${esc(q.label)}${q.review?" · half-yearly review":""}</div><h2 class="mt8">Quarterly score ${r.quarterly.toFixed(2)}</h2></div>
        ${r.memberAckAt?`<span class="tag green">Acknowledged ${fmtDate(r.memberAckAt)}</span>`:`<span class="tag amber">Awaiting your acknowledgment</span>`}
      </div>
      ${spine(r.quarterly, `Score 1 (what you delivered) <strong>${r.score1}</strong> · Score 2 (how you delivered it) <strong>${r.score2}</strong>`)}
      ${blendBar(r.score1, r.score2, c)}
      <div class="grid g2 mt24">
        <div><div class="eyebrow">The impact you created — your coach's verified summary</div><p class="small mt8">${nl2(r.impactSummary||"—")}</p></div>
        <div><div class="eyebrow">Development needs — and the support coming</div><p class="small mt8">${nl2(r.developmentNeeds||"—")}</p></div>
      </div>
      <div class="row wrap mt16">
        <span class="tag ink">${esc(r.recommendation||"No recommendation recorded")}</span>
        <span class="tiny muted">Coach ${esc(user(r.coachId).name)} · ${fmtDT(r.coachSignedAt)}</span>
        <span class="tiny muted">${esc(S.settings.approverLabel)} sign-off · ${fmtDT(r.approverSignedAt)}</span>
      </div>

      ${!r.memberAckAt?`<div class="card flat mt16" style="background:var(--surface)">
        <label class="f"><span class="lb">Your comment (optional, recorded verbatim)</span>
          <textarea data-bind="ack_${r.id}" placeholder="Anything you want on the record — agreement, a different view, a request."></textarea></label>
        <button class="btn primary" data-act="ackReview" data-id="${r.id}">Acknowledge this review</button>
      </div>`:(r.memberComment?`<div class="card flat mt16" style="background:var(--surface)">
        <div class="eyebrow">Your comment, verbatim</div><p class="small mt8 mb0">${nl2(r.memberComment)}</p></div>`:"")}

      <div class="mt24" style="border-top:1px solid var(--line-2);padding-top:14px">
        <div class="eyebrow mb8">Conversation record</div>
        ${threadHTML(r, true, "postReview")}
      </div>
    </div>`;
  }).join("") : `<div class="empty"><h3>No scores released yet</h3><div class="small">Scores appear here after the quarterly conversation and calibration.</div></div>`}

  <h2 class="mt32 mb8">How the number is built</h2>
  <div class="card mb16">
    <ol class="small" style="padding-left:18px;color:var(--muted)">
      <li>Each goal in your charter is scored 0.0–1.0 against its target, from the named data source.</li>
      <li>The average converts to <strong>Score 1</strong>: ${BANDS.map(b=>`${b.label} → ${b.score}`).join(" · ")}.</li>
      <li>Your five competency commitments are discussed orally; your coach records one rating out of 5 as <strong>Score 2</strong>.</li>
      <li><strong>Quarterly score = (Score 1 × ${c.weights.okr}) + (Score 2 × ${c.weights.comp})</strong>, calibrated across all coaches before release.</li>
    </ol>
  </div>
  ${scaleLegend()}`;
}

