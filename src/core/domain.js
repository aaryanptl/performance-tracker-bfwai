/* ---------- Domain logic — people, cycles, records and score maths ---------- */
import { S } from "./state.js";
import { esc, uid, nowISO } from "./helpers.js";
import { LIB } from "../data/library.js";
import { BANDS, FIXED_COMPETENCIES, COACH_FIXED_THIRD } from "../data/constants.js";

export const user = id => S.users.find(u=>u.id===id) || {name:"—",role:"—"};
export const me = () => user(S.session.userId);
export const isAdmin = () => me().role === "admin";
export const isCoach = () => me().role === "coach" || isAdmin();
export const cycle = id => S.cycles.find(c=>c.id===(id||S.session.cycleId)) || S.cycles[0];
export const coacheesOf = id => S.users.filter(u=>u.coachId===id);

export const charterOf = (userId, cycleId) =>
  S.charters.find(c=>c.userId===userId && c.cycleId===(cycleId||S.session.cycleId));
export const reviewOf = (userId, period, cycleId) =>
  S.reviews.find(r=>r.userId===userId && r.period===period && r.cycleId===(cycleId||S.session.cycleId));
export const impactOf = (userId, period, cycleId) =>
  S.impacts.find(i=>i.userId===userId && i.period===period && i.cycleId===(cycleId||S.session.cycleId));
export const checkinsOf = (userId, cycleId) =>
  S.checkins.filter(c=>c.userId===userId && c.cycleId===(cycleId||S.session.cycleId)).sort((a,b)=>a.no-b.no);

export function bandFor(avg){
  if (avg==null || isNaN(avg)) return null;
  return BANDS.find(b=>avg>=b.min).score;
}
export function goalAverage(goals, period){
  const vals = (goals||[]).map(g=>g.scores && g.scores[period]).filter(v=>typeof v==="number");
  if (!vals.length) return null;
  return vals.reduce((a,b)=>a+b,0)/vals.length;
}
export function quarterly(s1, s2, cyc){
  if (s1==null || s2==null) return null;
  const w = (cyc||cycle()).weights;
  return +(s1*w.okr + s2*w.comp).toFixed(2);
}
export function halfYearScore(userId, cycleId){
  const c = cycle(cycleId);
  const qs = c.quarters.map(q=>{ const r=reviewOf(userId,q.id,c.id); return r && r.released ? r.quarterly : null; });
  if (qs.some(v=>v==null)) return null;
  return +(qs.reduce((a,b)=>a+b,0)/qs.length).toFixed(2);
}
export function annualScore(userId){
  const hs = S.cycles.map(c=>halfYearScore(userId,c.id)).filter(v=>v!=null);
  if (hs.length < S.cycles.length || !hs.length) return null;
  return +(hs.reduce((a,b)=>a+b,0)/hs.length).toFixed(2);
}
export function charterStatusTag(ch){
  if (!ch) return `<span class="tag grey">Not started</span>`;
  const m = {
    draft:        `<span class="tag grey">Draft</span>`,
    coach_review: `<span class="tag amber">With coach</span>`,
    returned:     `<span class="tag red">Returned for edits</span>`,
    approval:     `<span class="tag amber">Awaiting approval</span>`,
    approved:     `<span class="tag green">Approved · locked</span>`
  };
  return m[ch.status] || `<span class="tag grey">${esc(ch.status)}</span>`;
}
export function competencyMeta(name){
  return LIB.competencies.find(c=>c.name===name) || null;
}
export function requiredFixed(u){
  const third = u.role==="coach" || u.role==="admin" ? COACH_FIXED_THIRD : FIXED_COMPETENCIES[2];
  return [FIXED_COMPETENCIES[0], FIXED_COMPETENCIES[1], third];
}
export function logAudit(action, detail){
  S.audit.unshift({id:uid("a"), ts:nowISO(), userId:S.session.userId, action, detail});
  S.audit = S.audit.slice(0,500);
}
export function addTranscript(rec, text, kind){
  if (!text || !text.trim()) return;
  rec.transcript = rec.transcript || [];
  rec.transcript.push({
    id:uid("t"), ts:nowISO(), authorId:S.session.userId,
    author:me().name, role:me().role, kind:kind||"note", text:text.trim()
  });
}
