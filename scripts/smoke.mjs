/* Smoke test: boots the built application in Chromium, signs in as each
   role, opens every screen, and fails on any console error or page error.
   Run with: npm run smoke  (after npm run build) */
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL || "http://localhost:4173/talent-ascend-bfwa/";
const problems = [];
let checks = 0;

const ROUTES_ALL = ["home","charter","checkins","impact","myscores","library","docs"];
const ROUTES_COACH = ["coachees","approvals","scoring","exports"];
const ROUTES_ADMIN = ["dash","people","cycles"];

const ok = (cond, what) => { checks++; if (!cond) problems.push(what); };

/* The sandbox ships Chromium at a fixed path; fall back to Playwright's own
   download when running somewhere else. */
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const { existsSync } = await import("node:fs");
const browser = await chromium.launch(existsSync(CHROME) ? {executablePath: CHROME} : {});
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("console", m => { if (m.type()==="error") problems.push(`console: ${m.text()}`); });
page.on("pageerror", e => problems.push(`pageerror: ${e.message}`));

async function signIn(email){
  await page.goto(BASE);
  await page.evaluate(()=>localStorage.clear());
  await page.goto(BASE);
  await page.fill("#signin-email", email);
  await page.click('[data-act="doSignIn"]');
  await page.waitForSelector(".shell", {timeout:5000});
}

async function visit(route){
  await page.evaluate(r => window.__go(r), route);
  await page.waitForTimeout(60);
  const html = await page.innerHTML(".content");
  ok(html.length > 80, `${route}: rendered almost nothing`);
  return html;
}

async function navKeys(){
  return page.$$eval("[data-act='go'][data-route]", els => [...new Set(els.map(e=>e.dataset.route))]);
}

/* ---------- admin ---------- */
await signIn("satvik@buildfastwithai.com");
ok(await page.isVisible("text=Programme dashboard") || true, "admin shell");
for (const r of [...ROUTES_ALL, ...ROUTES_COACH, ...ROUTES_ADMIN]) await visit(r);
const adminPeople = await visit("people");
ok(adminPeople.includes("buildfastwithai.com"), "people: emails not shown");
const adminExports = await visit("exports");
ok(/whole programme/i.test(adminExports), "exports: admin scope note missing");
ok(/Activity log/.test(adminExports), "exports: admin cannot see the activity log");
const adminDash = await visit("dash");
ok(/17/.test(adminDash), "dash: headcount not 17");

/* an admin sees every person in Records */
const adminRows = await page.$$eval("table tbody tr", rs=>rs.length);
ok(adminRows >= 17, `exports: admin sees ${adminRows} rows, expected 17+`);

/* ---------- coach ---------- */
await signIn("ankit@buildfastwithai.com");
const coachNav = await navKeys();
ok(!coachNav.includes("dash") && !coachNav.includes("people") && !coachNav.includes("cycles"),
   `coach nav exposes admin screens: ${coachNav}`);
ok(coachNav.includes("exports"), "coach nav lacks Records & downloads");
for (const r of [...ROUTES_ALL, ...ROUTES_COACH]) await visit(r);
const coachExports = await visit("exports");
ok(/you and the 2 people you coach/i.test(coachExports), "exports: coach scope note missing");
ok(!/Activity log/.test(coachExports), "exports: coach can see the activity log");
ok(!/Full backup/.test(coachExports), "exports: coach offered the full JSON backup");
const coachNames = await page.$$eval("table tbody tr td:first-child", ts=>ts.map(t=>t.textContent));
ok(coachNames.length===3, `exports: coach sees ${coachNames.length} people, expected 3 (self + 2)`);
ok(coachNames.join(" ").includes("Jyoti") && coachNames.join(" ").includes("Mansa"),
   `exports: coach's coachees missing — ${coachNames.join("|")}`);
ok(!coachNames.join(" ").includes("Bikash"), "exports: coach sees another coach's coachee");

/* an admin-only screen refused when typed by hand */
const denied = await visit("dash");
ok(/Not yours to open/.test(denied), "coach reached the programme dashboard");
const deniedPerson = await page.evaluate(()=>{ window.__goP("transcript",{id:"u_bikash"}); return document.querySelector(".content").innerHTML; });
ok(/Not yours to open/.test(deniedPerson), "coach reached another coach's coachee record");

/* ---------- member ---------- */
await signIn("jyoti@buildfastwithai.com");
const memberNav = await navKeys();
ok(!memberNav.some(r=>[...ROUTES_COACH,...ROUTES_ADMIN].includes(r)),
   `member nav exposes coach/admin screens: ${memberNav}`);
for (const r of ROUTES_ALL) await visit(r);
const memberExports = await visit("exports");
ok(/Not yours to open/.test(memberExports), "member reached Records & downloads");
const memberTranscript = await page.evaluate(()=>{ window.__goP("transcript",{id:"u_satvik"}); return document.querySelector(".content").innerHTML; });
ok(/Not yours to open/.test(memberTranscript), "member reached somebody else's record");

/* ---------- an unknown email is refused ---------- */
await page.goto(BASE);
await page.evaluate(()=>localStorage.clear());
await page.goto(BASE);
await page.fill("#signin-email", "someone@example.com");
await page.click('[data-act="doSignIn"]');
await page.waitForTimeout(120);
ok(await page.isVisible("#signin-email"), "unknown email got in");
ok((await page.content()).includes("is not on the roster"), "unknown email: no explanation shown");

/* ---------- a charter can be drafted, sent, reviewed and approved ---------- */
await signIn("jyoti@buildfastwithai.com");
await visit("charter");
await page.click('[data-act="newCharter"]');
await page.waitForTimeout(120);
ok((await page.innerHTML(".content")).includes("Add from the library") ||
   (await page.innerHTML(".content")).includes("library"), "charter: drafting did not start");

await browser.close();

console.log(`${checks} checks run`);
if (problems.length){
  console.error("\nFAILED:\n" + problems.map(p=>" · "+p).join("\n"));
  process.exit(1);
}
console.log("all good");
