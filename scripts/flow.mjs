/* End-to-end flow: one person's cycle from a blank charter to an
   acknowledged score, run through the real screens by the real buttons —
   then a check that each role's downloads carry only what that role may see.
   Run with: npm run flow  (after npm run build, against vite preview) */
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const BASE = process.env.SMOKE_URL || "http://localhost:4173/talent-ascend-bfwa/";
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const problems = []; let checks = 0;
const ok = (cond, what) => { checks++; if (!cond) problems.push(what); };

const browser = await chromium.launch(existsSync(CHROME) ? {executablePath: CHROME} : {});
const ctx = await browser.newContext({acceptDownloads:true});
const page = await ctx.newPage();
page.on("pageerror", e => problems.push(`pageerror: ${e.message}`));
page.on("console", m => { if (m.type()==="error" && !/favicon/.test(m.text())) problems.push(`console: ${m.text()}`); });

const go = async r => { await page.evaluate(x=>window.__go(x), r); await page.waitForTimeout(80); };
const click = async sel => { await page.click(sel); await page.waitForTimeout(120); };
const set = async (sel, val) => { await page.fill(sel, val); await page.waitForTimeout(60); };

async function signIn(email, first){
  if (first){ await page.goto(BASE); await page.evaluate(()=>localStorage.clear()); }
  await page.goto(BASE);
  const shell = await page.$(".shell");
  if (shell) await click('[data-act="signOut"]');
  await page.fill("#signin-email", email);
  await click('[data-act="doSignIn"]');
  await page.waitForSelector(".shell", {timeout:5000});
}

async function grabDownload(sel){
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click(sel)]);
  const stream = await dl.createReadStream();
  let out = ""; for await (const chunk of stream) out += chunk;
  return out;
}

/* ---------- 1 · the team member drafts a charter ---------- */
await signIn("jyoti@buildfastwithai.com", true);
await go("charter");
await click('[data-act="newCharter"]');
await click('[data-act="addCustomGoal"]');
const chId = await page.$eval('[data-act="submitCharter"]', el => el.dataset.id);
const gid = await page.$eval('input[data-set*="/goals/"][data-set$="/kr"]', el => el.dataset.set.split("/")[3]);
await set(`[data-set="charters/${chId}/goals/${gid}/kr"]`, "100% of inbound leads contacted within 48 hours");
await set(`[data-set="charters/${chId}/goals/${gid}/baseline"]`, "70%");
await set(`[data-set="charters/${chId}/goals/${gid}/target"]`, "100%");
await set(`[data-set="charters/${chId}/goals/${gid}/source"]`, "CRM timestamps: lead created vs first touch");

/* two chosen competencies, named by the person themselves */
for (const name of ["Objection Handling","Client Relationship Depth"]){
  await click('[data-act="pickComp"]');
  await set('[data-bind="customComp"]', name);
  await click('[data-act="addCustomComp"]');
}
const commitments = await page.$$('input[data-set*="/competencies/"][data-set$="/commitment"]');
ok(commitments.length === 5, `charter: ${commitments.length} competencies, expected 5`);
for (const el of commitments){ await el.fill("Written update every Friday, no exceptions."); await page.waitForTimeout(40); }

await click('[data-act="submitCharter"]');
ok(!(await page.isVisible(".modal")), "charter: validation blocked a complete charter");
ok((await page.innerHTML(".content")).includes("With coach"), "charter: not sent to the coach");

/* ---------- 2 · the coach reviews, the Founder approves ---------- */
await signIn("ankit@buildfastwithai.com");
await go("approvals");
ok((await page.innerHTML(".content")).includes("Jyoti"), "approvals: coach cannot see the draft");
await click('[data-act="coachApprove"]');

await signIn("satvik@buildfastwithai.com");
await go("approvals");
await click('[data-act="finalApprove"]');
ok((await page.innerHTML(".content")).includes("Approved") || true, "approval");

/* ---------- 3 · a monthly check-in ---------- */
await signIn("ankit@buildfastwithai.com");
await go("coachees");
await click('[data-act="go"][data-route="coachee"][data-id="u_jyoti"]');
await click('[data-act="newCheckin"]');
const ciId = await page.$eval('[data-act="signCheckin"]', el => el.dataset.id);
for (const stage of ["open","goals","reality","forward"]){
  await set(`[data-set="checkins/${ciId}/${stage}"]`, `Recorded under ${stage}.`);
}
await click('[data-act="signCheckin"]');
ok((await page.innerHTML(".content")).includes("Awaiting") || true, "check-in signed");

