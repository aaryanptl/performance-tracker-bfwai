/* Renders every route, and every record sub-page, as each role — with
   records planted — and fails on any runtime error or empty view. */
import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:4173";
const fails = [], ok = [];
const check = (n, c, e = "") => (c ? ok : fails).push(`${c ? "PASS" : "FAIL"} · ${n}${e ? " — " + e : ""}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

const ROUTES = ["home","charter","checkins","impact","myscores","coachees","approvals","scoring",
                "dash","people","cycles","exports","library","docs"];

const FIXTURE = page => page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("ascend:pms:v1"));
  const cyc = raw.cycles[0].id;
  [["u_anshuman","u_aryan_patel"],["u_bikash","u_aryan_patel"],["u_avi","u_sanjeev_patel"]]
    .forEach(([userId, coachId]) => {
      raw.charters.push({ id:"ch_"+userId, userId, cycleId:cyc, coachId, status:"coach_review",
        goals:[{id:"g1",objective:"O",kr:"KR",baseline:"1",target:"2",source:"s",actuals:{Q1:"a"},scores:{Q1:0.9}}],
        competencies:[{name:"Communication",fixed:true,commitment:"C"}] });
      raw.checkins.push({ id:"ci_"+userId, userId, coachId, cycleId:cyc, no:1, date:"2026-09-20",
        open:"o", goals:"g", reality:"r", forward:"f", transcript:[] });
      raw.impacts.push({ id:"im_"+userId, userId, cycleId:cyc, period:"Q1", results:"r",
        behaviours:"b", submittedAt:"2026-11-01T10:00:00Z", transcript:[] });
      raw.reviews.push({ id:"rv_"+userId, userId, coachId, cycleId:cyc, period:"Q1", score1:4, score2:4,
        quarterly:4, impactSummary:"s", developmentNeeds:"d", recommendation:"On track — continue",
        released:true, transcript:[] });
    });
  localStorage.setItem("ascend:pms:v1", JSON.stringify(raw));
});

const goTo = (page, route, id) => page.evaluate(([rt, i]) => {
  const el = document.createElement("button");
  el.dataset.act = "go"; el.dataset.route = rt; if (i) el.dataset.id = i;
  document.body.appendChild(el); el.click(); el.remove();
}, [route, id]);

for (const who of ["Sumedha", "Satvik", "Aryan Patel", "Sanjeev Patel", "Bikash", "Jyoti"]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).split("\n")[0]));
  page.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push("console: " + m.text()); });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await FIXTURE(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(who, { exact: true }).first().click();
  await page.waitForSelector(".shell");

  for (const r of ROUTES) {
    await goTo(page, r);
    await page.waitForTimeout(40);
    const body = await page.textContent(".content").catch(() => "");
    check(`${who} · ${r} renders`, (body || "").trim().length > 40, `${(body || "").length} chars`);
  }

  /* Every record page the role's own nav offers, opened the way a user would. */
  await goTo(page, "coachees");
  const openBtns = await page.$$('[data-act="go"][data-route="coachee"]');
  for (let i = 0; i < openBtns.length; i++) {
    await goTo(page, "coachees");
    const btns = await page.$$('[data-act="go"][data-route="coachee"]');
    await btns[i].click();
    await page.waitForTimeout(40);
    const body = await page.textContent(".content");
    check(`${who} · coachee page ${i + 1} renders`, !/Not available to you/.test(body) && body.length > 200);
  }

  check(`${who}: no runtime errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

await browser.close();
const failed = fails.length;
console.log(`${ok.length} passed, ${failed} failed`);
if (failed) { console.log(fails.join("\n")); process.exit(1); }
