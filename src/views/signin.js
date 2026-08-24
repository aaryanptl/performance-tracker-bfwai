/* =====================================================================
   SIGN IN
   Identity selection, not authentication: there is no server to verify a
   password against, so this screen establishes *who the session is* and
   therefore which scope every later view and download runs under.
   ===================================================================== */

import { S, UI } from "../core/state.js";
import { esc, initials } from "../core/helpers.js";
import { coacheesOf } from "../core/domain.js";

const roleTag = r =>
  `<span class="tag ${r === "admin" ? "amber" : r === "coach" ? "teal" : "grey"}">${esc(r)}</span>`;

export function viewSignIn() {
  const term = (UI.draft.signInSearch || "").trim().toLowerCase();
  const list = S.users.filter(u =>
    !term || (u.name + " " + u.email + " " + u.title + " " + u.unit).toLowerCase().includes(term));

  const card = u => {
    const n = coacheesOf(u.id).length;
    const scope = u.role === "admin"
      ? "Sees and downloads every person's record"
      : n
        ? `Sees own record and ${n} coachee${n === 1 ? "" : "s"}`
        : "Sees own record only";
    return `
    <div class="pickitem" data-act="signIn" data-id="${esc(u.id)}">
      <div class="row">
        <div class="avatar" style="background:var(--teal-light);color:var(--teal-dark)">${esc(initials(u.name))}</div>
        <div class="grow">
          <div class="k">${esc(u.name)}</div>
          <div class="s" style="font-family:var(--sans)">${esc(u.title)} · ${esc(u.unit)}</div>
          <div class="tiny muted">${esc(scope)}</div>
        </div>
        ${roleTag(u.role)}
      </div>
    </div>`;
  };

  const group = (label, role) => {
    const rows = list.filter(u => u.role === role);
    if (!rows.length) return "";
    return `<div class="mb24"><div class="eyebrow mb8">${esc(label)} · ${rows.length}</div>
      <div class="stack">${rows.map(card).join("")}</div></div>`;
  };

  return `
  <div class="signin">
    <div class="signin-panel">
      <div class="brand mb24">
        <div class="mark">A</div>
        <div>
          <div class="nm" style="color:var(--ink)">${esc(S.product.name)}</div>
          <div class="sb" style="color:var(--muted)">${esc(S.product.tagline)}</div>
        </div>
      </div>

      <h1 class="mb8">Sign in</h1>
      <p class="small muted mb16">
        ${esc((S.org && S.org.name) || "")} · ${esc((S.org && S.org.period) || "")} ·
        ${S.users.length} people on the roster. Choose your name to open your own view.
        What you can read and download follows your role.
      </p>

      <input type="text" placeholder="Search by name, email, role or unit"
             value="${esc(UI.draft.signInSearch || "")}" data-act-input="signInSearch" data-autofocus class="mb24">

      ${list.length
        ? group("Administrators", "admin") + group("Coaches", "coach") + group("Team members", "member")
        : `<div class="empty small">No one on the roster matches that.</div>`}

      <div class="callout small">
        <strong>How access works here.</strong> Administrators read and download every record.
        A coach reads and downloads their own record and the records of the people they coach — no one else's.
        Everyone else sees their own record. This build has no password layer, so treat it as
        identity selection for a trusted deployment rather than as authentication.
      </div>
    </div>
  </div>`;
}
