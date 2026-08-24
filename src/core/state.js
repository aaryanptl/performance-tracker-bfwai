/* =====================================================================
   STATE & STORAGE
   `S` is the whole application state; `UI` is transient view state.
   Both are exported as live bindings — other modules read and mutate
   them directly, only this module (and boot) ever reassigns `S`.
   ===================================================================== */

export let S = null;
export const UI = { route: "home", params: {}, draft: {}, sidebar: false };

export const STORE_KEY = "ascend:pms:v1";

export function setS(next) { S = next; return S; }

/* Persistence prefers the host `window.storage` bridge when the app is
   embedded, and falls back to localStorage for a normal web deployment. */
export async function loadState() {
  try {
    if (window.storage) {
      const r = await window.storage.get(STORE_KEY, false);
      if (r && r.value) return JSON.parse(r.value);
    }
  } catch (e) { /* bridge unavailable — fall through to localStorage */ }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* first run, private mode, or blocked site data */ }
  return null;
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const payload = JSON.stringify(S);
    try { if (window.storage) await window.storage.set(STORE_KEY, payload, false); }
    catch (e) { /* bridge unavailable */ }
    try { localStorage.setItem(STORE_KEY, payload); }
    catch (e) { /* quota or blocked site data — use the JSON backup instead */ }
  }, 400);
}

/* Wipe the stored copy. Used by "reset to the roster" in Cycles & Settings. */
export function clearStore() {
  try { if (window.storage) window.storage.set(STORE_KEY, "", false); } catch (e) { /* noop */ }
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
}
