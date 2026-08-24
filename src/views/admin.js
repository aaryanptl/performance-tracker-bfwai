/* ---------- Administration: programme dashboard, people & coaches, cycles ---------- */
import { S, UI } from "../core/state.js";
import { esc, fmtDate, download } from "../core/helpers.js";
import { user, cycle, coacheesOf, charterOf, reviewOf, checkinsOf, quarterly,
         halfYearScore, charterStatusTag } from "../core/domain.js";
import { UNITS, COACH_FIXED_THIRD, LEVELS, EMPLOYMENT_TYPES } from "../data/constants.js";
import { personLine } from "../ui/fragments.js";
import { go } from "../ui/shell.js";

export function programmeStats(cycleId){
  const c = cycle(cycleId), people = S.users;
  const charters = S.charters.filter(x=>x.cycleId===c.id);
  const approved = charters.filter(x=>x.status==="approved");
  const expected = people.length * c.checkins;
  const actual = S.checkins.filter(x=>x.cycleId===c.id).length;
  const released = S.reviews.filter(x=>x.cycleId===c.id && x.released);
  const dist = [1,2,3,4,5].map(n=>released.filter(r=>Math.round(r.quarterly)===n).length);
  const avg = released.length ? released.reduce((a,r)=>a+r.quarterly,0)/released.length : null;
  return {people, charters, approved, expected, actual, released, dist, avg, c};
}

export function viewDash(){
  const st = programmeStats();
  const c = st.c;
  const pct = st.expected ? Math.round(st.actual/st.expected*100) : 0;
  return `
  <div class="spread mb24">
    <div><h1>Programme dashboard</h1><div class="small muted">${esc(c.name)} · ${fmtDate(c.start)} – ${fmtDate(c.end)} · ${st.people.length} people, ${S.users.filter(u=>u.role==="coach").length} coaches</div></div>
    <button class="btn" data-act="go" data-route="exports">Records & downloads</button>
  </div>

  <div class="grid g4 mb24">
    <div class="kpi"><div class="v">${st.approved.length}<span class="muted" style="font-size:16px">/${st.people.length}</span></div><div class="l">Charters approved and locked</div></div>
    <div class="kpi"><div class="v">${pct}%</div><div class="l">Check-in completion</div></div>
    <div class="kpi"><div class="v">${st.released.length}</div><div class="l">Scores released</div></div>
    <div class="kpi"><div class="v">${st.avg!=null?st.avg.toFixed(2):"—"}</div><div class="l">Mean quarterly score</div></div>
  </div>

  <div class="grid g2 mb24">
    <div class="card">
      <div class="card-head"><h2>Score distribution</h2><span class="tag grey">${st.released.length} released</span></div>
      ${st.released.length? `<div class="stack">${[5,4,3,2,1].map(n=>{
        const v = st.dist[n-1], w = st.released.length? Math.round(v/st.released.length*100):0;
        return `<div class="row"><div class="num" style="width:18px">${n}</div>
          <div class="grow" style="background:var(--line-2);border-radius:20px;height:20px;overflow:hidden">
            <div style="width:${w}%;height:100%;background:${n>=4?"var(--grad-teal)":n===3?"#9AD3CC":"#C9D9D7"}"></div></div>
          <div class="num small right" style="width:62px">${v} · ${w}%</div></div>`;}).join("")}</div>
        <div class="small muted mt16">Watch for central tendency — everyone landing on 3 — and for a coach whose ratings sit consistently above or below the group. Both are calibration conversations, not data problems.</div>`
      : `<div class="empty small">Nothing released yet. Distribution appears here once scores are signed off.</div>`}
    </div>

    <div class="card">
      <div class="card-head"><h2>Coach load and completion</h2></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Coach</th><th>Coachees</th><th>Check-ins</th><th>Charters signed</th><th>Scores signed</th></tr></thead>
        <tbody>${S.users.filter(u=>u.role==="coach"||u.role==="admin").map(co=>{
          const cs = coacheesOf(co.id);
          const dueCI = cs.length*c.checkins;
          const gotCI = cs.reduce((a,u)=>a+checkinsOf(u.id).length,0);
          const chS = S.charters.filter(x=>x.cycleId===c.id&&x.coachId===co.id&&x.coachSignedAt).length;
          const rvS = S.reviews.filter(x=>x.cycleId===c.id&&x.coachId===co.id&&x.coachSignedAt).length;
          return `<tr><td>${esc(co.name)}${co.role==="admin"?` <span class="tag grey">admin</span>`:""}</td>
            <td class="num">${cs.length}</td><td class="num">${gotCI}/${dueCI}</td><td class="num">${chS}/${cs.length}</td><td class="num">${rvS}</td></tr>`;
        }).join("")}</tbody></table></div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><h2>Everyone, at a glance</h2><span class="tag teal">${esc(c.name)}</span></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Person</th><th>Unit</th><th>Coach</th><th>Charter</th><th>Check-ins</th>${c.quarters.map(q=>`<th>${esc(q.id)}</th>`).join("")}<th>Half-yearly</th><th></th></tr></thead>
      <tbody>${S.users.map(u=>{
        const ch = charterOf(u.id), hy = halfYearScore(u.id);
        return `<tr>
          <td>${personLine(u)}</td><td class="small muted">${esc(u.unit)}</td><td class="small">${esc(user(u.coachId).name)}</td>
          <td>${charterStatusTag(ch)}</td><td class="num">${checkinsOf(u.id).length}/${c.checkins}</td>
          ${c.quarters.map(q=>{const r=reviewOf(u.id,q.id); return `<td class="num">${r&&r.released?r.quarterly.toFixed(2):"—"}</td>`;}).join("")}
          <td class="num" style="font-weight:700">${hy!=null?hy.toFixed(2):"—"}</td>
          <td class="right"><button class="btn sm" data-act="go" data-route="transcript" data-id="${u.id}">Record</button></td>
        </tr>`;}).join("")}</tbody>
    </table></div>
  </div>`;
}

