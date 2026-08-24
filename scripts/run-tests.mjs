/* Builds, serves the built app, and runs the access and route suites
   against it. This is what `npm test` runs. */
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.PORT || 4173;
const BASE = `http://localhost:${PORT}`;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...opts });
  return r.status ?? 1;
}

if (run("npx", ["vite", "build"]) !== 0) process.exit(1);

const server = spawn("npx", ["vite", "preview", "--port", String(PORT)], { stdio: "ignore" });
const stop = () => { try { server.kill("SIGTERM"); } catch { /* already gone */ } };
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(130); });

/* Wait for the preview server rather than guessing at a fixed delay. */
let up = false;
for (let i = 0; i < 40 && !up; i++) {
  try { up = (await fetch(BASE)).ok; } catch { await sleep(250); }
}
if (!up) { console.error(`preview server did not come up on ${BASE}`); stop(); process.exit(1); }

let failed = 0;
for (const suite of ["scripts/smoke.mjs", "scripts/access.test.mjs", "scripts/routes.test.mjs"]) {
  console.log(`\n--- ${suite}`);
  if (run("node", [suite], { env: { ...process.env, BASE } }) !== 0) failed++;
}
stop();
process.exit(failed ? 1 : 0);
