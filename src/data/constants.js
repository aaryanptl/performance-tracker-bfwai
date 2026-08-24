export const FIXED_COMPETENCIES = [
  "Communication",
  "Discipline & Documentation",
  "Collaboration"
];
export const COACH_FIXED_THIRD = "Coaching & Collaboration";

export const SCALE = [
  {n:5, label:"Exceptional",          desc:"Consistently exceeds all goals; role-model behaviours. Rare by definition."},
  {n:4, label:"Exceeds Expectations", desc:"Surpasses most goals; strong behaviours."},
  {n:3, label:"Meets Expectations",   desc:"Delivers agreed goals reliably. A good, solid rating — the expected centre of gravity."},
  {n:2, label:"Partially Meets",      desc:"Delivers some goals; specific coaching areas are named."},
  {n:1, label:"Does Not Meet",        desc:"Significant gaps; a structured improvement plan follows."}
];

export const BANDS = [
  {min:0.95, score:5, label:"0.95 and above"},
  {min:0.80, score:4, label:"0.80 – 0.94"},
  {min:0.65, score:3, label:"0.65 – 0.79"},
  {min:0.45, score:2, label:"0.45 – 0.64"},
  {min:0,    score:1, label:"below 0.45"}
];

export const UNITS = ["AI & Engineering","Marketing & Growth","Sales & Service","Product","Operations & Support"];

export const CHECKIN_STAGES = [
  {k:"open",    t:"Open",        min:2, q:"Set an easy tone. How has the month been? Let them speak first."},
  {k:"goals",   t:"Goals",       min:5, q:"Walk the Goal Charter together: what moved, what the numbers say. Name one specific thing done well."},
  {k:"reality", t:"Reality",     min:4, q:"What is in the way? What have you already tried? What would make it easier?"},
  {k:"forward", t:"Way Forward", min:4, q:"Agree specific actions, owners, and the support you will arrange."}
];

export const RECOMMENDATIONS = ["Fast-track growth","On track — continue","Focused improvement plan","Intern conversion — yes","Intern conversion — no"];
/* Rating scale from the Performance Tracker tab of the headcount report. */
export const TRACKER_SCALE = [
  { n: 5, label: "Exceptional — consistently exceeds the bar for the level" },
  { n: 4, label: "Strong — exceeds expectations" },
  { n: 3, label: "Meets — meets expectations for the level" },
  { n: 2, label: "Developing — some gaps, on a plan" },
  { n: 1, label: "Below — significant concerns, action needed" }
];

/* Year-at-Level definitions, as documented on the headcount Dashboard. */
export const LEVELS = [
  { n: 1, label: "Level 1", hint: "Associate — focuses on learning and execution. Mastering core tasks with guidance." },
  { n: 2, label: "Level 2", hint: "Mid-level — works independently. Owns small projects start to finish." },
  { n: 3, label: "Level 3", hint: "Senior — thinks strategically. Improves the process and mentors others." },
  { n: 4, label: "Level 4", hint: "Lead / founder — sets direction for a unit or the organisation." }
];

export const EMPLOYMENT_TYPES = ["Full Time", "Intern"];