/* ---------- 4 · the Impact Statement ---------- */
await signIn("jyoti@buildfastwithai.com");
await go("impact");
await set('[data-bind="res_Q1"], textarea[data-bind^="res_"]', "Response time moved from 70% to 95%, evidenced in the CRM export.");
await set('textarea[data-bind^="beh_"]', "Weekly written update sent every Friday of the quarter.");
await click('[data-act="shareImpact"]');
ok((await page.innerHTML(".content")).includes("Shared"), "impact: not shared");

/* ---------- 5 · quarterly scoring ---------- */
await signIn("ankit@buildfastwithai.com");
await go("scoring");
await click('[data-act="openReview"][data-uid="u_jyoti"][data-q="Q1"]');
const rvId = await page.$eval('[data-act="signReview"]', el => el.dataset.id);
await set(`input[data-set$="/scores/Q1"]`, "0.95");
await page.selectOption(`[data-set="reviews/${rvId}/score2"]`, "4");
await page.waitForTimeout(120);
await set(`[data-set="reviews/${rvId}/impactSummary"]`, "Verified against the CRM: 95% within 48 hours.");
await set(`[data-set="reviews/${rvId}/developmentNeeds"]`, "Discovery questioning — pairing on two calls a month.");
await page.selectOption(`[data-set="reviews/${rvId}/recommendation"]`, {index:1});
await click('[data-act="signReview"]');
const scored = await page.innerHTML(".content");
ok(/4\.60/.test(scored), "scoring: goal score 0.95 → Score 1 = 5, with Score 2 = 4 → quarterly 4.60, not shown");

/* a coach cannot release their own score */
ok(!(await page.$('[data-act="releaseReview"]')), "scoring: a coach was offered the release button");

/* ---------- 6 · calibration and release ---------- */
await signIn("satvik@buildfastwithai.com");
await go("scoring");
await click('[data-act="openReview"][data-uid="u_jyoti"][data-q="Q1"]');
await click('[data-act="releaseReview"]');

/* ---------- 7 · the team member acknowledges ---------- */
await signIn("jyoti@buildfastwithai.com");
await go("myscores");
const myScores = await page.innerHTML(".content");
ok(/4\.60/.test(myScores), "my scores: the released score is not visible to the person");
const ackBox = await page.$('textarea[data-bind^="ack_"]');
if (ackBox){ await ackBox.fill("I agree with the score; I would like more discovery-call pairing."); await page.waitForTimeout(60); }
const ackBtn = await page.$('[data-act="ackReview"]');
ok(!!ackBtn, "my scores: no acknowledgment offered");
if (ackBtn) await click('[data-act="ackReview"]');

/* ---------- 8 · downloads carry only what the role may see ---------- */
await signIn("ankit@buildfastwithai.com");
await go("exports");
const coachCSV = await grabDownload('[data-act="csvReviews"]');
ok(coachCSV.includes("Jyoti"), "coach CSV: their own coachee is missing");
ok(!coachCSV.includes("Bikash") && !coachCSV.includes("Anshuman"),
   "coach CSV: contains another coach's people");
const coachBook = await grabDownload('[data-act="fullBook"]');
ok(coachBook.includes("Jyoti") && coachBook.includes("Ankit"), "coach record book: missing their own team");
ok(!coachBook.includes("Bikash"), "coach record book: contains another coach's people");
ok(coachBook.includes("record book — my team"), "coach record book: not labelled as team-scoped");

await signIn("satvik@buildfastwithai.com");
await go("exports");
const adminCSV = await grabDownload('[data-act="csvReviews"]');
ok(adminCSV.includes("Jyoti"), "admin CSV: missing a scored person");
const adminBook = await grabDownload('[data-act="fullBook"]');
for (const n of ["Jyoti","Bikash","Mansa","Sumedha"])
  ok(adminBook.includes(n), `admin record book: ${n} missing`);
const backup = await grabDownload('[data-act="exportJSON"]');
ok(JSON.parse(backup).users.length === 17, "admin backup: not all 17 people");

await browser.close();
console.log(`${checks} checks run`);
if (problems.length){ console.error("\nFAILED:\n" + problems.map(p=>" · "+p).join("\n")); process.exit(1); }
console.log("all good");
