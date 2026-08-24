/* =====================================================================
   SEED
   First-run state, built from the headcount report rather than from
   invented sample people.

   Deliberate choice: the "Performance Tracker" tab of the report carries
   no ratings yet — every person is "Pending" — so no charters, check-ins
   or scores are fabricated here for real, named colleagues. The app opens
   with the true roster and an empty cycle, ready for the team to fill in.
   ===================================================================== */

import { ROSTER, REPORTING_PERIOD } from "../data/roster.js";

export function seed() {
  const C1 = {
    id: "C1",
    name: `Cycle 1 · ${REPORTING_PERIOD}`,
    start: "2026-09-01",
    end: "2027-02-28",
    goalWindow: { from: "2026-08-21", to: "2026-08-31" },
    checkins: 6,
    weights: { okr: 0.6, comp: 0.4 },
    maxGoals: 5,
    competencies: 5,
    quarters: [
      { id: "Q1", label: "Q1 · Sep–Nov 2026", scoreBy: "2026-11-30", review: false },
      { id: "Q2", label: "Q2 · Dec–Feb 2027", scoreBy: "2027-02-28", review: true }
    ],
    locked: false
  };

  /* The roster is copied, not referenced, so edits in People & Coaches
     never write back into the imported source data. */
  const users = ROSTER.map(u => ({ ...u }));

  return {
    version: 2,
    product: { name: "Ascend", tagline: "Performance Management System" },
    org: { name: "Build Fast with AI", period: REPORTING_PERIOD },
    /* No one is signed in on a first run — the sign-in screen decides the
       identity, and the identity decides the scope. */
    session: { userId: null, adminId: null, viewingAs: null, cycleId: C1.id },
    cycles: [C1],
    users,
    charters: [],
    checkins: [],
    impacts: [],
    reviews: [],
    audit: [],
    settings: {
      approverLabel: "Leadership",
      hrLabel: "People & HR",
      scoresVisibleToMember: true
    }
  };
}
