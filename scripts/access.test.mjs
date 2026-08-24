/* =====================================================================
   Access-scope test.

   Route guards are not enough: the real requirement is that what a coach
   can *download* contains their own team and no one else's. This test
   plants records for several people, then downloads as an administrator,
   as a coach and as a team member, and reads the files back.
   ===================================================================== */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:4173";
const fails = [], ok = [];
const check = (name, cond, extra = "") =>
  (cond ? ok : fails).push(`${cond ? "PASS" : "FAIL"} · ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

/* Records planted across three different coaching trees. */
const FIXTURE = page => page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("ascend:pms:v1"));
  const cyc = raw.cycles[0].id;
  const mk = (userId, coachId) => {
    raw.charters.push({ id: "ch_" + userId, userId, cycleId: cyc, coachId, status: "approved",
      goals: [{ id: "g1", objective: "O", kr: "KR", baseline: "1", target: "2", source: "src",
                actuals: { Q1: "done" }, scores: { Q1: 0.9 } }],
      competencies: [{ name: "Communication", fixed: true, commitment: "C" }] });
    raw.checkins.push({ id: "ci_" + userId, userId, coachId, cycleId: cyc, no: 1, date: "2026-09-20",
      open: "o", goals: "g", reality: "r", forward: "f",
      transcript: [{ id: "t_" + userId, ts: "2026-09-20T10:00:00Z", authorId: coachId,
                     author: "coach", role: "coach", kind: "note", text: "note for " + userId }] });
    raw.reviews.push({ id: "rv_" + userId, userId, coachId, cycleId: cyc, period: "Q1",
      score1: 4, score2: 4, quarterly: 4, impactSummary: "s", developmentNeeds: "d",
      recommendation: "On track — continue", released: true, transcript: [] });
  };
  mk("u_anshuman", "u_aryan_patel");   // Aryan's coachee
  mk("u_bikash",   "u_aryan_patel");   // Aryan's coachee
  mk("u_avi",      "u_sanjeev_patel"); // Sanjeev's coachee — NOT Aryan's
  mk("u_jyoti",    "u_ankit_choudhary");
  mk("u_aryan_patel", "u_satvik");     // the coach's own record
  localStorage.setItem("ascend:pms:v1", JSON.stringify(raw));
});

async function signInAs(name, withFixture = true) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  if (withFixture) { await FIXTURE(page); await page.reload({ waitUntil: "networkidle" }); }
  await page.getByText(name, { exact: true }).first().click();
  await page.waitForSelector(".shell");
  return { ctx, page, errors };
}

async function grab(page, act) {
  const has = await page.$(`[data-act="${act}"]`);
  if (!has) return { present: false, text: null };
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 4000 }).catch(() => null),
    page.click(`[data-act="${act}"]`)
  ]);
  if (!dl) return { present: true, text: null };
  return { present: true, text: readFileSync(await dl.path(), "utf8") };
}

const goTo = (page, route, id) => page.evaluate(([rt, i]) => {
  const el = document.createElement("button");
  el.dataset.act = "go"; el.dataset.route = rt; if (i) el.dataset.id = i;
  document.body.appendChild(el); el.click(); el.remove();
}, [route, id]);

/* ---------- administrator ---------- */
{
  const { ctx, page, errors } = await signInAs("Sumedha");
  await goTo(page, "exports");

  const rows = await page.$$eval("#person-record-list tbody tr", r => r.length);
  check("admin: record list shows all 17 people", rows === 17, `saw ${rows}`);

  const people = await grab(page, "csvPeople");
  check("admin: people CSV has all 17 rows", people.text && people.text.trim().split("\r\n").length === 18,
        people.text ? `${people.text.trim().split("\r\n").length - 1} rows` : "no file");

  const reviews = await grab(page, "csvReviews");
  check("admin: scores CSV includes another coach's coachee (Avi)", /Avi/.test(reviews.text || ""));
  check("admin: scores CSV includes Jyoti", /Jyoti/.test(reviews.text || ""));

  const ci = await grab(page, "csvCheckins");
  check("admin: check-ins CSV covers all 5 planted records",
        (ci.text || "").trim().split("\r\n").length === 6,
        `${(ci.text || "").trim().split("\r\n").length - 1} rows`);

  check("admin: full record book button present", !!(await page.$('[data-act="fullBook"]')));
  check("admin: JSON backup button present", !!(await page.$('[data-act="exportJSON"]')));
  check("admin: activity log present", !!(await page.$('[data-act="csvAudit"]')));
  check("admin: no runtime errors", errors.length === 0, errors[0] || "");
  await ctx.close();
}

/* ---------- coach (Aryan: coaches Anshuman and Bikash only) ---------- */
{
  const { ctx, page, errors } = await signInAs("Aryan Patel");
  await goTo(page, "exports");

  const names = await page.$$eval("#person-record-list tbody tr td:first-child", r => r.map(x => x.textContent.replace(/\s+/g, " ").trim()));
  check("coach: record list is self + 2 coachees", names.length === 3, `saw ${names.length}: ${names.join(", ")}`);
  check("coach: record list contains own name", names.some(n => /Aryan/.test(n)));
  check("coach: record list contains coachees", names.some(n => /Anshuman/.test(n)) && names.some(n => /Bikash/.test(n)));
  check("coach: record list excludes another coach's coachee (Avi)", !names.some(n => /\bAvi\b/.test(n)));
  check("coach: record list excludes Jyoti", !names.some(n => /Jyoti/.test(n)));

  const people = await grab(page, "csvPeople");
  check("coach: people CSV has 3 rows", people.text && people.text.trim().split("\r\n").length === 4,
        people.text ? `${people.text.trim().split("\r\n").length - 1} rows` : "no file");
  check("coach: people CSV excludes Avi", !/,Avi,|^Avi,/m.test(people.text || ""));

  const reviews = await grab(page, "csvReviews");
  check("coach: scores CSV includes own coachees", /Anshuman/.test(reviews.text || "") && /Bikash/.test(reviews.text || ""));
  check("coach: scores CSV excludes Avi", !/(^|,|")Avi(,|"|$)/m.test(reviews.text || ""));
  check("coach: scores CSV excludes Jyoti", !/Jyoti/.test(reviews.text || ""));

  const tr = await grab(page, "csvTranscript");
  check("coach: transcript CSV excludes other teams",
        !/u_avi|note for u_avi|note for u_jyoti/.test(tr.text || ""));
  check("coach: transcript CSV includes own team", /note for u_anshuman/.test(tr.text || ""));

  const ch = await grab(page, "csvCharters");
  check("coach: charters CSV limited to own team",
        (ch.text || "").split("\r\n").filter(l => /Anshuman|Bikash|Aryan/.test(l)).length > 0 &&
        !/Avi|Jyoti/.test(ch.text || ""));

  check("coach: no full record book button", !(await page.$('[data-act="fullBook"]')));
  check("coach: no JSON backup button", !(await page.$('[data-act="exportJSON"]')));
  check("coach: no activity log button", !(await page.$('[data-act="csvAudit"]')));
  check("coach: has a team record book button", !!(await page.$('[data-act="teamBook"]')));

  /* Reaching past the scope by id, the way a stale link would. */
  await goTo(page, "transcript", "u_avi");
  const denied = await page.textContent(".content");
  check("coach: transcript of a non-coachee is refused", /Not available to you/.test(denied));

  await goTo(page, "coachee", "u_jyoti");
  const denied2 = await page.textContent(".content");
  check("coach: coachee page for a non-coachee is refused", /Not available to you/.test(denied2));

  /* Downloading a non-coachee's record book directly must produce no file. */
  const leaked = await page.evaluate(async () => {
    const el = document.createElement("button");
    el.dataset.act = "personBook"; el.dataset.id = "u_avi";
    document.body.appendChild(el); el.click(); el.remove();
    await new Promise(r => setTimeout(r, 300));
    return document.querySelector(".toast") ? document.querySelector(".toast").textContent : "";
  });
  check("coach: personBook for a non-coachee is refused", /outside your scope/i.test(leaked), leaked);

  check("coach: no runtime errors", errors.length === 0, errors[0] || "");
  await ctx.close();
}

/* ---------- team member ---------- */
{
  const { ctx, page, errors } = await signInAs("Bikash");
  await goTo(page, "exports");
  const body = await page.textContent(".content");
  check("member: records page is refused", /Not available to you/.test(body));

  await goTo(page, "myscores");
  const scores = await page.textContent(".content");
  check("member: can read own scores", !/Not available to you/.test(scores) && scores.length > 200);

  await goTo(page, "transcript", "u_anshuman");
  const other = await page.textContent(".content");
  check("member: another person's record is refused", /Not available to you/.test(other));

  check("member: no runtime errors", errors.length === 0, errors[0] || "");
  await ctx.close();
}

await browser.close();
console.log(ok.join("\n"));
if (fails.length) { console.log("\n" + fails.join("\n")); process.exit(1); }
console.log(`\nAll ${ok.length} checks passed.`);
