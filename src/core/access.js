/* =====================================================================
   ACCESS CONTROL
   One place that answers "who is this person allowed to see and download?"

     admin  — the whole organisation. Every record, every score, every
              download, plus the programme dashboard, people admin and
              the org-wide backup.
     coach  — themselves and the people they coach. Nothing else: not
              another coach's coachees, not org-wide rollups, not the
              full record book, not the JSON backup.
     member — themselves only.

   Every view, every record page and every export path runs through
   `visibleUserIds` / `canView` / `canDownload` below, so a scope can
   never be widened by guessing a URL or a data-id on a button.
   ===================================================================== */

import { S } from "./state.js";
import { me, user, coacheesOf, isAdmin } from "./domain.js";
import { esc } from "./helpers.js";

/* ---------- the scope itself ---------- */

/** Ids the given actor may read. Admin gets everyone; a coach gets
 *  themselves plus their direct coachees; anyone else gets themselves. */
export function visibleUserIds(actorId) {
  const id = actorId || S.session.userId;
  const u = user(id);
  if (u.role === "admin") return new Set(S.users.map(x => x.id));
  const ids = new Set([id]);
  if (u.role === "coach") coacheesOf(id).forEach(c => ids.add(c.id));
  return ids;
}

/** The same scope as user records, in roster order. */
export function visibleUsers(actorId) {
  const ids = visibleUserIds(actorId);
  return S.users.filter(u => ids.has(u.id));
}

/** People in scope who are not the actor — i.e. the coachees. */
export function visibleOthers(actorId) {
  const id = actorId || S.session.userId;
  return visibleUsers(id).filter(u => u.id !== id);
}

export function canView(userId, actorId) {
  return visibleUserIds(actorId).has(userId);
}

/** Downloads follow visibility exactly: you may export what you may read. */
export const canDownload = (userId, actorId) => canView(userId, actorId);

/** Org-wide artefacts — full record book, JSON backup, activity log,
 *  programme-wide rollups. Administrators only. */
export const canDownloadAll = () => isAdmin();

/* ---------- record-level filters ---------- */

/** Keep only the records belonging to people in the actor's scope. */
export function scopeRecords(list, actorId) {
  const ids = visibleUserIds(actorId);
  return (list || []).filter(r => ids.has(r.userId));
}

/* ---------- routes ---------- */

/** Routes an administrator alone may open. `exports` is deliberately not
 *  here: coaches reach it too, but see only their own scope inside it. */
const ADMIN_ONLY_ROUTES = new Set(["dash", "people", "cycles"]);
const COACH_ROUTES = new Set(["coachees", "coachee", "approvals", "scoring", "review", "checkin", "exports"]);

export function canRoute(route) {
  const role = me().role;
  if (role === "admin") return true;
  if (ADMIN_ONLY_ROUTES.has(route)) return false;
  if (COACH_ROUTES.has(route)) return role === "coach";
  return true;
}

/* ---------- UI ---------- */

/** A short sentence describing what the signed-in person can see. Shown on
 *  the records page and the coachee list so the limit is never a surprise. */
export function scopeLabel(actorId) {
  const id = actorId || S.session.userId;
  const u = user(id);
  if (u.role === "admin") return "You are an administrator: you can read and download every person's record.";
  if (u.role === "coach") {
    const n = coacheesOf(id).length;
    return `You can see your own record and the ${n} ${n === 1 ? "person" : "people"} you coach. Other people's records are not available to you.`;
  }
  return "You can see your own record. Other people's records are not available to you.";
}

/** Rendered in place of a view when someone reaches a record outside their
 *  scope — by an old link, a stale tab, or after their coachees change. */
export function deniedPanel(what) {
  return `
  <div class="card">
    <div class="card-head"><h2>Not available to you</h2><span class="tag red">Restricted</span></div>
    <p class="small">${esc(what || "This record")} sits outside what your role can open.</p>
    <div class="small muted mb16">${esc(scopeLabel())}</div>
    <button class="btn" data-act="go" data-route="home">Back to my overview</button>
  </div>`;
}
