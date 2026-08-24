/* ---------- Modal dialogs: goal picker, competency picker, role switch ---------- */
import { S, UI } from "../core/state.js";
import { esc, initials } from "../core/helpers.js";
import { me, charterOf, competencyMeta } from "../core/domain.js";
import { LIB } from "../data/library.js";
import { bindInputs } from "./bind.js";

export function openModal({title, body, footer, wide}){
  document.getElementById("modal-root").innerHTML = `
    <div class="modal-bg" data-act="closeModalBg">
      <div class="modal" style="${wide?"width:min(1000px,100%)":""}">
        <div class="mhd"><h2>${title}</h2><button class="btn sm" data-act="closeModal">Close</button></div>
        <div class="mbd">${body}</div>
        ${footer?`<div class="mft">${footer}</div>`:""}
      </div>
    </div>`;
  bindInputs();
  const f = document.querySelector(".modal [data-autofocus]");
  if (f){ const v = f.value; f.focus(); try{ f.value=""; f.value=v; }catch(e){} }
}
export function closeModal(){ document.getElementById("modal-root").innerHTML = ""; }

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

export function modalSwitch(){
  openModal({
    title:"Open the system as someone else",
    body:`<p class="small muted">An administrator can open the system as any person on the roster, to help them or to check what they see. While you are viewing as someone else you are held to <em>their</em> scope, and the switch is written to the activity log.</p>
      <div class="stack mt16">${S.users.map(u=>`
        <div class="pickitem ${u.id===S.session.userId?"sel":""}" data-act="pickUser" data-id="${u.id}">
          <div class="row"><div class="avatar" style="background:var(--teal-light);color:var(--teal-dark)">${esc(initials(u.name))}</div>
            <div class="grow"><div class="k">${esc(u.name)}</div><div class="s" style="font-family:var(--sans)">${esc(u.title)} · ${esc(u.unit)}</div></div>
            <span class="tag ${u.role==="admin"?"amber":u.role==="coach"?"teal":"grey"}">${esc(u.role)}</span></div>
        </div>`).join("")}</div>`
  });
}
