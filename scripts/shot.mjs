/* Screenshots of the main screens, for a quick visual check. */
import { chromium } from "playwright";
import { existsSync } from "node:fs";
const BASE = process.env.SMOKE_URL || "http://localhost:4173/talent-ascend-bfwa/";
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = process.env.SHOT_DIR || "/tmp";
const b = await chromium.launch(existsSync(CHROME)?{executablePath:CHROME}:{});
const p = await b.newPage({viewport:{width:1280,height:900}});
async function as(email){
  await p.goto(BASE);
  if (await p.$(".shell")) await p.click('[data-act="signOut"]');
  await p.fill("#signin-email", email); await p.click('[data-act="doSignIn"]');
  await p.waitForSelector(".shell"); await p.waitForTimeout(200);
}
await p.goto(BASE); await p.evaluate(()=>localStorage.clear());
await as("satvik@buildfastwithai.com");
for (const r of ["home","dash","people","exports"]){
  await p.evaluate(x=>window.__go(x), r); await p.waitForTimeout(250);
  await p.screenshot({path:`${OUT}/shot-admin-${r}.png`});
}
await as("ankit@buildfastwithai.com");
for (const r of ["home","coachees","exports"]){
  await p.evaluate(x=>window.__go(x), r); await p.waitForTimeout(250);
  await p.screenshot({path:`${OUT}/shot-coach-${r}.png`});
}
await as("jyoti@buildfastwithai.com");
for (const r of ["home","charter"]){
  await p.evaluate(x=>window.__go(x), r); await p.waitForTimeout(250);
  await p.screenshot({path:`${OUT}/shot-member-${r}.png`});
}
await b.close(); console.log("shots in", OUT);
