/* The pickers: goals from the library, competencies from the library or
   named by the person themselves. */
import { UI } from "../state.js";
import { esc } from "../helpers.js";
import { LIB } from "../data/library.js";
import { me, charterOf, competencyMeta } from "../domain.js";
import { openModal } from "../ui.js";

export function modalOKR(){
  const u = me(), unit = UI.draft.okrUnit || u.unit;
  const term = (UI.draft.okrSearch||"").toLowerCase();
  const list = LIB.okrs.filter(o=>(unit==="All"||o.unit===unit) &&
    (!term || (o.kr+o.objective+o.source).toLowerCase().includes(term)));
  const units = ["All", ...Array.from(new Set(LIB.okrs.map(o=>o.unit)))];
  openModal({
    wide:true,
    title:"Add a goal from the library",
    body:`<div class="row wrap mb16">
      <select style="width:auto" data-act="okrUnit">${units.map(x=>`<option ${x===unit?"selected":""}>${esc(x)}</option>`).join("")}</select>
      <input type="text" class="grow" placeholder="Search key results, objectives or data sources" value="${esc(UI.draft.okrSearch||"")}" data-act-input="okrSearch" data-autofocus style="max-width:340px">
      <span class="small muted" style="margin-left:auto">${list.length} results</span>
    </div>
    <div class="scroller">${list.length?list.map((o,i)=>`
      <div class="pickitem" data-act="addOKRGoal" data-i="${LIB.okrs.indexOf(o)}">
        <div class="o">${esc(o.objective)}</div><div class="k">${esc(o.kr)}</div><div class="s">${esc(o.source)}</div>
      </div>`).join(""):`<div class="empty small">Nothing matches. Try another unit, or write your own goal.</div>`}</div>
    <div class="callout small mt16">Pick the ones closest to your real work, then replace the illustrative numbers with your own baseline and target. The library is a menu, not a list you must fit into.</div>`,
    footer:`<button class="btn" data-act="closeModal">Cancel</button>
            <button class="btn primary" data-act="addCustomGoalFromModal">Write my own instead</button>`
  });
}

export function modalComp(){
  const u = me(), ch = charterOf(u.id);
  const taken = new Set(ch.competencies.map(c=>c.name));
  const unit = UI.draft.compUnit || u.unit;
  const term = (UI.draft.compSearch||"").toLowerCase();
  const list = LIB.competencies.filter(c=>!taken.has(c.name) && !c.mandatory &&
    (unit==="All"||c.unit===unit||c.unit==="All Units (Common)") &&
    (!term || (c.name+c.definition).toLowerCase().includes(term)));
  const units = ["All", ...Array.from(new Set(LIB.competencies.map(c=>c.unit)))];
  openModal({
    wide:true,
    title:"Choose a competency for this cycle",
    body:`<div class="row wrap mb16">
      <select style="width:auto" data-act="compUnit">${units.map(x=>`<option ${x===unit?"selected":""}>${esc(x)}</option>`).join("")}</select>
      <input type="text" class="grow" placeholder="Search competencies" value="${esc(UI.draft.compSearch||"")}" data-act-input="compSearch" data-autofocus style="max-width:340px">
      <span class="small muted" style="margin-left:auto">${list.length} available</span>
    </div>
    <div class="card flat mb16" style="background:var(--teal-wash);border-color:#D8EAE7">
      <div class="eyebrow mb8">Not in the list? Name your own</div>
      <div class="row">
        <input type="text" class="grow" placeholder="e.g. Client Workshop Facilitation" value="${esc(UI.draft.customComp||"")}" data-bind="customComp">
        <button class="btn primary" data-act="addCustomComp">Add my own</button>
      </div>
      <div class="tiny muted mt8">The library is a menu, not a limit. A competency you write yourself works exactly like a library one — you give it a one-line commitment, and it is discussed at every quarterly scoring.</div>
    </div>
    <div class="scroller">${list.length?list.map(c=>`
      <div class="pickitem" data-act="addComp" data-name="${esc(c.name)}">
        <div class="o">${esc(c.unit)}</div><div class="k">${esc(c.name)}</div>
        <div class="s" style="font-family:var(--sans);font-size:12px">${esc(c.definition)}</div>
      </div>`).join(""):`<div class="empty small">Nothing left in this unit. Try another unit, or name your own above.</div>`}</div>
    <div class="callout small mt16">Choose competencies matched to your role and to this cycle's goals — the behaviours that will actually decide whether the goals land.</div>`
  });
}

export function modalCompInfo(name){
  const c = competencyMeta(name); if (!c) return;
  openModal({
    title:esc(c.name),
    body:`<div class="eyebrow">${esc(c.unit)}</div>
      <p class="mt8">${esc(c.definition)}</p>
      <div class="small"><strong>How it is measured:</strong> <span class="muted">${esc(c.measure)}</span></div>
      <div class="grid g3 mt16">
        <div class="card flat" style="background:var(--teal-wash)"><div class="eyebrow">A 5 looks like</div><div class="small mt8">${esc(c.l5)}</div></div>
        <div class="card flat" style="background:var(--surface)"><div class="eyebrow">A 3 looks like</div><div class="small mt8">${esc(c.l3)}</div></div>
        <div class="card flat" style="background:var(--surface)"><div class="eyebrow">A 1 looks like</div><div class="small mt8">${esc(c.l1)}</div></div>
      </div>`
  });
}

