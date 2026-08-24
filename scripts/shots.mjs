import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const out = process.env.OUT || "/tmp/claude-0/-home-user-talent-ascend-bfwa/53ad2bf2-8ecd-5e06-8e55-6450853ffc0e/scratchpad";
const goTo = (p, r, id) => p.evaluate(([rt,i])=>{const e=document.createElement("button");
  e.dataset.act="go";e.dataset.route=rt;if(i)e.dataset.id=i;document.body.appendChild(e);e.click();e.remove();},[r,id]);

const page = await (await b.newContext({ viewport:{width:1400,height:1000} })).newPage();
await page.goto("http://localhost:4173", { waitUntil:"networkidle" });
await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:"networkidle"});
await page.screenshot({ path: `${out}/01-signin.png`, fullPage:false });

await page.getByText("Sumedha",{exact:true}).first().click();
await page.waitForSelector(".shell");
await goTo(page,"people"); await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/02-admin-people.png`, fullPage:true });
await goTo(page,"exports"); await page.waitForTimeout(150);
await page.screenshot({ path: `${out}/03-admin-exports.png`, fullPage:true });

const p2 = await (await b.newContext({ viewport:{width:1400,height:1000} })).newPage();
await p2.goto("http://localhost:4173", { waitUntil:"networkidle" });
await p2.evaluate(()=>localStorage.clear()); await p2.reload({waitUntil:"networkidle"});
await p2.getByText("Aryan Patel",{exact:true}).first().click();
await p2.waitForSelector(".shell");
await goTo(p2,"exports"); await p2.waitForTimeout(150);
await p2.screenshot({ path: `${out}/04-coach-exports.png`, fullPage:true });
await goTo(p2,"coachees"); await p2.waitForTimeout(150);
await p2.screenshot({ path: `${out}/05-coach-coachees.png`, fullPage:true });
await goTo(p2,"dash"); await p2.waitForTimeout(150);
await p2.screenshot({ path: `${out}/06-coach-denied.png` });
await b.close(); console.log("shots done");
