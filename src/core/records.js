/* =====================================================================
   RECORD ASSEMBLY
   Gathers one person's whole file — charter, check-ins, impact statements,
   scores and conversation transcript — for the on-screen record page and
   for every download.

   These two functions are scope-aware on purpose: they are the single
   funnel every export goes through, so a person outside the caller's
   scope yields nothing rather than leaking a partial record.
   ===================================================================== */

import { S } from "../core/state.js";
import { user, cycle, charterOf, checkinsOf, impactOf, reviewOf, halfYearScore } from "../core/domain.js";
import { canView, visibleUserIds } from "../core/access.js";

/* ---------- Record assembly ---------- */
export function transcriptLines(userId, cycleId){
  /* A named person must be in scope; an unnamed sweep is limited to it. */
  if (userId && !canView(userId)) return [];
  const scope = visibleUserIds();
  const inScope = id => scope.has(id);
  const out = [];
  const push = (rec, kind, ref) => (rec.transcript||[]).forEach(t=>out.push({
    person: user(rec.userId).name, personId: rec.userId, cycle: cycleId, record: kind, ref,
    ts: t.ts, author: t.author, role: t.role, text: t.text
  }));
  S.checkins.filter(x=>x.cycleId===cycleId && inScope(x.userId) && (!userId||x.userId===userId)).forEach(x=>push(x,"Monthly check-in",`Check-in ${x.no} · ${x.date}`));
  S.impacts.filter(x=>x.cycleId===cycleId && inScope(x.userId) && (!userId||x.userId===userId)).forEach(x=>push(x,"Impact statement",x.period));
  S.reviews.filter(x=>x.cycleId===cycleId && inScope(x.userId) && (!userId||x.userId===userId)).forEach(x=>push(x,"Quarterly scoring",x.period));
  return out.sort((a,b)=> a.ts<b.ts?-1:1);
}

export function personRecord(userId, cycleId){
  if (!canView(userId)) return null;
  const c = cycle(cycleId), u = user(userId);
  return {
    person:u, cycle:c, coach:user(u.coachId),
    charter: charterOf(userId,c.id),
    checkins: checkinsOf(userId,c.id),
    impacts: c.quarters.map(q=>impactOf(userId,q.id,c.id)).filter(Boolean),
    reviews: c.quarters.map(q=>reviewOf(userId,q.id,c.id)).filter(Boolean),
    transcript: transcriptLines(userId,c.id),
    half: halfYearScore(userId,c.id)
  };
}