export function viewPeople(){
  const coaches = S.users.filter(u=>u.role==="coach"||u.role==="admin");
  return `
  <div class="spread mb16">
    <div><h1>People & coaches</h1><div class="small muted">Seeded from the headcount report; maintained here and told to each person directly. A person's coach decides exactly what that coach can read and download, so changing this column changes their access.</div></div>
    <button class="btn primary" data-act="addPerson">Add a person</button>
  </div>

  <div class="tbl-wrap mb24"><table class="roster">
    <colgroup>
      <col class="c-name"><col class="c-email"><col class="c-role"><col class="c-unit"><col class="c-pos">
      <col class="c-yal"><col class="c-type"><col class="c-leader"><col class="c-coach"><col class="c-n"><col class="c-act">
    </colgroup>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Unit</th><th>Position</th><th>YAL</th>
      <th>Type</th><th>Team leader</th><th>Coach</th><th>Coachees</th><th></th></tr></thead>
    <tbody>${S.users.map(u=>`<tr>
      <td><input type="text" value="${esc(u.name)}" data-set="users/${u.id}/name"></td>
      <td><input type="email" value="${esc(u.email||"")}" data-set="users/${u.id}/email"></td>
      <td><select data-set="users/${u.id}/role" data-live="1">
        ${["member","coach","admin"].map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}</select></td>
      <td><select data-set="users/${u.id}/unit">${UNITS.map(x=>`<option ${u.unit===x?"selected":""}>${esc(x)}</option>`).join("")}</select></td>
      <td><input type="text" value="${esc(u.title||"")}" data-set="users/${u.id}/title"></td>
      <td><select data-set="users/${u.id}/level" data-type="num">
        ${LEVELS.map(l=>`<option value="${l.n}" ${u.level===l.n?"selected":""} title="${esc(l.hint)}">${l.n}</option>`).join("")}</select></td>
      <td><select data-set="users/${u.id}/employment">
        ${EMPLOYMENT_TYPES.map(x=>`<option ${u.employment===x?"selected":""}>${esc(x)}</option>`).join("")}</select></td>
      <td><select data-set="users/${u.id}/leaderId">
        <option value="">— none —</option>
        ${S.users.filter(c=>c.id!==u.id).map(c=>`<option value="${c.id}" ${u.leaderId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></td>
      <td><select data-set="users/${u.id}/coachId" data-live="1">
        <option value="">— none —</option>
        ${coaches.filter(c=>c.id!==u.id).map(c=>`<option value="${c.id}" ${u.coachId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></td>
      <td class="num">${coacheesOf(u.id).length}</td>
      <td class="right"><button class="btn sm danger" data-act="delPerson" data-id="${u.id}">Remove</button></td>
    </tr>`).join("")}</tbody>
  </table></div>

  <div class="row wrap mb24">
    <button class="btn" data-act="csvPeople">Download the people and coaching map (CSV)</button>
    <span class="small muted">${S.users.length} people · ${S.users.filter(u=>u.role==="coach").length} coaches · ${S.users.filter(u=>u.role==="admin").length} administrators</span>
  </div>

  ${headcountPanel()}

  <div class="grid g2">
    <div class="card"><div class="eyebrow">What each role can do</div>
      <table class="mt8"><tbody>
        <tr><td style="width:90px"><span class="tag grey">member</span></td><td class="small">Drafts their own charter, records what they achieved, writes the Impact Statement, signs check-ins, acknowledges scores with a verbatim comment.</td></tr>
        <tr><td><span class="tag teal">coach</span></td><td class="small">Everything a member does, plus: reviews coachees' charters, runs and records monthly check-ins, scores each quarter, writes the impact summary and development needs.</td></tr>
        <tr><td><span class="tag amber">admin</span></td><td class="small">Everything a coach does, plus: final charter approval, calibration and release of scores, people and cycle settings, and download of every record.</td></tr>
      </tbody></table>
    </div>
    <div class="card"><div class="eyebrow">Allocation rules worth keeping</div>
      <ul class="small mt8" style="padding-left:18px;color:var(--muted)">
        <li>Every person has exactly one named coach — including the coaches themselves.</li>
        <li>A coach carries <strong>${esc(COACH_FIXED_THIRD)}</strong> as their third fixed competency instead of Collaboration; growing their coachees is measured, not assumed.</li>
        <li>Six to eight coachees is a workable load at 15 minutes a month each plus quarterly scoring.</li>
        <li>Any change of coach is communicated one-to-one before it shows up here.</li>
      </ul>
    </div>
  </div>`;
}

export function viewCycles(){
  const c = cycle();
  return `
  <div class="spread mb16">
    <div><h1>Cycles & settings</h1><div class="small muted">A cycle is six months: goal setting once at the front, monthly check-ins throughout, scoring at each quarter end, and the full review at the close.</div></div>
    <button class="btn primary" data-act="addCycle">Add the next cycle</button>
  </div>

  ${S.cycles.map(cy=>`<div class="card mb16 ${cy.id===S.session.cycleId?"":"flat"}">
    <div class="card-head">
      <div><div class="eyebrow">${cy.id===S.session.cycleId?"Current cycle":"Cycle"}</div>
        <input type="text" value="${esc(cy.name)}" data-set="cycles/${cy.id}/name" style="font-weight:650;font-size:16px;border:0;padding:2px 0"></div>
      ${cy.id!==S.session.cycleId?`<button class="btn sm" data-act="useCycle" data-id="${cy.id}">Make current</button>`:`<span class="tag teal">Active</span>`}
    </div>
    <div class="grid g4">
      <label class="f"><span class="lb">Cycle starts</span><input type="date" value="${esc(cy.start)}" data-set="cycles/${cy.id}/start"></label>
      <label class="f"><span class="lb">Cycle ends</span><input type="date" value="${esc(cy.end)}" data-set="cycles/${cy.id}/end"></label>
      <label class="f"><span class="lb">Goal window opens</span><input type="date" value="${esc(cy.goalWindow.from)}" data-set="cycles/${cy.id}/goalWindow/from"></label>
      <label class="f"><span class="lb">Goal window closes</span><input type="date" value="${esc(cy.goalWindow.to)}" data-set="cycles/${cy.id}/goalWindow/to"></label>
    </div>
    <div class="grid g4">
      <label class="f"><span class="lb">Check-ins in the cycle</span><input type="number" min="1" max="12" value="${cy.checkins}" data-type="num" data-set="cycles/${cy.id}/checkins"></label>
      <label class="f"><span class="lb">Maximum goals per person</span><input type="number" min="1" max="10" value="${cy.maxGoals}" data-type="num" data-set="cycles/${cy.id}/maxGoals"></label>
      <label class="f"><span class="lb">Weight — what was delivered</span><input type="number" min="0" max="1" step="0.05" value="${cy.weights.okr}" data-type="num" data-live="1" data-set="cycles/${cy.id}/weights/okr"></label>
      <label class="f"><span class="lb">Weight — how it was delivered</span><input type="number" min="0" max="1" step="0.05" value="${cy.weights.comp}" data-type="num" data-live="1" data-set="cycles/${cy.id}/weights/comp"></label>
    </div>
    ${Math.abs(cy.weights.okr+cy.weights.comp-1)>0.001?`<div class="card flat" style="border-left:3px solid var(--red);background:var(--red-light)">
      <strong class="small">The two weights add up to ${(cy.weights.okr+cy.weights.comp).toFixed(2)}, not 1.00.</strong>
      <div class="small">Quarterly scores will not sit on the 1–5 scale until they do.</div></div>`:""}
    <div class="eyebrow mt16 mb8">Quarters</div>
    ${cy.quarters.map(q=>`<div class="grid g3" style="border-top:1px solid var(--line-2);padding-top:10px">
      <label class="f"><span class="lb">Label</span><input type="text" value="${esc(q.label)}" data-set="cycles/${cy.id}/quarters/${q.id}/label"></label>
      <label class="f"><span class="lb">Score by</span><input type="date" value="${esc(q.scoreBy)}" data-set="cycles/${cy.id}/quarters/${q.id}/scoreBy"></label>
      <label class="f"><span class="lb">Full review happens in this quarter</span>
        <select data-type="bool" data-set="cycles/${cy.id}/quarters/${q.id}/review"><option value="false" ${!q.review?"selected":""}>No — scoring only</option>
        <option value="true" ${q.review?"selected":""}>Yes — review and feedback session</option></select></label>
    </div>`).join("")}
  </div>`).join("")}

  <div class="card">
    <h2 class="mb16">System settings</h2>
    <div class="grid g3">
      <label class="f"><span class="lb">Final approver is called</span><input type="text" value="${esc(S.settings.approverLabel)}" data-live="1" data-set="settings/approverLabel"></label>
      <label class="f"><span class="lb">Programme owner is called</span><input type="text" value="${esc(S.settings.hrLabel)}" data-live="1" data-set="settings/hrLabel"></label>
      <label class="f"><span class="lb">System name</span><input type="text" value="${esc(S.product.name)}" data-live="1" data-set="product/name"></label>
    </div>
    <div class="row wrap mt16">
      <button class="btn" data-act="exportJSON">Download a full backup</button>
      <button class="btn" data-act="importJSON">Restore from a backup</button>
      <button class="btn danger" data-act="resetAll">Reset to the roster from the headcount report</button>
    </div>
    <div class="small muted mt12">Data lives in this browser only. Take a backup before clearing site data, and keep one after every scoring round.</div>
  </div>`;
}


/* A live version of the headcount report's Dashboard tab, computed from the
   people list rather than kept in a second place that can drift. */
function headcountPanel(){
  const people = S.users;
  const tally = (key) => {
    const m = new Map();
    people.forEach(u => m.set(u[key], (m.get(u[key]) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const pct = n => people.length ? Math.round(n / people.length * 100) : 0;
  const table = (heading, rows, labelFor) => `
    <div class="card">
      <div class="card-head"><h2>${esc(heading)}</h2><span class="tag grey">${people.length} people</span></div>
      <table><thead><tr><th>${esc(labelFor)}</th><th class="right">Count</th><th class="right">% of org</th></tr></thead>
      <tbody>${rows.map(([k, v]) => `<tr><td>${esc(k == null || k === "" ? "—" : String(k))}</td>
        <td class="num right">${v}</td><td class="num right">${pct(v)}%</td></tr>`).join("")}</tbody></table>
    </div>`;

  return `
  <div class="grid g3 mb24">
    ${table("Headcount by unit", tally("unit"), "Unit")}
    ${table("Headcount by year-at-level", tally("level").sort((a,b)=>(a[0]||0)-(b[0]||0))
        .map(([k,v]) => [k == null ? "—" : "Level " + k, v]), "Level (YAL)")}
    ${table("Headcount by employment type", tally("employment"), "Employment type")}
  </div>

  <div class="card mb24">
    <div class="eyebrow mb8">What each level means</div>
    <table><tbody>${LEVELS.map(l=>`<tr><td style="width:80px"><span class="tag grey">${esc(l.label)}</span></td>
      <td class="small muted">${esc(l.hint)}</td></tr>`).join("")}</tbody></table>
  </div>`;
}
