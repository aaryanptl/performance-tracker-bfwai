/* =====================================================================
   ACTIONS — every button in the application resolves to one of these.
   The dispatcher in main.js reads data-act off the clicked element.

   Actions that touch somebody else's record check access first: the
   screens hide what a person may not see, the router refuses the route,
   and these refuse the action.
   ===================================================================== */
import { S, UI, save, setS, seed, syncRoster as applyRoster } from "./state.js";
import { uid, esc, nl2, today, nowISO, fmtDate, fmtDT, download, toCSV } from "./helpers.js";
import { UNITS, CHECKIN_STAGES } from "./config.js";
import { LIB } from "./data/library.js";
import { user, me, isAdmin, isCoach, cycle, coacheesOf, charterOf, reviewOf, impactOf,
         checkinsOf, bandFor, goalAverage, quarterly, halfYearScore, requiredFixed,
         logAudit, addTranscript } from "./domain.js";
import { canView, canDownloadAll, visibleUsers } from "./access.js";
import { openModal, closeModal, toast, confirmBox } from "./ui.js";
import { go, render } from "./router.js";
import { modalOKR, modalComp, modalCompInfo } from "./views/modals.js";
import { reportShell, personBookHTML, fullBookHTML, printDoc, csvOf } from "./reports.js";
import { transcriptLines } from "./views/records.js";
import { signIn, signOut as endSession, renderSignIn } from "./auth.js";

