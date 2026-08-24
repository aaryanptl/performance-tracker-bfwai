/* ---------- Shared UI fragments used across several views ---------- */
import { esc, initials } from "../core/helpers.js";
import { cycle, reviewOf, user } from "../core/domain.js";
import { SCALE } from "../data/constants.js";
import { scopeLabel } from "../core/access.js";

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

/** A one-line reminder of the signed-in person's scope. Rendered at the top
    of every view that lists other people, so the boundary is always visible. */
export function scopeBar() {
  return `<div class="scopebar small mb16">
    <span class="ic"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 2.2l4.6 1.9v3.5c0 2.7-1.9 4.7-4.6 5.6-2.7-.9-4.6-2.9-4.6-5.6V4.1z"/>
      <path d="M6.1 8l1.4 1.4L10 6.6"/></svg></span>
    <span>${esc(scopeLabel())}</span>
  </div>`;
}
