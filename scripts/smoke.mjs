/* =====================================================================
   Navigation and route-guard suite.

   Signs in as an administrator, a coach and a team member and checks two
   things for each: that the sidebar offers only what the role may reach,
   and that driving the router straight at a restricted route is refused
   rather than rendered.
   ===================================================================== */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:4173";
const fails = [];
const ok = [];
const check = (name, cond, extra = "") =>
  (cond ? ok : fails).push(`${cond ? "PASS" : "FAIL"} · ${name}${extra ? " — " + extra : ""}`);

const ROUTES = ["home","charter","checkins","impact","myscores","coachees","approvals",
                "scoring","dash","people","cycles","exports","library","docs"];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

async function session(personName) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText(personName, { exact: true }).first().click();
  await page.waitForSelector(".shell", { timeout: 5000 });

  const nav = await page.$$eval(".nav", els => els.map(e => e.textContent.trim()));

  /* Reach every route the way a stale link or a hand-typed URL would: drive
     the router directly, not only through the nav buttons the role can see. */
  const routeInfo = {};
  for (const r of ROUTES) {
    await page.evaluate(rt => {
      const el = document.createElement("button");
      el.dataset.act = "go"; el.dataset.route = rt;
      document.body.appendChild(el); el.click(); el.remove();
    }, r);
    await page.waitForTimeout(50);
    const body = await page.textContent(".content").catch(() => "");
    routeInfo[r] = { denied: /Not available to you/.test(body || ""), len: (body || "").length };
  }
  await ctx.close();
  return { nav, errors, routeInfo, page };
}

/* ---------- administrator ---------- */
{
  const { nav, errors, routeInfo } = await session("Sumedha");
  check("admin: no runtime errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("admin: sees Programme Dashboard", nav.some(n => n.includes("Programme Dashboard")));
  check("admin: sees People & Coaches", nav.some(n => n.includes("People & Coaches")));
  check("admin: sees Records & Downloads", nav.some(n => n.includes("Records & Downloads")));
  check("admin: dashboard renders", !routeInfo.dash.denied && routeInfo.dash.len > 200);
  check("admin: people renders", !routeInfo.people.denied && routeInfo.people.len > 200);
}

/* ---------- coach ---------- */
{
  const { nav, errors, routeInfo } = await session("Aryan Patel");
  check("coach: no runtime errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("coach: no Programme Dashboard in nav", !nav.some(n => n.includes("Programme Dashboard")));
  check("coach: no People & Coaches in nav", !nav.some(n => n.includes("People & Coaches")));
  check("coach: no Cycles & Settings in nav", !nav.some(n => n.includes("Cycles & Settings")));
  check("coach: has My Coachees", nav.some(n => n.includes("My Coachees")));
  check("coach: has Records & Downloads", nav.some(n => n.includes("Records & Downloads")));
  check("coach: dash route denied", routeInfo.dash.denied);
  check("coach: people route denied", routeInfo.people.denied);
  check("coach: cycles route denied", routeInfo.cycles.denied);
  check("coach: exports route allowed", !routeInfo.exports.denied);
}

/* ---------- member ---------- */
{
  const { nav, errors, routeInfo } = await session("Bikash");
  check("member: no runtime errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("member: no coaching group in nav", !nav.some(n => n.includes("My Coachees")));
  check("member: no Records & Downloads", !nav.some(n => n.includes("Records & Downloads")));
  check("member: exports route denied", routeInfo.exports.denied);
  check("member: coachees route denied", routeInfo.coachees.denied);
  check("member: own overview renders", !routeInfo.home.denied && routeInfo.home.len > 200);
}

await browser.close();
console.log(ok.join("\n"));
if (fails.length) { console.log("\n" + fails.join("\n")); process.exit(1); }
console.log(`\nAll ${ok.length} checks passed.`);
