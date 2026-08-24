/* =====================================================================
   CSV EXPORTS
   One row per record, scoped to what the signed-in person may read:
   an administrator gets the whole organisation, a coach gets themselves
   and their coachees, a team member gets themselves.
   ===================================================================== */

import { S } from "../core/state.js";
import { toCSV } from "../core/helpers.js";
import { user, cycle, charterOf, reviewOf, goalAverage, halfYearScore } from "../core/domain.js";
import { transcriptLines } from "../core/records.js";
import { scopeRecords, canDownloadAll, visibleUsers } from "../core/access.js";

/* ---------- CSV builders ---------- */
export function csvOf(kind){
  const c = cycle(), rows = [];
  if (kind==="charters"){
    rows.push(["Person","Unit","Coach","Cycle","Status","Objective","Key result","Baseline","Target","Data source",
      ...c.quarters.flatMap(q=>[q.id+" actuals", q.id+" score"]), "Coach note","Approved on","Approval note"]);
    scopeRecords(S.charters).filter(x=>x.cycleId===c.id).forEach(ch=>{
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
    scopeRecords(S.checkins).filter(x=>x.cycleId===c.id).forEach(ci=>{
      const u = user(ci.userId);
      rows.push([u.name,u.unit,user(ci.coachId).name,c.name,ci.no,ci.date,ci.open,ci.goals,ci.reality,ci.forward,
        ci.coachSignedAt||"", ci.memberAckAt||"", (ci.transcript||[]).length]);
    });
  }
  if (kind==="impacts"){
    rows.push(["Person","Unit","Coach","Cycle","Period","Shared on","Impact created — results against goals","Competency commitments lived"]);
    scopeRecords(S.impacts).filter(x=>x.cycleId===c.id).forEach(im=>{
      const u = user(im.userId);
      rows.push([u.name,u.unit,user(u.coachId).name,c.name,im.period,im.submittedAt||"not shared",im.results,im.behaviours]);
    });
  }
  if (kind==="reviews"){
    rows.push(["Person","Unit","Coach","Cycle","Period","Goal-score average","Score 1","Score 2","Quarterly score","Half-yearly score",
      "Impact summary (coach)","Development needs","Recommendation","Coach signed","Approver signed","Acknowledged","Member comment"]);
    scopeRecords(S.reviews).filter(x=>x.cycleId===c.id).forEach(r=>{
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
    /* The activity log covers everyone's actions, so it is admin-only. */
    if (!canDownloadAll()) return null;
    rows.push(["Timestamp","Who","Action","Detail"]);
    S.audit.forEach(a=>rows.push([a.ts, user(a.userId).name, a.action, a.detail]));
  }
  if (kind==="people"){
    rows.push(["Name","Email","Position","Unit","Level (YAL)","Employment type","Role","Team leader","Coach","Coachees"]);
    visibleUsers().forEach(u=>rows.push([u.name, u.email||"", u.title, u.unit, u.level==null?"":u.level,
      u.employment||"", u.role, u.leaderId?user(u.leaderId).name:"", u.coachId?user(u.coachId).name:"",
      S.users.filter(x=>x.coachId===u.id).length]));
  }
  if (kind==="scores"){
    rows.push(["Name","Unit","Level (YAL)","Coach",
      ...c.quarters.flatMap(q=>[q.id+" score 1", q.id+" score 2", q.id+" quarterly"]),
      "Half-yearly","Recommendation"]);
    visibleUsers().forEach(u=>{
      const last = c.quarters.map(q=>reviewOf(u.id,q.id,c.id)).filter(r=>r&&r.released).pop();
      rows.push([u.name, u.unit, u.level==null?"":u.level, u.coachId?user(u.coachId).name:"",
        ...c.quarters.flatMap(q=>{
          const r = reviewOf(u.id,q.id,c.id);
          const rel = r && r.released;
          return [rel&&r.score1!=null?r.score1:"", rel&&r.score2!=null?r.score2:"", rel&&r.quarterly!=null?r.quarterly:""];
        }),
        halfYearScore(u.id,c.id) ?? "", last ? (last.recommendation||"") : ""]);
    });
  }
  return toCSV(rows);
}
