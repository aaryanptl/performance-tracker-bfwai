/* ---------- Goal & competency library browser ---------- */
import { UI } from "../core/state.js";
import { esc } from "../core/helpers.js";
import { LIB } from "../data/library.js";

/* ---------- LIBRARY ---------- */
export function viewLibrary(){
  const tab = UI.params.tab || "okr";
  const unit = UI.params.unit || "All";
  const units = ["All", ...Array.from(new Set(LIB.okrs.map(o=>o.unit).concat(LIB.competencies.map(c=>c.unit))))];
  const okrs = LIB.okrs.filter(o=>unit==="All"||o.unit===unit);
  const comps = LIB.competencies.filter(c=>unit==="All"||c.unit===unit);
  const byObjective = {};
  okrs.forEach(o=>{ (byObjective[o.objective] = byObjective[o.objective]||[]).push(o); });

  return `
  <div class="mb16"><h1>Goal & competency library</h1>
    <div class="small muted">A starting menu, not a binding list. ${LIB.okrs.length} example key results and ${LIB.competencies.length} competencies with level descriptions. Adapt the wording to your real work, and add your own.</div></div>

  <div class="row wrap mb24">
    <div class="row" style="gap:6px">
      <button class="btn sm ${tab==="okr"?"dark":""}" data-act="lib" data-tab="okr" data-unit="${esc(unit)}">Objectives & key results</button>
      <button class="btn sm ${tab==="comp"?"dark":""}" data-act="lib" data-tab="comp" data-unit="${esc(unit)}">Competencies</button>
    </div>
    <select style="width:auto;margin-left:auto" data-act="libUnit" data-tab="${esc(tab)}">
      ${units.map(x=>`<option ${unit===x?"selected":""}>${esc(x)}</option>`).join("")}
    </select>
  </div>

  ${tab==="okr" ? Object.keys(byObjective).map(ob=>`<div class="card mb16">
      <div class="card-head"><div><div class="eyebrow">${esc(byObjective[ob][0].unit)}</div><h3 class="mt8">${esc(ob)}</h3></div></div>
      <div class="tbl-wrap"><table><thead><tr><th style="width:52%">Key result — pick and adapt</th><th>How to measure (data source)</th></tr></thead>
        <tbody>${byObjective[ob].map(o=>`<tr><td>${esc(o.kr)}</td><td class="small muted">${esc(o.source)}</td></tr>`).join("")}</tbody></table></div>
    </div>`).join("")
  : `<div class="stack">${comps.map(c=>`<div class="card">
      <div class="card-head"><div><div class="eyebrow">${esc(c.unit)}${c.mandatory?" · mandatory":""}</div>
        <h3 class="mt8">${esc(c.name)}</h3><div class="small muted mt8">${esc(c.definition)}</div></div>
        ${c.mandatory?`<span class="tag teal">fixed</span>`:""}</div>
      <div class="small"><strong>How it is measured:</strong> <span class="muted">${esc(c.measure)}</span></div>
      <div class="grid g3 mt16">
        <div class="card flat" style="background:var(--teal-wash)"><div class="eyebrow">A 5 looks like</div><div class="small mt8">${esc(c.l5)}</div></div>
        <div class="card flat" style="background:var(--surface)"><div class="eyebrow">A 3 looks like</div><div class="small mt8">${esc(c.l3)}</div></div>
        <div class="card flat" style="background:var(--surface)"><div class="eyebrow">A 1 looks like</div><div class="small mt8">${esc(c.l1)}</div></div>
      </div></div>`).join("")}</div>`}`;
}
