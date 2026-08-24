/* ---------- Shell, navigation and routing ---------- */
import { S, UI } from "../core/state.js";
import { esc, initials, fmtDate } from "../core/helpers.js";
import { me, user, cycle, isAdmin, isCoach, coacheesOf, charterOf, reviewOf } from "../core/domain.js";
import { canRoute, deniedPanel, visibleUsers } from "../core/access.js";
import { bindInputs } from "./bind.js";
import { viewHome, viewCharter, viewMyCheckins, viewImpact, viewMyScores } from "../views/member.js";
import { viewCoachees, viewCoachee, viewApprovals, viewScoring, viewReview, viewCheckinForm } from "../views/coach.js";
import { viewDash, viewPeople, viewCycles } from "../views/admin.js";
import { viewExports, viewTranscript } from "../views/records.js";
import { viewLibrary } from "../views/library.js";
import { viewDocs } from "../views/docs.js";
import { viewSignIn } from "../views/signin.js";

export const NAV = [
  {grp:"Me", items:[
    {k:"home",      t:"Overview",         roles:["member","coach","admin"]},
    {k:"charter",   t:"My Goal Charter",  roles:["member","coach","admin"]},
    {k:"checkins",  t:"My Check-ins",     roles:["member","coach","admin"]},
    {k:"impact",    t:"Impact Statement", roles:["member","coach","admin"]},
    {k:"myscores",  t:"My Scores",        roles:["member","coach","admin"]}
  ]},
  {grp:"Coaching", items:[
    {k:"coachees",  t:"My Coachees",      roles:["coach","admin"]},
    {k:"approvals", t:"Charter Reviews",  roles:["coach","admin"]},
    {k:"scoring",   t:"Quarterly Scoring",roles:["coach","admin"]}
  ]},
  {grp:"Records", items:[
    {k:"dash",      t:"Programme Dashboard", roles:["admin"]},
    {k:"people",    t:"People & Coaches",    roles:["admin"]},
    {k:"cycles",    t:"Cycles & Settings",   roles:["admin"]},
    {k:"exports",   t:"Records & Downloads", roles:["coach","admin"]}
  ]},
  {grp:"Reference", items:[
    {k:"library",   t:"Goal & Competency Library", roles:["member","coach","admin"]},
    {k:"docs",      t:"How Ascend works",          roles:["member","coach","admin"]}
  ]}
];

export function go(route, params){
  UI.route = route; UI.params = params || {}; UI.draft = {}; UI.sidebar = false;
  window.scrollTo({top:0}); render();
}

export function navBadges(){
  const b = {};
  if (isCoach()){
    b.approvals = S.charters.filter(c=>c.status==="coach_review" && coacheesOf(S.session.userId).some(u=>u.id===c.userId)).length;
    if (isAdmin()) b.approvals += S.charters.filter(c=>c.status==="approval").length;
    b.scoring = coacheesOf(S.session.userId).filter(u=>{
      const q = cycle().quarters.find(q=>!reviewOf(u.id,q.id) || !reviewOf(u.id,q.id).released);
      return !!q && !!charterOf(u.id) && charterOf(u.id).status==="approved";
    }).length;
  }
  const ch = charterOf(S.session.userId);
  if (!ch || ch.status==="draft" || ch.status==="returned") b.charter = 1;
  return b;
}

