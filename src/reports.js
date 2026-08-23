/* =====================================================================
   EXPORT BUILDERS — printable record books and spreadsheet files.

   Every builder takes the scope it is given rather than reaching for
   S.users directly: an administrator's scope is the whole programme, a
   coach's scope is themselves and the people they coach. csvOf() and
   fullBookHTML() below are called with that scope by actions.js.
   ===================================================================== */
import { S } from "./state.js";
import { esc, nl2, fmtDate, fmtDT, nowISO, toCSV, download } from "./helpers.js";
import { CHECKIN_STAGES } from "./config.js";
import { user, cycle, charterOf, reviewOf, impactOf, checkinsOf, goalAverage, halfYearScore } from "./domain.js";
import { visibleUsers, visibleUserIds, canDownloadAll } from "./access.js";
import { personRecord, transcriptLines } from "./views/records.js";
import { toast } from "./ui.js";

export function reportShell(title, inner){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0B1211;margin:0;padding:36px;line-height:1.55;max-width:920px}
    h1{font-size:24px;margin:0 0 4px;letter-spacing:-.02em} h2{font-size:18px;margin:30px 0 8px;padding-bottom:6px;border-bottom:2px solid #0E7C74}
    h3{font-size:15px;margin:20px 0 6px} p{margin:0 0 9px} .muted{color:#5F716F}
    .eyebrow{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5F716F}
    table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}
    th{text-align:left;background:#E9F5F3;color:#063E3B;padding:7px 9px;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
    td{padding:7px 9px;border-bottom:1px solid #E2EBE9;vertical-align:top}
    .band{background:linear-gradient(135deg,#12A093,#0E7C74 55%,#0B1211);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:24px}
    .band .t{font-size:12px;color:#B7D6D3;letter-spacing:.1em;text-transform:uppercase;font-family:ui-monospace,monospace}
    .box{border:1px solid #E2EBE9;border-radius:9px;padding:14px;margin:10px 0}
    .msg{border-left:3px solid #0E7C74;background:#F8FBFA;padding:9px 12px;margin:8px 0;border-radius:0 8px 8px 0}
    .msg.member{border-left-color:#0B1211} .msg .h{font-size:11px;color:#5F716F;margin-bottom:4px}
    .pill{display:inline-block;background:#E9F5F3;color:#063E3B;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600}
    .num{font-family:ui-monospace,Menlo,monospace}
    .sig{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px} .sig div{border:1px solid #E2EBE9;border-radius:8px;padding:8px 12px;font-size:12px}
    @media print{body{padding:0} h2{break-after:avoid} .box,table{break-inside:avoid}}
  </style></head><body>${inner}</body></html>`;
}

export function personBookHTML(userId, cycleId){
  const r = personRecord(userId, cycleId), c = r.cycle;
  const th = list => list.length ? list.map(t=>`<div class="msg ${t.role==="member"?"member":""}">
      <div class="h"><strong>${esc(t.author)}</strong> · ${esc(t.role)} · ${fmtDT(t.ts)}</div>${nl2(t.text)}</div>`).join("") : `<p class="muted">No entries.</p>`;

  return `
  <div class="band">
    <div class="t">${esc(S.product.name)} · ${esc(c.name)} · performance record</div>
    <h1 style="color:#fff;margin-top:8px">${esc(r.person.name)}</h1>
    <div style="color:#B7D6D3">${esc(r.person.title)} · ${esc(r.person.unit)} · coached by ${esc(r.coach.name)}</div>
    <div style="color:#B7D6D3;font-size:12px;margin-top:10px">Cycle ${fmtDate(c.start)} – ${fmtDate(c.end)} · generated ${fmtDT(nowISO())}</div>
  </div>

  <h2>1 · Goal Charter</h2>
  ${r.charter?`<p class="muted">Status: ${r.charter.status.replace("_"," ")} · coach review ${fmtDT(r.charter.coachSignedAt)} · approved ${fmtDT(r.charter.approvedAt)}</p>
  <table><thead><tr><th>Objective</th><th>Key result</th><th>Baseline</th><th>Target</th><th>Data source</th>
    ${c.quarters.map(q=>`<th>${esc(q.id)} actuals</th><th>${esc(q.id)} score</th>`).join("")}</tr></thead>
  <tbody>${r.charter.goals.map(g=>`<tr><td>${esc(g.objective)}</td><td>${esc(g.kr)}</td><td class="num">${esc(g.baseline||"—")}</td>
    <td class="num">${esc(g.target||"—")}</td><td>${esc(g.source||"—")}</td>
    ${c.quarters.map(q=>`<td>${esc((g.actuals&&g.actuals[q.id])||"—")}</td><td class="num">${g.scores&&g.scores[q.id]!=null?g.scores[q.id].toFixed(2):"—"}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <h3>Competency commitments</h3>
  <table><thead><tr><th>Competency</th><th>Type</th><th>Commitment</th></tr></thead><tbody>
    ${r.charter.competencies.map(cp=>`<tr><td>${esc(cp.name)}</td><td>${cp.fixed?"fixed":"chosen"}</td><td>${esc(cp.commitment||"—")}</td></tr>`).join("")}</tbody></table>
  <div class="box"><strong>Coach review note</strong><p>${nl2(r.charter.coachNote||"—")}</p>
    <strong>${esc(S.settings.approverLabel)} approval note</strong><p>${nl2(r.charter.approverNote||"—")}</p></div>`
  :`<p class="muted">No charter recorded for this cycle.</p>`}

  <h2>2 · Monthly check-ins</h2>
  ${r.checkins.length? r.checkins.map(ci=>`<div class="box">
    <div class="eyebrow">Check-in ${ci.no} · ${fmtDate(ci.date)} · with ${esc(user(ci.coachId).name)}</div>
    ${CHECKIN_STAGES.map(s=>`<h3>${esc(s.t)}</h3><p>${nl2(ci[s.k]||"—")}</p>`).join("")}
    <div class="sig"><div>Coach signed: ${fmtDT(ci.coachSignedAt)}</div><div>Team member signed: ${fmtDT(ci.memberAckAt)}</div></div>
    <h3>Conversation record</h3>${th(ci.transcript||[])}
  </div>`).join("") : `<p class="muted">No check-ins recorded.</p>`}

  <h2>3 · Impact statements — written by the team member</h2>
  ${r.impacts.length? r.impacts.map(im=>`<div class="box">
    <div class="eyebrow">${esc(im.period)} · ${im.submittedAt?`shared ${fmtDT(im.submittedAt)}`:"draft, not shared"}</div>
    <h3>Impact created — results against goals</h3><p>${nl2(im.results||"—")}</p>
    <h3>Competency commitments lived</h3><p>${nl2(im.behaviours||"—")}</p>
    <h3>Conversation record</h3>${th(im.transcript||[])}
  </div>`).join("") : `<p class="muted">No impact statements recorded.</p>`}

  <h2>4 · Quarterly scoring and review</h2>
  ${r.reviews.length? r.reviews.map(rv=>`<div class="box">
    <div class="eyebrow">${esc(rv.period)} · ${rv.released?"released":"not released"}</div>
    <p><span class="pill">Score 1 · ${rv.score1==null?"—":rv.score1}</span>
       <span class="pill">Score 2 · ${rv.score2==null?"—":rv.score2}</span>
       <span class="pill">Quarterly · ${rv.quarterly==null?"—":rv.quarterly.toFixed(2)}</span>
       <span class="pill">${esc(rv.recommendation||"no recommendation")}</span></p>
    <h3>The impact this person created — coach's verified summary</h3><p>${nl2(rv.impactSummary||"—")}</p>
    <h3>Development needs and the support to be provided</h3><p>${nl2(rv.developmentNeeds||"—")}</p>
    ${rv.memberComment?`<h3>Team member comment, verbatim</h3><p>${nl2(rv.memberComment)}</p>`:""}
    <div class="sig"><div>Coach: ${esc(user(rv.coachId).name)} · ${fmtDT(rv.coachSignedAt)}</div>
      <div>${esc(S.settings.approverLabel)}: ${fmtDT(rv.approverSignedAt)}</div>
      <div>Acknowledged: ${fmtDT(rv.memberAckAt)}</div></div>
    <h3>Conversation record</h3>${th(rv.transcript||[])}
  </div>`).join("") : `<p class="muted">No scoring recorded.</p>`}

  <h2>5 · Scores</h2>
  <table><thead><tr>${c.quarters.map(q=>`<th>${esc(q.label)}</th>`).join("")}<th>Half-yearly</th></tr></thead>
  <tbody><tr>${c.quarters.map(q=>{const rv=reviewOf(userId,q.id,c.id); return `<td class="num">${rv&&rv.released?rv.quarterly.toFixed(2):"—"}</td>`;}).join("")}
    <td class="num"><strong>${r.half!=null?r.half.toFixed(2):"—"}</strong></td></tr></tbody></table>
  <p class="muted" style="font-size:12px">Half-yearly = the plain average of the quarterly scores. Quarterly = (Score 1 × ${c.weights.okr}) + (Score 2 × ${c.weights.comp}). Score 1 is the goal-score average converted on the published bands; Score 2 is the coach's single competency rating out of 5.</p>

  <h2>6 · Full conversation transcript, in order</h2>
  ${r.transcript.length? r.transcript.map(t=>`<div class="msg ${t.role==="member"?"member":""}">
    <div class="h"><strong>${esc(t.author)}</strong> · ${esc(t.role)} · ${esc(t.record)} · ${esc(t.ref)} · ${fmtDT(t.ts)}</div>${nl2(t.text)}</div>`).join("")
  :`<p class="muted">No transcript entries.</p>`}`;
}

export function fullBookHTML(){
  const c = cycle(), people = visibleUsers();
  const whose = canDownloadAll() ? "complete programme record" : "record book — my team";
  return `<div class="band"><div class="t">${esc(S.product.name)} · ${esc(whose)}</div>
    <h1 style="color:#fff;margin-top:8px">${esc(c.name)}</h1>
    <div style="color:#B7D6D3">${fmtDate(c.start)} – ${fmtDate(c.end)} · ${people.length} people · generated ${fmtDT(nowISO())}</div></div>
    ${people.map(u=>personBookHTML(u.id, c.id)).join('<div style="page-break-after:always"></div>')}`;
}

export function printDoc(title, inner){
  const html = reportShell(title, inner);
  const w = window.open("", "_blank");
  if (w && w.document){
    w.document.write(html); w.document.close();
    setTimeout(()=>{ try{ w.print(); }catch(e){} }, 500);
  } else {
    download(title.replace(/[^\w]+/g,"_")+".html", html, "text/html");
    toast("Pop-ups are blocked here — the document downloaded instead.");
  }
}

/* ---------- CSV builders ---------- */
export function csvOf(kind){
  const c = cycle(), rows = [];
  /* One gate for every file: an administrator gets the programme, a coach
     gets themselves and their coachees, nobody gets anybody else. */
  const ids = visibleUserIds();
  const mine = x => ids.has(x.userId);
  if (kind==="charters"){
    rows.push(["Person","Unit","Coach","Cycle","Status","Objective","Key result","Baseline","Target","Data source",
      ...c.quarters.flatMap(q=>[q.id+" actuals", q.id+" score"]), "Coach note","Approved on","Approval note"]);
    S.charters.filter(x=>x.cycleId===c.id && mine(x)).forEach(ch=>{
      const u = user(ch.userId);
      ch.goals.forEach(g=>rows.push([u.name,u.unit,user(ch.coachId).name,c.name,ch.status,g.objective,g.kr,g.baseline,g.target,g.source,
        ...c.quarters.flatMap(q=>[(g.actuals&&g.actuals[q.id])||"", (g.scores&&g.scores[q.id])!=null?g.scores[q.id]:""]),
        ch.coachNote||"", ch.approvedAt||"", ch.approverNote||""]));
      ch.competencies.forEach(cp=>rows.push([u.name,u.unit,user(ch.coachId).name,c.name,ch.status,"COMPETENCY — "+(cp.fixed?"fixed":"chosen"),cp.name,"","",cp.commitment||"",
        ...c.quarters.flatMap(()=>["",""]),"","",""]));
    });
  }
  if (kind==="checkins"){
    rows.push(["Person","Unit","Coach","Cycle","Check-in no.","Date","Open","Goals","Reality","Way forward","Coach signed","Member signed","Transcript entries"]);
    S.checkins.filter(x=>x.cycleId===c.id && mine(x)).forEach(ci=>{
      const u = user(ci.userId);
      rows.push([u.name,u.unit,user(ci.coachId).name,c.name,ci.no,ci.date,ci.open,ci.goals,ci.reality,ci.forward,
        ci.coachSignedAt||"", ci.memberAckAt||"", (ci.transcript||[]).length]);
    });
  }
  if (kind==="impacts"){
    rows.push(["Person","Unit","Coach","Cycle","Period","Shared on","Impact created — results against goals","Competency commitments lived"]);
    S.impacts.filter(x=>x.cycleId===c.id && mine(x)).forEach(im=>{
      const u = user(im.userId);
      rows.push([u.name,u.unit,user(u.coachId).name,c.name,im.period,im.submittedAt||"not shared",im.results,im.behaviours]);
    });
  }
  if (kind==="reviews"){
    rows.push(["Person","Unit","Coach","Cycle","Period","Goal-score average","Score 1","Score 2","Quarterly score","Half-yearly score",
      "Impact summary (coach)","Development needs","Recommendation","Coach signed","Approver signed","Acknowledged","Member comment"]);
    S.reviews.filter(x=>x.cycleId===c.id && mine(x)).forEach(r=>{
      const u = user(r.userId), ch = charterOf(r.userId,c.id);
      const avg = goalAverage(ch?ch.goals:[], r.period);
      rows.push([u.name,u.unit,user(r.coachId).name,c.name,r.period, avg==null?"":avg.toFixed(3), r.score1==null?"":r.score1, r.score2==null?"":r.score2,
        r.quarterly==null?"":r.quarterly, halfYearScore(r.userId,c.id)||"", r.impactSummary,r.developmentNeeds,r.recommendation,
        r.coachSignedAt||"", r.approverSignedAt||"", r.memberAckAt||"", r.memberComment||""]);
    });
  }
  if (kind==="transcript"){
    rows.push(["Person","Record","Reference","Timestamp","Author","Role","Entry"]);
    transcriptLines(null,c.id).forEach(t=>rows.push([t.person,t.record,t.ref,t.ts,t.author,t.role,t.text]));
  }
  if (kind==="audit"){
    rows.push(["Timestamp","Who","Action","Detail"]);
    S.audit.forEach(a=>rows.push([a.ts, user(a.userId).name, a.action, a.detail]));
  }
  return toCSV(rows);
}

