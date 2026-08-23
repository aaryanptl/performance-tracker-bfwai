/* =====================================================================
   ASCEND — Performance Management System
   Build Fast with AI · entry point

   Boots the application: loads the records held in this browser, brings
   them up to date with the roster file, restores the signed-in person,
   and hands over to the router. Everything below the sign-in screen is
   scoped by role — see access.js.
   ===================================================================== */

import "./styles.css";
import { S, UI, setS, save, loadState, seed, syncRoster } from "./state.js";
import { A } from "./actions.js";
import { render, go } from "./router.js";
import { closeModal } from "./ui.js";
import { restoreSession, renderSignIn } from "./auth.js";
import { modalOKR, modalComp } from "./views/modals.js";

/* ---------- Event delegation ---------- */
document.addEventListener("click", e=>{
  const t = e.target.closest("[data-act]");
  if (!t || t.tagName==="SELECT") return;
  const fn = A[t.dataset.act];
  if (fn){ e.preventDefault(); fn(t.dataset, t, e); }
});
document.addEventListener("change", e=>{
  const t = e.target.closest("[data-act]");
  if (!t || t.tagName!=="SELECT") return;
  const fn = A[t.dataset.act];
  if (fn) fn(t.dataset, t, e);
});
document.addEventListener("input", e=>{
  const t = e.target;
  if (t.dataset && t.dataset.actInput){
    UI.draft[t.dataset.actInput] = t.value;
    clearTimeout(window._srch);
    window._srch = setTimeout(()=>{
      if (t.dataset.actInput==="okrSearch") modalOKR();
      else if (t.dataset.actInput==="compSearch") modalComp();
    }, 260);
  }
});
document.addEventListener("keydown", e=>{
  if (e.key==="Escape") closeModal();
  /* Enter signs in from the email field. */
  if (e.key==="Enter" && e.target && e.target.id==="signin-email"){
    e.preventDefault(); A.doSignIn();
  }
});

/* Route helpers used by the smoke test in scripts/smoke.mjs. They call the
   same router every button calls — nothing here bypasses an access check. */
window.__go  = r => go(r);
window.__goP = (r,p) => go(r,p);

/* ---------- Boot ---------- */
(function boot(){
  const stored = loadState();
  setS(stored && stored.users && stored.cycles ? stored : seed());
  syncRoster();                       // new joiners, coach changes, role changes
  save();
  if (restoreSession()) render();
  else renderSignIn();
})();
