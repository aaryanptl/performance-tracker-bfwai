/* Shared UI: modals, toasts, the score spine, the conversation thread,
   and the two-way binding used by every form on every screen. */
import { esc, nl2, initials, fmtDT } from "./helpers.js";
import { SCALE } from "./config.js";
import { S, UI, save } from "./state.js";
import { user, me, cycle } from "./domain.js";
import { render } from "./router.js";

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

export function toast(msg){
  const r = document.getElementById("toast-root");
  r.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  clearTimeout(r._t); r._t = setTimeout(()=>{ r.innerHTML=""; }, 2600);
}
export function confirmBox(title, body, okLabel, act){
  openModal({
    title,
    body:`<p>${esc(body)}</p>`,
    footer:`<button class="btn" data-act="closeModal">Cancel</button>
            <button class="btn primary" data-act="${act}">${esc(okLabel)}</button>`
  });
}

/* ---------- Shared UI fragments ---------- */
export function spine(value, caption){
  const v = value==null ? null : Math.max(1, Math.min(5, value));
  const pct = v==null ? 0 : ((v-1)/4)*100;
  return `<div class="spine">
    <div class="rail">${v==null?"":`<div class="pin" style="left:${pct}%"><div class="dot"></div><div class="val">${v.toFixed(2)}</div></div>`}</div>
    <div class="ticks"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
    ${caption?`<div class="small muted mt12">${caption}</div>`:""}
  </div>`;
}
export function blendBar(s1, s2, cyc){
  const w = (cyc||cycle()).weights;
  return `<div class="blend">
    <div class="seg s1" style="flex:${w.okr}">Score 1 · ${s1==null?"—":s1} × ${w.okr}</div>
    <div class="seg s2" style="flex:${w.comp}">Score 2 · ${s2==null?"—":s2} × ${w.comp}</div>
  </div>`;
}
export function scaleLegend(){
  return `<div class="tbl-wrap"><table>
    <thead><tr><th style="width:60px">Rating</th><th style="width:190px">Label</th><th>Meaning</th></tr></thead>
    <tbody>${SCALE.map(s=>`<tr${s.n===3?' style="background:var(--teal-wash)"':''}>
      <td class="num" style="font-weight:700">${s.n}</td><td style="font-weight:600">${esc(s.label)}</td><td class="muted">${esc(s.desc)}</td></tr>`).join("")}</tbody>
  </table></div>`;
}
export function personLine(u){
  return `<div class="row"><div class="avatar" style="background:var(--teal-light);color:var(--teal-dark)">${esc(initials(u.name))}</div>
    <div><div style="font-weight:600">${esc(u.name)}</div><div class="tiny muted">${esc(u.title)} · ${esc(u.unit)}</div></div></div>`;
}
export function threadHTML(rec, canPost, postAct){
  const items = (rec.transcript||[]);
  return `<div class="stack">
    <div class="thread">
      ${items.length? items.map(t=>`<div class="msg ${esc(t.role)}">
        <div class="mh"><span class="who">${esc(t.author)}</span>
          <span class="tag ${t.role==="coach"?"teal":t.role==="admin"?"amber":"grey"}">${esc(t.role)}</span>
          <span class="tiny muted" style="margin-left:auto">${fmtDT(t.ts)}</span></div>
        <div class="tx">${nl2(t.text)}</div></div>`).join("")
      : `<div class="empty small">No conversation notes recorded yet. Both the coach and the team member can add to this record — everything added here is downloadable by the administrator.</div>`}
    </div>
    ${canPost?`<div>
      <textarea data-bind="post_${rec.id}" placeholder="Add what was said, agreed, or raised — in your own words."></textarea>
      <div class="right mt8"><button class="btn primary sm" data-act="${postAct}" data-id="${rec.id}">Add to record</button></div>
    </div>`:""}
  </div>`;
}



export function pathSet(root, path, val){
  const parts = String(path).split("/"); let cur = root;
  for (let i=0;i<parts.length-1;i++){
    const p = parts[i];
    cur = Array.isArray(cur) ? cur.find(x=>x.id===p || x.name===p) : (cur[p]==null ? (cur[p]={}) : cur[p]);
    if (!cur) return false;
  }
  cur[parts[parts.length-1]] = val; return true;
}
export function bindInputs(){
  document.querySelectorAll("[data-set]").forEach(el=>{
    el.addEventListener("change", ()=>{
      let v = el.type==="checkbox" ? el.checked : el.value;
      if (el.dataset.type==="num")  v = (v===""||v==null) ? null : +v;
      if (el.dataset.type==="bool") v = (v==="true"||v===true);
      pathSet(S, el.dataset.set, v); save();
      if (el.dataset.live) render();
    });
  });
  document.querySelectorAll("[data-bind]").forEach(el=>{
    el.addEventListener("input", ()=>{ UI.draft[el.dataset.bind] = el.value; });
  });
}

