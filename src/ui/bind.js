/* ---------- Two-way binding for inputs rendered into the shell ---------- */
import { S, UI, save } from "../core/state.js";
import { render } from "./shell.js";

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