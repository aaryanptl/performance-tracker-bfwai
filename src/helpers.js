/* Small shared utilities: escaping, dates, downloads, CSV. */
export const uid = p => (p||"id") + "_" + Math.random().toString(36).slice(2,9);
export const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const nl2 = s => esc(s).replace(/\n/g,"<br>");
export const today = () => new Date().toISOString().slice(0,10);
export const nowISO = () => new Date().toISOString();
export function fmtDate(d){
  if(!d) return "—";
  const dt = new Date(d); if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}
export function fmtDT(d){
  if(!d) return "—";
  const dt = new Date(d); if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) + ", " +
         dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
}
export const initials = n => (n||"?").split(/[\s.]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
export function download(filename, text, mime){
  const blob = new Blob([text], {type:(mime||"text/plain")+";charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 400);
}
export function csvCell(v){
  const s = String(v==null?"":v).replace(/\r?\n/g," ⏎ ");
  return /[",]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
export const toCSV = rows => rows.map(r=>r.map(csvCell).join(",")).join("\r\n");
