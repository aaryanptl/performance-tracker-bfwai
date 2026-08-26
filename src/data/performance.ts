import type { Competency, Cycle, Rating } from "@/lib/types";

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
    description: "Consistently exceeds the bar and models the behaviour for others.",
  },
  {
    value: 4,
    label: "Exceeds expectations",
    description: "Surpasses most goals and demonstrates strong behaviours.",
  },
  {
    value: 3,
    label: "Meets expectations",
    description: "Reliably delivers the agreed goals for the role and level.",
  },
  {
    value: 2,
    label: "Developing",
    description: "Delivers some goals with clearly named coaching areas.",
  },
  {
    value: 1,
    label: "Below expectations",
    description: "Significant gaps require a structured improvement plan.",
  },
];

export const COMPETENCIES: Competency[] = [
  {
    name: "Communication",
    category: "Core",
    description: "Makes context, decisions, and next steps clear to the people who need them.",
    evidence: "Written updates, meeting outcomes, stakeholder feedback",
  },
  {
    name: "Discipline & Documentation",
    category: "Core",
    description: "Creates reliable systems, records decisions, and closes commitments on time.",
    evidence: "Project records, process docs, delivery consistency",
  },
  {
    name: "Collaboration",
    category: "Core",
    description: "Works across functions with shared ownership and constructive challenge.",
    evidence: "Cross-functional delivery, peer feedback, handoffs",
  },
  {
    name: "AI Craft & Engineering Quality",
    category: "AI & Engineering",
    description: "Builds dependable AI systems with thoughtful evaluation and maintainable code.",
    evidence: "Quality metrics, reviews, production reliability",
  },
  {
    name: "Customer Insight",
    category: "Sales & Service",
    description: "Turns customer context into useful action and durable relationships.",
    evidence: "Customer outcomes, renewal signals, response quality",
  },
  {
    name: "Growth Experimentation",
    category: "Marketing & Growth",
    description: "Runs focused experiments and uses evidence to improve the next bet.",
    evidence: "Experiment logs, qualified pipeline, learning velocity",
  },
  {
    name: "Product Judgement",
    category: "Product",
    description: "Frames the right problem and makes clear trade-offs around user value.",
    evidence: "Discovery notes, shipped outcomes, adoption",
  },
];

export const CHECKIN_MONTHS = [
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
] as const;
export const CHARTER_STEPS = ["Draft goals", "Coach review", "Leadership approval"] as const;