export function render(){
  /* No one signed in yet — show the sign-in screen instead of the shell,
     so a session always has an identity and therefore a scope. */
  if (!S.session.userId) {
    document.getElementById("app").innerHTML = viewSignIn();
    bindInputs();
    return;
  }
  const u = me(), badges = navBadges();
  const nav = NAV.map(g=>{
    const items = g.items.filter(i=>i.roles.includes(u.role));
    if (!items.length) return "";
    return `<div class="navgrp"><div class="lbl">${esc(g.grp)}</div>` +
      items.map(i=>`<button class="nav ${UI.route===i.k?"on":""}" data-act="go" data-route="${i.k}">
         <span class="ic">${navIcon(i.k)}</span><span>${esc(i.t)}</span>
         ${badges[i.k]?`<span class="pill">${badges[i.k]}</span>`:""}</button>`).join("") + `</div>`;
  }).join("");

  document.getElementById("app").innerHTML = `
  <div class="shell">
    ${UI.sidebar?'<div class="backdrop" data-act="closeNav"></div>':''}
    <aside class="side ${UI.sidebar?"open":""}">
      <div class="brand">
        <div class="mark">A</div>
        <div><div class="nm">${esc(S.product.name)}</div><div class="sb">${esc(S.product.tagline)}</div></div>
      </div>
      ${nav}
      <div class="foot">
        <div class="whoami">
          <div class="avatar">${esc(initials(u.name))}</div>
          <div class="grow"><div class="n">${esc(u.name)}</div><div class="r">${esc(u.role)}</div></div>
        </div>
        ${isAdmin()?`<button class="btn sm block mb8" data-act="switchUser" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.2)">View as someone else</button>`:""}
        ${S.session.viewingAs?`<div class="tiny" style="color:#FFD9A8;padding:0 2px 8px">Viewing as ${esc(u.name)} — administrator session.</div>`:""}
        <button class="btn sm block" data-act="signOut" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.2)">Sign out</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <button class="btn sm" id="burger" data-act="openNav">Menu</button>
        <div>
          <div class="eyebrow">${esc(cycle().name)} · ${fmtDate(cycle().start)} – ${fmtDate(cycle().end)}</div>
          <div style="font-weight:650;letter-spacing:-.02em">${esc(routeTitle())}</div>
        </div>
        <div class="cyc">
          ${S.cycles.length>1?`<select data-act="setCycle" style="width:auto">${S.cycles.map(c=>`<option value="${c.id}" ${c.id===S.session.cycleId?"selected":""}>${esc(c.name)}</option>`).join("")}</select>`:""}
          <button class="btn sm" data-act="go" data-route="docs">Help</button>
        </div>
      </div>
      <div class="content">${routeView()}</div>
    </div>
  </div>`;
  bindInputs();
}

export function navIcon(k){
  const sq = p => `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const m = {
    home:sq('<path d="M2.5 7L8 2.5L13.5 7v6.5h-11z"/>'),
    charter:sq('<path d="M4 2h8v12H4z"/><path d="M6 5.5h4M6 8h4M6 10.5h2.5"/>'),
    checkins:sq('<path d="M2.5 3.5h11v9h-11z"/><path d="M5 6.5l2 2 4-4"/>'),
    impact:sq('<path d="M8 2l1.8 3.9 4.2.5-3.1 2.9.9 4.2L8 11.4 4.2 13.5l.9-4.2L2 6.4l4.2-.5z"/>'),
    myscores:sq('<path d="M3 13V8M8 13V3M13 13V6"/>'),
    coachees:sq('<circle cx="6" cy="6" r="2.3"/><path d="M2.2 13c.4-2.3 1.9-3.5 3.8-3.5S9.4 10.7 9.8 13"/><path d="M11 5.2a2 2 0 010 3.6M12.4 13c-.15-1.3-.5-2.3-1.1-3"/>'),
    approvals:sq('<path d="M3 3h10v10H3z"/><path d="M5.5 8l1.8 1.8 3.2-3.6"/>'),
    scoring:sq('<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/>'),
    dash:sq('<path d="M2.5 2.5h5v5h-5zM8.5 2.5h5v3h-5zM8.5 6.5h5v7h-5zM2.5 8.5h5v5h-5z"/>'),
    people:sq('<circle cx="8" cy="5.5" r="2.4"/><path d="M3 13.2c.6-2.6 2.4-4 5-4s4.4 1.4 5 4"/>'),
    cycles:sq('<path d="M13 8a5 5 0 11-1.7-3.8"/><path d="M13.2 2.6v2.6h-2.6"/>'),
    exports:sq('<path d="M8 2.5v7"/><path d="M5.2 7L8 9.8 10.8 7"/><path d="M3 11.5v2h10v-2"/>'),
    library:sq('<path d="M3 3h4.5v10H3zM8.5 3H13v10H8.5z"/><path d="M4.5 5.5h1.5M10 5.5h1.5"/>'),
    docs:sq('<circle cx="8" cy="8" r="5.7"/><path d="M6.4 6.2a1.7 1.7 0 013.2.6c0 1.2-1.6 1.4-1.6 2.4M8 11.2h.01"/>')
  };
  return m[k] || sq('<circle cx="8" cy="8" r="5"/>');
}

export function routeTitle(){
  for (const g of NAV) for (const i of g.items) if (i.k===UI.route) return i.t;
  const t = {charterEdit:"Goal Charter", coachee:"Coachee record", review:"Quarterly scoring", checkin:"Monthly check-in", transcript:"Record transcript", signin:"Sign in"};
  return t[UI.route] || "Ascend";
}

export function routeView(){
  if (!canRoute(UI.route)) return deniedPanel("This part of " + S.product.name);
  switch(UI.route){
    case "home":       return viewHome();
    case "charter":    return viewCharter();
    case "checkins":   return viewMyCheckins();
    case "impact":     return viewImpact();
    case "myscores":   return viewMyScores();
    case "coachees":   return viewCoachees();
    case "coachee":    return viewCoachee();
    case "approvals":  return viewApprovals();
    case "scoring":    return viewScoring();
    case "review":     return viewReview();
    case "checkin":    return viewCheckinForm();
    case "dash":       return viewDash();
    case "people":     return viewPeople();
    case "cycles":     return viewCycles();
    case "exports":    return viewExports();
    case "transcript": return viewTranscript();
    case "library":    return viewLibrary();
    case "docs":       return viewDocs();
    default:           return viewHome();
  }
}
