/* =====================================================================
   ACCESS — who may see and download what
   One rule, applied everywhere:

     admin   the whole programme — every person, every record, every export
     coach   themselves and the people they coach — nobody else
     member  themselves only

   Every screen that shows another person's record, and every download,
   goes through visibleUserIds() / canView(). The navigation hides what a
   person may not open; the router refuses it as well, so a hand-typed
   route cannot get past this.

   Honest limitation: with no server, this is enforcement in the browser.
   It scopes what the application shows and exports, which is what a
   performance record needs day to day — but it is not a security
   boundary against someone editing their own browser's storage. The
   moment there is a backend, move these same checks behind it.
   ===================================================================== */

import { S } from "./state.js";
import { me, isAdmin, isCoach, coacheesOf, user } from "./domain.js";

/* The people the signed-in person may see, in roster order. */
export function visibleUsers(){
  const u = me();
  if (u.role === "admin") return S.users.slice();
  if (u.role === "coach") return S.users.filter(x => x.id === u.id || x.coachId === u.id);
  return S.users.filter(x => x.id === u.id);
}

export function visibleUserIds(){
  return new Set(visibleUsers().map(u => u.id));
}

export function canView(userId){
  return visibleUserIds().has(userId);
}

/* True when the signed-in person may download whole-programme files. */
export function canDownloadAll(){ return isAdmin(); }

/* What a download covers, for labelling the screen honestly. */
export function downloadScopeLabel(){
  const u = me();
  if (u.role === "admin") return "the whole programme";
  const n = coacheesOf(u.id).length;
  return `you and the ${n} ${n === 1 ? "person" : "people"} you coach`;
}

/* Keeps a list of records to what the signed-in person may see.
   `pick` pulls the person's id out of a record; the default suits
   charters, check-ins, impact statements and reviews alike. */
export function scopeRecords(list, pick = r => r.userId){
  const ids = visibleUserIds();
  return list.filter(r => ids.has(pick(r)));
}

/* Screens a role may open at all. Anything not listed is open to everyone
   who is signed in (their own screens, the library, the documentation). */
const ROUTE_ROLES = {
  coachees:"coach", coachee:"coach", approvals:"coach", scoring:"coach",
  review:"coach", checkin:"coach", exports:"coach",
  dash:"admin", people:"admin", cycles:"admin"
};

export function canOpenRoute(route){
  const need = ROUTE_ROLES[route];
  if (!need) return true;
  return need === "admin" ? isAdmin() : isCoach();
}

/* The panel shown instead of a screen somebody may not open. */
export function deniedHTML(what){
  const u = me();
  return `<div class="empty">
    <h3>Not yours to open</h3>
    <div class="small">${what || "This record"} sits outside what a ${u.role === "member" ? "team member" : u.role} can see.
    You see your own record${u.role === "member" ? "" : " and the records of the people you coach"} —
    everything else belongs to that person, their coach and ${S.settings.approverLabel}.</div>
    <div class="row mt16" style="justify-content:center"><button class="btn" data-act="go" data-route="home">Back to my overview</button></div>
  </div>`;
}

/* Used by the coach's own record screens: the coach of a person, by name. */
export const coachName = userId => user(user(userId).coachId).name;