/* ---------- 12. ACTIONS ---------- */
export const A = {
  go:d=>go(d.route, {id:d.id, q:d.q}),
  openNav:()=>{ UI.sidebar=true; render(); },
  closeNav:()=>{ UI.sidebar=false; render(); },
  closeModal, closeModalBg:(d,el,e)=>{ if (e.target.classList.contains("modal-bg")) closeModal(); },

  /* access */
  doSignIn: ()=>{
    const email = (UI.draft.signinEmail || document.getElementById("signin-email")?.value || "").trim();
    if (!email) return renderSignIn("Enter your email to continue.");
    const u = signIn(email);
    if (!u) return renderSignIn(`${email} is not on the roster.`);
    UI.draft = {};
    go("home");
  },
  signOut: ()=>{
    endSession();
    UI.draft = {}; UI.route = "home"; UI.params = {};
    renderSignIn();
  },
  lib: d=>go("library",{tab:d.tab, unit:d.unit}),

  /* charter */
  newCharter: ()=>{
    const u = me(), fixed = requiredFixed(u);
    const ch = {id:uid("ch"), userId:u.id, cycleId:S.session.cycleId, coachId:u.coachId, status:"draft",
      createdAt:nowISO(), goals:[], competencies:fixed.map(n=>({name:n, fixed:true, commitment:""}))};
    S.charters.push(ch); logAudit("Charter started", u.name); save(); render();
  },
  pickOKR: modalOKR,
  okrUnit: (d,el)=>{ UI.draft.okrUnit = el.value; modalOKR(); },
  addOKRGoal: d=>{
    const o = LIB.okrs[+d.i], ch = charterOf(S.session.userId);
    if (ch.goals.length >= cycle().maxGoals) return toast(`Maximum ${cycle().maxGoals} goals.`);
    ch.goals.push({id:uid("g"), objective:o.objective, kr:o.kr, baseline:"", target:"", source:o.source, actuals:{}, scores:{}});
    save(); closeModal(); render(); toast("Goal added — now set your baseline and target.");
  },
  addCustomGoal: d=>{
    const ch = S.charters.find(x=>x.id===d.id) || charterOf(S.session.userId);
    if (ch.goals.length >= cycle().maxGoals) return toast(`Maximum ${cycle().maxGoals} goals.`);
    ch.goals.push({id:uid("g"), objective:"My objective", kr:"", baseline:"", target:"", source:"", actuals:{}, scores:{}});
    save(); render();
  },
  addCustomGoalFromModal: ()=>{ closeModal(); A.addCustomGoal({}); },
  delGoal: d=>{ const ch = S.charters.find(x=>x.id===d.id); ch.goals = ch.goals.filter(g=>g.id!==d.gid); save(); render(); },
  pickComp: modalComp,
  compUnit: (d,el)=>{ UI.draft.compUnit = el.value; modalComp(); },
  addComp: d=>{
    const ch = charterOf(S.session.userId);
    if (ch.competencies.length >= cycle().competencies) return toast(`You already have ${cycle().competencies} competencies. Change one first.`);
    if (ch.competencies.some(c=>c.name.toLowerCase()===d.name.toLowerCase())) return toast("That one is already on your charter.");
    ch.competencies.push({name:d.name, fixed:false, commitment:""});
    save(); closeModal(); render(); toast("Added — now write your one-line commitment.");
  },
  addCustomComp: ()=>{
    const name = (UI.draft.customComp||"").trim();
    const ch = charterOf(S.session.userId);
    if (!name) return toast("Give your competency a name first.");
    if (ch.competencies.length >= cycle().competencies) return toast(`You already have ${cycle().competencies} competencies. Change one first.`);
    if (ch.competencies.some(c=>c.name.toLowerCase()===name.toLowerCase())) return toast("You already have a competency with that name.");
    ch.competencies.push({name, fixed:false, custom:true, commitment:""});
    UI.draft.customComp = "";
    save(); closeModal(); render(); toast("Added — now write your one-line commitment.");
  },
  delComp: d=>{ const ch = S.charters.find(x=>x.id===d.id); ch.competencies = ch.competencies.filter(c=>c.name!==d.name); save(); render(); },
  compInfo: d=>modalCompInfo(d.name),
  submitCharter: d=>{
    const ch = S.charters.find(x=>x.id===d.id), c = cycle();
    const problems = [];
    if (!ch.goals.length) problems.push("Add at least one goal.");
    ch.goals.forEach((g,i)=>{
      if (!g.kr) problems.push(`Goal ${i+1} has no key result.`);
      if (!g.target) problems.push(`Goal ${i+1} has no target.`);
      if (!g.source) problems.push(`Goal ${i+1} has no data source — every goal must be verifiable.`);
    });
    if (ch.competencies.length < c.competencies) problems.push(`Choose ${c.competencies - ch.competencies.length} more competenc${c.competencies-ch.competencies.length===1?"y":"ies"}.`);
    ch.competencies.forEach(cp=>{ if(!cp.commitment) problems.push(`${cp.name} has no one-line commitment.`); });
    if (problems.length) return openModal({title:"Not ready to send yet", body:`<p class="small muted">A charter goes to your coach complete — that is what makes the review useful.</p>
      <ul class="mt12">${problems.map(p=>`<li class="small">${esc(p)}</li>`).join("")}</ul>`});
    ch.status = "coach_review"; ch.submittedAt = nowISO(); ch.coachId = me().coachId;
    logAudit("Charter sent for review", me().name); save(); closeModal(); render();
    toast("Sent to your coach.");
  },
  coachApprove: d=>{
    const ch = S.charters.find(x=>x.id===d.id);
    if (!canView(ch.userId)) return toast("That charter belongs to another coach's coachee.");
    ch.coachNote = UI.draft["note_"+ch.id] || ch.coachNote || "Reviewed — targets and data sources confirmed.";
    ch.coachSignedAt = nowISO(); ch.coachId = S.session.userId; ch.status = "approval";
    logAudit("Charter review signed", user(ch.userId).name); save(); render(); toast("Signed and sent for approval.");
  },
  returnCharter: d=>{
    const ch = S.charters.find(x=>x.id===d.id);
    if (!canView(ch.userId)) return toast("That charter belongs to another coach's coachee.");
    const note = UI.draft["note_"+ch.id];
    if (!note) return toast("Write what needs to change before returning it.");
    ch.coachNote = note; ch.status = "returned";
    logAudit("Charter returned", user(ch.userId).name); save(); render(); toast("Returned with your note.");
  },
  finalApprove: d=>{
    if (!isAdmin()) return toast(`Final approval is ${S.settings.approverLabel}'s signature.`);
    const ch = S.charters.find(x=>x.id===d.id);
    ch.approverNote = UI.draft["note_"+ch.id] || "Approved.";
    ch.approvedAt = nowISO(); ch.approvedBy = S.session.userId; ch.status = "approved";
    logAudit("Charter approved", user(ch.userId).name); save(); render(); toast("Approved and locked for the cycle.");
  },
  printCharter: d=>{
    const ch = S.charters.find(x=>x.id===d.id), u = user(ch.userId), c = cycle(ch.cycleId);
    printDoc(`Goal Charter — ${u.name}`, `<div class="band"><div class="t">${esc(c.name)} · Goal Charter</div>
      <h1 style="color:#fff;margin-top:8px">${esc(u.name)}</h1><div style="color:#B7D6D3">${esc(u.unit)} · coach ${esc(user(ch.coachId).name)}</div></div>
      <table><thead><tr><th>Objective</th><th>Key result</th><th>Baseline</th><th>Target</th><th>Data source</th></tr></thead>
      <tbody>${ch.goals.map(g=>`<tr><td>${esc(g.objective)}</td><td>${esc(g.kr)}</td><td>${esc(g.baseline)}</td><td>${esc(g.target)}</td><td>${esc(g.source)}</td></tr>`).join("")}</tbody></table>
      <h2>Competency commitments</h2><table><thead><tr><th>Competency</th><th>Commitment</th></tr></thead>
      <tbody>${ch.competencies.map(cp=>`<tr><td>${esc(cp.name)}</td><td>${esc(cp.commitment)}</td></tr>`).join("")}</tbody></table>
      <div class="sig"><div>Coach review: ${fmtDT(ch.coachSignedAt)}</div><div>${esc(S.settings.approverLabel)} approval: ${fmtDT(ch.approvedAt)}</div></div>`);
  },

  /* impact */
  saveImpact: d=>{ ensureImpact(d.q); save(); render(); toast("Draft saved."); },
  shareImpact: d=>{
    const im = ensureImpact(d.q);
    if (!im.results && !im.behaviours) return toast("Write your impact before sharing it.");
    im.submittedAt = nowISO(); logAudit("Impact statement shared", `${me().name} · ${d.q}`); save(); render();
    toast(`Shared with ${user(me().coachId).name}.`);
  },
  postImpact: d=>{ const im = S.impacts.find(x=>x.id===d.id); addTranscript(im, UI.draft["post_"+d.id]); UI.draft["post_"+d.id]=""; save(); render(); },
  printImpact: d=>{
    const im = impactOf(S.session.userId, d.q); const u = me();
    printDoc(`Impact Statement — ${u.name} ${d.q}`, `<div class="band"><div class="t">Impact statement · ${esc(d.q)}</div>
      <h1 style="color:#fff;margin-top:8px">${esc(u.name)}</h1></div>
      <h2>Impact created — results against goals</h2><p>${nl2(im.results)}</p>
      <h2>Competency commitments lived</h2><p>${nl2(im.behaviours)}</p>
      <p class="muted">Shared ${fmtDT(im.submittedAt)}</p>`);
  },

  /* check-ins */
  newCheckin: d=>{
    if (!canView(d.id)) return toast("You can only record a check-in for someone you coach.");
    const uId = d.id, c = cycle();
    const no = checkinsOf(uId).length + 1;
    if (no > c.checkins) return toast(`This cycle has ${c.checkins} check-ins.`);
    const ci = {id:uid("ci"), userId:uId, coachId:S.session.userId, cycleId:c.id, no, date:today(),
      open:"", goals:"", reality:"", forward:"", transcript:[]};
    S.checkins.push(ci); logAudit("Check-in started", `${user(uId).name} · #${no}`); save(); go("checkin",{id:ci.id});
  },
  signCheckin: d=>{
    const ci = S.checkins.find(x=>x.id===d.id);
    if (!ci.goals && !ci.forward) return toast("Record the discussion and the way forward before signing.");
    ci.coachSignedAt = nowISO(); logAudit("Check-in signed by coach", `${user(ci.userId).name} · #${ci.no}`); save(); render();
    toast(`Shared with ${user(ci.userId).name} for signature.`);
  },
  signCheckinMember: d=>{
    const ci = S.checkins.find(x=>x.id===d.id);
    ci.memberAckAt = nowISO(); logAudit("Check-in signed by team member", `#${ci.no}`); save(); render(); toast("Signed.");
  },
  postCheckin: d=>{ const ci = S.checkins.find(x=>x.id===d.id); addTranscript(ci, UI.draft["post_"+d.id]); UI.draft["post_"+d.id]=""; save(); render(); },
  printCheckin: d=>{
    const ci = S.checkins.find(x=>x.id===d.id), u = user(ci.userId);
    printDoc(`Check-in ${ci.no} — ${u.name}`, `<div class="band"><div class="t">Monthly check-in ${ci.no} · ${fmtDate(ci.date)}</div>
      <h1 style="color:#fff;margin-top:8px">${esc(u.name)}</h1><div style="color:#B7D6D3">with ${esc(user(ci.coachId).name)}</div></div>
      ${CHECKIN_STAGES.map(s=>`<h2>${esc(s.t)}</h2><p>${nl2(ci[s.k]||"—")}</p>`).join("")}
      <div class="sig"><div>Coach signed: ${fmtDT(ci.coachSignedAt)}</div><div>Team member signed: ${fmtDT(ci.memberAckAt)}</div></div>
      <h2>Conversation record</h2>${(ci.transcript||[]).map(t=>`<div class="msg"><div class="h">${esc(t.author)} · ${esc(t.role)} · ${fmtDT(t.ts)}</div>${nl2(t.text)}</div>`).join("")||"<p class='muted'>No entries.</p>"}`);
  },

  /* scoring */
  openReview: d=>{
    if (!canView(d.uid)) return toast("You can only score someone you coach.");
    let r = reviewOf(d.uid, d.q);
    if (!r){
      const u = user(d.uid);
      r = {id:uid("rv"), userId:d.uid, coachId:u.coachId||S.session.userId, cycleId:S.session.cycleId, period:d.q,
        score1:null, score2:null, quarterly:null, impactSummary:"", developmentNeeds:"", recommendation:"",
        released:false, transcript:[], createdAt:nowISO()};
      S.reviews.push(r); logAudit("Scoring started", `${u.name} · ${d.q}`); save();
    }
    go("review",{id:r.id});
  },
  signReview: d=>{
    const r = S.reviews.find(x=>x.id===d.id), ch = charterOf(r.userId, r.cycleId), c = cycle(r.cycleId);
    const avg = goalAverage(ch?ch.goals:[], r.period);
    if (avg==null) return toast("Score every goal from its data source first.");
    if (r.score2==null) return toast("Record Score 2 — the competency rating.");
    if (!r.impactSummary || !r.developmentNeeds) return toast("Write the impact summary and the development needs.");
    r.score1 = bandFor(avg); r.quarterly = quarterly(r.score1, r.score2, c);
    r.goalAverage = +avg.toFixed(3); r.coachSignedAt = nowISO();
    logAudit("Score signed by coach", `${user(r.userId).name} · ${r.period} · ${r.quarterly}`); save(); render();
    toast("Signed. It now goes to calibration before release.");
  },
  releaseReview: d=>{
    if (!isAdmin()) return toast(`Calibration and release are ${S.settings.approverLabel}'s signature.`);
    const r = S.reviews.find(x=>x.id===d.id);
    r.approverSignedAt = nowISO(); r.released = true;
    logAudit("Score calibrated and released", `${user(r.userId).name} · ${r.period} · ${r.quarterly}`); save(); render();
    toast(`Released to ${user(r.userId).name}.`);
  },
  ackReview: d=>{
    const r = S.reviews.find(x=>x.id===d.id);
    r.memberComment = UI.draft["ack_"+r.id] || "";
    r.memberAckAt = nowISO();
    if (r.memberComment) addTranscript(r, r.memberComment, "acknowledgment");
    logAudit("Review acknowledged", `${me().name} · ${r.period}`); save(); render(); toast("Acknowledged.");
  },
  postReview: d=>{ const r = S.reviews.find(x=>x.id===d.id); addTranscript(r, UI.draft["post_"+d.id]); UI.draft["post_"+d.id]=""; save(); render(); },
  printReview: d=>{
    const r = S.reviews.find(x=>x.id===d.id), u = user(r.userId), c = cycle(r.cycleId);
    const im = impactOf(r.userId, r.period, r.cycleId);
    printDoc(`Quarterly review — ${u.name} ${r.period}`, `<div class="band"><div class="t">${esc(c.name)} · ${esc(r.period)} review</div>
      <h1 style="color:#fff;margin-top:8px">${esc(u.name)}</h1><div style="color:#B7D6D3">coach ${esc(user(r.coachId).name)}</div></div>
      <h2>Part 1 — Impact Statement (team member)</h2><p>${nl2(im?im.results:"—")}</p><p>${nl2(im?im.behaviours:"")}</p>
      <h2>Part 2 — Coach review</h2><h3>Impact created</h3><p>${nl2(r.impactSummary)}</p>
      <h3>Development needs</h3><p>${nl2(r.developmentNeeds)}</p>
      <h3>Score</h3><table><thead><tr><th>Score 1</th><th>Score 2</th><th>Quarterly</th><th>Recommendation</th></tr></thead>
      <tbody><tr><td class="num">${r.score1}</td><td class="num">${r.score2}</td><td class="num">${r.quarterly}</td><td>${esc(r.recommendation)}</td></tr></tbody></table>
      ${r.memberComment?`<h3>Team member comment, verbatim</h3><p>${nl2(r.memberComment)}</p>`:""}
      <div class="sig"><div>Coach: ${fmtDT(r.coachSignedAt)}</div><div>${esc(S.settings.approverLabel)}: ${fmtDT(r.approverSignedAt)}</div><div>Acknowledged: ${fmtDT(r.memberAckAt)}</div></div>`);
  },

  /* admin */
  addPerson: ()=>{
    const u = {id:uid("u"), name:"New person", email:"", role:"member", unit:UNITS[0], title:"",
               level:1, employment:"Full Time", coachId:null};
    S.users.push(u); logAudit("Person added", u.id); save(); render();
    toast("Added — give them an email, a unit and a coach.");
  },
  /* Re-reads src/data/roster.js: new joiners appear, allocations and roles
     are re-applied. No charter, check-in, statement or score is touched. */
  syncRoster: ()=>{
    applyRoster(); logAudit("Roster synced", `${S.users.length} people`); save(); render();
    toast("Roster re-applied from the roster file.");
  },
  delPerson: d=>{
    if (!isAdmin()) return toast("People are managed by the administrator.");
    if (d.id===S.session.userId) return toast("You cannot remove the person you are signed in as.");
    logAudit("Person removed", user(d.id).name);
    S.users = S.users.filter(u=>u.id!==d.id);
    S.users.forEach(u=>{ if (u.coachId===d.id) u.coachId=null; });
    save(); render();
  },
  addCycle: ()=>{
    const last = S.cycles[S.cycles.length-1];
    const n = S.cycles.length + 1;
    const c = JSON.parse(JSON.stringify(last));
    c.id = "C"+n; c.name = "Cycle "+n;
    c.quarters = [{id:"Q"+(n*2-1), label:`Q${n*2-1}`, scoreBy:"", review:false},
                  {id:"Q"+(n*2),   label:`Q${n*2}`,   scoreBy:"", review:true}];
    S.cycles.push(c); save(); render(); toast("Cycle added — set its dates.");
  },
  useCycle: d=>{ S.session.cycleId = d.id; save(); render(); },
  setCycle: (d,el)=>{ S.session.cycleId = el.value; save(); render(); },
  libUnit: (d,el)=>go("library",{tab:d.tab, unit:el.value}),

  /* downloads — csvOf() and fullBookHTML() are already scoped by access.js */
  csvCharters:()=>download(`charters_${cycle().name}.csv`, csvOf("charters"), "text/csv"),
  csvCheckins:()=>download(`checkins_${cycle().name}.csv`, csvOf("checkins"), "text/csv"),
  csvImpacts:()=>download(`impact_statements_${cycle().name}.csv`, csvOf("impacts"), "text/csv"),
  csvReviews:()=>download(`quarterly_scores_${cycle().name}.csv`, csvOf("reviews"), "text/csv"),
  csvTranscript:()=>download(`conversation_transcript_${cycle().name}.csv`, csvOf("transcript"), "text/csv"),
  csvAudit:()=>download(`activity_log.csv`, csvOf("audit"), "text/csv"),
  fullBook:()=>{
    const label = canDownloadAll() ? "record_book" : "record_book_my_team";
    logAudit("Record book downloaded", canDownloadAll() ? "whole programme" : `${visibleUsers().length} people`);
    save();
    download(`${label}_${cycle().name}.html`, reportShell(`${S.product.name} — ${cycle().name}`, fullBookHTML()), "text/html");
  },
  personBook:d=>{
    if (!canView(d.id)) return toast("That record is not yours to download.");
    const u=user(d.id);
    logAudit("Record downloaded", u.name); save();
    download(`record_${u.name.replace(/\W+/g,"_")}_${cycle().name}.html`,
      reportShell(`${u.name} — performance record`, personBookHTML(d.id, S.session.cycleId)), "text/html");
  },
  personCSV:d=>{
    if (!canView(d.id)) return toast("That record is not yours to download.");
    const rows = [["Person","Record","Reference","Timestamp","Author","Role","Entry"]];
    transcriptLines(d.id, S.session.cycleId).forEach(t=>rows.push([t.person,t.record,t.ref,t.ts,t.author,t.role,t.text]));
    download(`transcript_${user(d.id).name.replace(/\W+/g,"_")}.csv`, toCSV(rows), "text/csv");
  },
  exportJSON:()=>{
    if (!canDownloadAll()) return toast(`The full backup covers everyone — it is ${S.settings.hrLabel}'s to take.`);
    download(`ascend_backup_${today()}.json`, JSON.stringify(S,null,2), "application/json");
  },
  importJSON:()=>{
    if (!isAdmin()) return toast("Restoring a backup replaces everyone's records — administrators only.");
    const i = document.createElement("input"); i.type = "file"; i.accept = ".json";
    i.onchange = () => {
      const f = i.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try{
          const data = JSON.parse(rd.result);
          if (!data.users || !data.cycles) throw new Error("not an Ascend backup");
          setS(data); applyRoster(); save(); go("home"); toast("Backup restored.");
        }catch(e){ toast("That file is not an Ascend backup."); }
      };
      rd.readAsText(f);
    };
    i.click();
  },
  resetAll:()=>{
    if (!isAdmin()) return toast("Only an administrator can clear the programme.");
    confirmBox("Clear every record?",
      "Every charter, check-in, impact statement and score in this browser will be removed and the programme will start again from the roster. Download a backup first if you need one.",
      "Clear every record", "resetConfirm");
  },
  resetConfirm:()=>{
    const email = S.users.find(u=>u.id===S.session.userId)?.email;
    setS(seed());
    const back = S.users.find(u=>u.email===email);
    S.session.userId = back ? back.id : null;
    save(); closeModal(); go("home"); toast("Cleared — the roster is loaded and the cycle is open.");
  }
};

export function ensureImpact(period){
  let im = impactOf(S.session.userId, period);
  if (!im){
    im = {id:uid("im"), userId:S.session.userId, cycleId:S.session.cycleId, period,
      results:UI.draft["res_"+period]||"", behaviours:UI.draft["beh_"+period]||"", transcript:[], createdAt:nowISO()};
    S.impacts.push(im);
  }
  return im;
}
