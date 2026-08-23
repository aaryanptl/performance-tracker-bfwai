/* =====================================================================
   STATE & STORAGE
   The whole application is one JSON document (see the data model in the
   documentation). It is held in this browser's localStorage.

   Making it multi-user: replace loadState() and save() with calls to your
   API. Nothing else in the application needs to change — every screen and
   every action already goes through these two functions.
   ===================================================================== */

import { uid } from "./helpers.js";
import { rosterUsers } from "./data/roster.js";

export const STORE_KEY   = "ascend:pms:v1";
export const SESSION_KEY = "ascend:signed-in-email:v1";

export let S = null;                                        // application state
export const UI = { route:"home", params:{}, draft:{}, sidebar:false };

export function setS(next){ S = next; }

export function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  }catch(e){ /* first run, or storage unavailable */ }
  return null;
}

/* Written straight through rather than debounced: a person who signs a
   check-in and closes the tab in the same second must not lose it, and
   localStorage.setItem on a document this size costs a millisecond. */
export function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch(e){ /* private mode, or storage full — Download a full backup instead */ }
}

/* The signed-in person is remembered separately from the records, so that
   restoring a backup never signs anybody in as somebody else. */
export function readSignedInEmail(){
  try{ return localStorage.getItem(SESSION_KEY); }catch(e){ return null; }
}
export function writeSignedInEmail(email){
  try{ email ? localStorage.setItem(SESSION_KEY, email) : localStorage.removeItem(SESSION_KEY); }
  catch(e){ /* ignore */ }
}

/* ---------- The cycle the programme opens with ----------
   Six months, two quarters, 60/40 weights, six monthly check-ins.
   Dates and weights are editable under Cycles & Settings. */
export function seed(){
  const C1 = {
    id:"C1", name:"Cycle 1 · H1 FY2026", start:"2026-09-01", end:"2027-02-28",
    goalWindow:{from:"2026-08-21", to:"2026-08-31"},
    checkins:6, weights:{okr:0.6, comp:0.4}, maxGoals:5, competencies:5,
    quarters:[
      {id:"Q1", label:"Q1 · Sep–Nov 2026", scoreBy:"2026-11-30", review:false},
      {id:"Q2", label:"Q2 · Dec–Feb 2027", scoreBy:"2027-02-28", review:true}
    ],
    locked:false
  };

  return {
    version: 2,
    product: {name:"Ascend", tagline:"Performance Management System"},
    session: {userId:null, cycleId:"C1"},
    cycles: [C1],
    users: rosterUsers(),
    charters: [], checkins: [], impacts: [], reviews: [],
    audit: [{id:uid("a"), ts:new Date().toISOString(), userId:null,
             action:"Programme created", detail:`${rosterUsers().length} people loaded from the headcount roster`}],
    settings: {approverLabel:"Founder", hrLabel:"People & HR", scoresVisibleToMember:true}
  };
}

/* Brings an existing browser's records up to date with the roster file:
   new joiners are added, coach allocation, role, unit, title and email are
   re-applied. Nobody's charters, check-ins, statements or scores are touched. */
export function syncRoster(){
  const fromFile = rosterUsers();
  fromFile.forEach(p=>{
    const existing = S.users.find(u=>u.id===p.id);
    if (existing) Object.assign(existing, p);
    else S.users.push(p);
  });
}
