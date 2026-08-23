import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files=[];
(function walk(d){ for(const f of readdirSync(d)){ const p=join(d,f); if(statSync(p).isDirectory()) walk(p); else if(p.endsWith(".js")) files.push(p);} })("src");

/* Comments are prose, not code: a sentence mentioning "downloads (" must not
   read as a call. Template literals are kept — most view code lives inside one. */
const strip = s => s
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, "$1");

// exported names per file
const exports_={}, sources={};
for (const f of files){
  const s=readFileSync(f,"utf8"); sources[f]=strip(s);
  const names=[...s.matchAll(/^export (?:async )?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m=>m[1]);
  exports_[f]=names;
}
const all=new Map();           // name -> file
for (const f of files) for (const n of exports_[f]) { if(!all.has(n)) all.set(n,f); }

let bad=0;
for (const f of files){
  if (f.includes("/data/")) continue;   // data files declare no behaviour
  const s=sources[f];
  const imported=new Set([...s.matchAll(/import\s*\{([^}]*)\}\s*from/g)]
      .flatMap(m=>m[1].split(",").map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)));
  const declared=new Set([...s.matchAll(/(?:^|\n)\s*(?:export )?(?:async )?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]));
  // any exported-elsewhere name used here but neither imported nor declared
  for (const [n,src] of all){
    if (src===f || imported.has(n) || declared.has(n)) continue;
    const re=new RegExp(`(^|[^\\w$.'"\`])${n.replace(/\$/g,"\\$")}\\s*[(\\[.,)]`,"m");
    if (re.test(s)){ console.log(`${f}: uses "${n}" (exported by ${src}) but does not import it`); bad++; }
  }
}
console.log(bad ? `\n${bad} missing import(s)` : "no missing imports");
