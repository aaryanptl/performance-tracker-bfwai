import { LIBRARY_COMPETENCIES } from "@/data/library";
import type { CheckInStage, Cycle, CycleStage, Level, LibraryCompetency, Rating } from "@/lib/types";

export const ACTIVE_CYCLE: Cycle = {
  id: "C1",
  name: "Cycle 1 · FY2026",
  start: "2026-09-01",
  end: "2027-02-28",
  goalWindow: { from: "2026-08-21", to: "2026-08-31" },
  checkins: 6,
  weights: { okr: 0.6, competency: 0.4 },
  maxGoals: 5,
  status: "Active",
};

export const RATINGS: Rating[] = [
  {
    value: 5,
    label: "Exceptional",
    description: "Consistently exceeds all goals; role-model behaviours. Rare by definition.",
  },
  {
    value: 4,
    label: "Exceeds expectations",
    description: "Surpasses most goals; strong behaviours.",
  },
  {
    value: 3,
    label: "Meets expectations",
    description:
      "Delivers agreed goals reliably. A good, solid rating — the expected centre of gravity.",
  },
  {
    value: 2,
    label: "Partially meets",
    description: "Delivers some goals; specific coaching areas are named.",
  },
  {
    value: 1,
    label: "Does not meet",
    description: "Significant gaps; a structured improvement plan follows.",
  },
];

/** Goal attainment (0.0–1.0) converts to Score 1 through these bands. */
export const SCORE_BANDS = [
  { rating: 5, range: "0.95 and above" },
  { rating: 4, range: "0.80 – 0.94" },
  { rating: 3, range: "0.65 – 0.79" },
  { rating: 2, range: "0.45 – 0.64" },
  { rating: 1, range: "below 0.45" },
] as const;

export const CHECKIN_MONTHS = [
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
] as const;
export const CHARTER_STEPS = [
  { title: "You draft", detail: "goals + competencies" },
  { title: "Coach reviews", detail: "targets, measurability" },
  { title: "Leadership approves", detail: "final sign-off" },
  { title: "Locked for the cycle", detail: "your Goal Charter" },
] as const;

export const CHARTER_FIXED_COMPETENCIES = 3;
export const CHARTER_CHOSEN_COMPETENCIES = 2;

export const COMMON_UNIT = "All Units (Common)";
export const COACH_ADDON_UNIT = "Coaches (Add-on)";

/** The three competencies every charter carries for every role. */
export function fixedCompetenciesFor(): LibraryCompetency[] {
  return LIBRARY_COMPETENCIES.filter(
    (competency) => competency.mandatory && competency.unit === COMMON_UNIT,
  );
}

/** Everything a member can pick with their coach for the open slots. */
export function choosableCompetencies(): LibraryCompetency[] {
  return LIBRARY_COMPETENCIES.filter((competency) => !competency.mandatory);
}

export function competencyByName(name: string): LibraryCompetency | undefined {
  return LIBRARY_COMPETENCIES.find((competency) => competency.name === name);
}

/** The four stages of the 15-minute monthly check-in, an adaptation of the GROW model. */
export const CHECKIN_STAGES: CheckInStage[] = [
  {
    key: "open",
    title: "Open",
    minutes: 2,
    prompt: "Set an easy tone. How has the month been? Let them speak first.",
  },
  {
    key: "goals",
    title: "Goals",
    minutes: 5,
    prompt:
      "Walk the Goal Charter together: what moved, what the numbers say. Name one specific thing done well.",
  },
  {
    key: "reality",
    title: "Reality",
    minutes: 4,
    prompt: "What is in the way? What have you already tried? What would make it easier?",
  },
  {
    key: "forward",
    title: "Way Forward",
    minutes: 4,
    prompt: "Agree specific actions, owners, and the support you will arrange.",
  },
];

export const RECOMMENDATIONS = [
  "Fast-track growth",
  "On track — continue",
  "Focused improvement plan",
  "Intern conversion — yes",
  "Intern conversion — no",
] as const;

/** Year-at-level definitions, as documented on the headcount dashboard. */
export const LEVELS: Level[] = [
  {
    value: 1,
    label: "Level 1",
    hint: "Associate — focuses on learning and execution. Mastering core tasks with guidance.",
  },
  {
    value: 2,
    label: "Level 2",
    hint: "Mid-level — works independently. Owns small projects start to finish.",
  },
  {
    value: 3,
    label: "Level 3",
    hint: "Senior — thinks strategically. Improves the process and mentors others.",
  },
  {
    value: 4,
    label: "Level 4",
    hint: "Lead / founder — sets direction for a unit or the organisation.",
  },
];

export const UNITS = [
  "AI & Engineering",
  "Marketing & Growth",
  "Sales & Service",
  "Product",
  "Operations & Support",
] as const;

export const EMPLOYMENT_TYPES = ["Full Time", "Intern"] as const;

export const APPROVER_LABEL = "Leadership";
export const PROGRAMME_OWNER_LABEL = "Leadership";

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

const QUARTER_WEIGHTS = `Goals scored 0.0–1.0 → Score 1, competencies discussed → Score 2, combined ${ACTIVE_CYCLE.weights.okr}/${ACTIVE_CYCLE.weights.competency}.`;

export const CYCLE_STAGES: CycleStage[] = [
  {
    id: "goal-setting",
    title: `Goal setting · ${formatDay(ACTIVE_CYCLE.goalWindow.from)} – ${formatDay(ACTIVE_CYCLE.goalWindow.to)}`,
    detail:
      "You draft → coach reviews → Leadership approves. The approved sheet is your charter for the cycle.",
    state: "open",
  },
  {
    id: "check-ins",
    title: "Monthly check-ins · 15 minutes",
    detail:
      "A two-way conversation. No ratings, no status labels — blockers out, way forward agreed.",
    state: "open",
  },
  {
    id: "q1",
    title: "Q1 · Sep–Nov 2026 · scoring by 30 Nov 2026",
    detail: QUARTER_WEIGHTS,
    state: "later",
  },
  {
    id: "q2",
    title: `Q2 · Dec–Feb 2027 · scoring by ${formatDay(ACTIVE_CYCLE.end)}`,
    detail: `${QUARTER_WEIGHTS} Half-yearly review and feedback session happens here.`,
    state: "later",
  },
  {
    id: "close",
    title: "Cycle close",
    detail:
      "Half-yearly score = the average of the two quarters. Annual = the average of the halves.",
    state: "later",
  },
];
