import { LIBRARY_COMPETENCIES } from "@/data/library";
import type { CheckInStage, Level, LibraryCompetency, Rating } from "@/lib/types";

/*
 * Programme policy, not a cycle.
 *
 * A live cycle — its name, dates and quarters — is read from the database; see
 * `getActiveCycle`. What stays here is the doctrine the schema also enforces:
 * the 0.6/0.4 split (`cycles_weights_total`), the five-goal ceiling
 * (`cycles_max_goals_range`), and six monthly check-ins. These are the defaults
 * the explanatory pages quote, so they must not be read off a fake cycle.
 */
export const DEFAULT_WEIGHTS = { okr: 0.6, competency: 0.4 } as const;
export const DEFAULT_MAX_GOALS = 5;
export const CHECK_INS_PER_CYCLE = 6;

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
