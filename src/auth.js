/* =====================================================================
   SIGN-IN
   Access is by email. The address is matched, case-insensitively,
   against the roster in src/data/roster.js — the person it matches
   decides what the application shows: their own record, the records of
   anyone they coach, and for an administrator, everything.

   There is no password layer and no server, so this identifies a person
   rather than authenticating them. It is the seam to replace: point
   signIn() at your identity provider (Google Workspace SSO fits this
   roster) and everything else — every screen, every export — keeps
   working unchanged, because they all read the signed-in person from
   S.session.userId.
   ===================================================================== */

import { S, save, readSignedInEmail, writeSignedInEmail } from "./state.js";
import { addressesOf, ORG } from "./data/roster.js";
import { esc } from "./helpers.js";
import { logAudit } from "./domain.js";

export function findByEmail(email){
  const e = String(email || "").trim().toLowerCase();
  if (!e) return null;
  return S.users.find(u => addressesOf(u).includes(e)) || null;
}

/* Restores the session from a previous visit. */
export function restoreSession(){
  const u = findByEmail(readSignedInEmail());
  S.session.userId = u ? u.id : null;
  return !!u;
}

export function signIn(email){
  const u = findByEmail(email);
  if (!u) return null;
  S.session.userId = u.id;
  writeSignedInEmail(String(email).trim().toLowerCase());
  logAudit("Signed in", `${u.name} · ${u.role}`);
  save();
  return u;
}

export function signOut(){
  logAudit("Signed out", S.users.find(u=>u.id===S.session.userId)?.name || "—");
  S.session.userId = null;
  writeSignedInEmail(null);
  save();
}

export const isSignedIn = () => !!(S.session && S.session.userId && S.users.some(u=>u.id===S.session.userId));

/* ---------- The sign-in screen ---------- */
export function viewSignIn(error){
  return `
  <div class="signin">
    <div class="signin-card">
      <div class="brand mb24">
        <div class="mark">A</div>
        <div><div class="nm">${esc(S.product.name)}</div><div class="sb">${esc(S.product.tagline)}</div></div>
      </div>
      <h1>Sign in</h1>
      <p class="small muted mt8">Enter your work email. ${esc(ORG.name)} keeps one record per person:
      you see your own, your coach sees yours, and ${esc(S.settings.hrLabel)} runs the programme.</p>

      <label class="f mt24"><span class="lb">Email</span>
        <input type="email" id="signin-email" autocomplete="email" spellcheck="false"
               placeholder="you@${esc(ORG.domain)}" data-bind="signinEmail" value="">
      </label>
      ${error ? `<div class="card flat mt12" style="border-left:3px solid var(--red);background:var(--red-light)">
        <div class="small"><strong>${esc(error)}</strong></div>
        <div class="tiny muted mt8">Only the ${S.users.length} people on the headcount roster can open ${esc(S.product.name)}.
        If you have just joined, ask ${esc(S.settings.hrLabel)} to add you under People &amp; Coaches.</div></div>` : ""}

      <button class="btn primary block mt16" data-act="doSignIn">Continue</button>

      <div class="tiny muted mt24">Your records are held in this browser. There is no password layer in this
      build — it identifies you against the roster and shows you what your role allows.</div>
    </div>
  </div>`;
}

export function renderSignIn(error){
  document.getElementById("app").innerHTML = viewSignIn(error);
  const el = document.getElementById("signin-email");
  if (el) el.focus();
}
