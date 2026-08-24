/* =====================================================================
   ASCEND — Performance Management System
   Build Fast with AI · entry point

   Boot order: load any saved state, seed from the headcount report on a
   first run, migrate a state saved by an older build, then render.
   ===================================================================== */

import "./styles/app.css";

import { S, UI, setS, save, loadState } from "./core/state.js";
import { closeModal } from "./ui/modals.js";
import { render, go } from "./ui/shell.js";
import { modalOKR, modalComp } from "./ui/modals.js";
import { seed } from "./core/seed.js";
import { A } from "./actions.js";
import { ROSTER } from "./data/roster.js";

/* ---------- event delegation ---------- */

document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]");
  if (!t || t.tagName === "SELECT") return;
  const fn = A[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t.dataset, t, e); }
});

document.addEventListener("change", e => {
  const t = e.target.closest("[data-act]");
  if (!t || t.tagName !== "SELECT") return;
  const fn = A[t.dataset.act];
  if (fn) fn(t.dataset, t, e);
});

document.addEventListener("input", e => {
  const t = e.target;
  if (!t.dataset || !t.dataset.actInput) return;
  UI.draft[t.dataset.actInput] = t.value;
  clearTimeout(window._srch);
  window._srch = setTimeout(() => {
    if (t.dataset.actInput === "okrSearch") modalOKR();
    else if (t.dataset.actInput === "compSearch") modalComp();
    else if (t.dataset.actInput === "signInSearch") { render(); focusSearch(); }
  }, 260);
});

document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* Re-rendering the sign-in list loses focus; put the caret back where it was. */
function focusSearch() {
  const el = document.querySelector('[data-act-input="signInSearch"]');
  if (!el) return;
  const v = el.value;
  el.focus();
  try { el.setSelectionRange(v.length, v.length); } catch (err) { /* not a text input */ }
}

/* ---------- migration ---------- */

/** Bring a state saved by an earlier build up to the current shape rather
 *  than discarding the records already in it. */
function migrate(st) {
  if (!st.org) st.org = { name: "Build Fast with AI", period: "FY2026" };
  if (!st.session) st.session = { userId: null, cycleId: st.cycles[0].id };

  /* v1 shipped a demo roster. Replace it with the real one, but only when
     nothing has been written against those demo people yet. */
  const hasRecords = ["charters", "checkins", "impacts", "reviews"]
    .some(k => (st[k] || []).length);
  const isDemoRoster = st.users.some(u => u.id === "u_admin" || /^u_(m|c)\d+$/.test(u.id));
  if (isDemoRoster && !hasRecords) {
    st.users = ROSTER.map(u => ({ ...u }));
    st.session.userId = null;
  }

  /* Fields added after v1. */
  st.users.forEach(u => {
    if (u.email === undefined) u.email = "";
    if (u.level === undefined) u.level = null;
    if (u.employment === undefined) u.employment = "";
    if (u.leaderId === undefined) u.leaderId = u.coachId || null;
  });

  st.version = 2;
  return st;
}

/* ---------- boot ---------- */

(async function boot() {
  const saved = await loadState();
  setS(saved && saved.users && saved.cycles ? migrate(saved) : seed());

  /* A signed-in user who is no longer on the roster is signed out, not
     silently swapped for someone else — their scope would be wrong. */
  if (S.session.userId && !S.users.find(u => u.id === S.session.userId)) {
    S.session.userId = null;
  }
  if (!S.session.userId) UI.route = "signin";

  save();
  render();
})();
