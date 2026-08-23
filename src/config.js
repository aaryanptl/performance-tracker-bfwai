/* Framework constants — the scale, the conversion bands, the fixed competencies,
   the check-in stages and the navigation map. */
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

/* Units as they are spelled on the Build Fast with AI headcount roster. */
export const UNITS = ["AI & Engineering","Marketing","Sales & Service","Product","Admin"];

export const CHECKIN_STAGES = [
  {k:"open",    t:"Open",        min:2, q:"Set an easy tone. How has the month been? Let them speak first."},
  {k:"goals",   t:"Goals",       min:5, q:"Walk the Goal Charter together: what moved, what the numbers say. Name one specific thing done well."},
  {k:"reality", t:"Reality",     min:4, q:"What is in the way? What have you already tried? What would make it easier?"},
  {k:"forward", t:"Way Forward", min:4, q:"Agree specific actions, owners, and the support you will arrange."}
];

export const RECOMMENDATIONS = ["Fast-track growth","On track — continue","Focused improvement plan","Intern conversion — yes","Intern conversion — no"];

/* Navigation — which screens each role sees. */
export const NAV = [
  {grp:"Me", items:[
    {k:"home",      t:"Overview",         roles:["member","coach","admin"]},
    {k:"charter",   t:"My Goal Charter",  roles:["member","coach","admin"]},
    {k:"checkins",  t:"My Check-ins",     roles:["member","coach","admin"]},
    {k:"impact",    t:"Impact Statement", roles:["member","coach","admin"]},
    {k:"myscores",  t:"My Scores",        roles:["member","coach","admin"]}
  ]},
  {grp:"Coaching", items:[
    {k:"coachees",  t:"My Coachees",      roles:["coach","admin"]},
    {k:"approvals", t:"Charter Reviews",  roles:["coach","admin"]},
    {k:"scoring",   t:"Quarterly Scoring",roles:["coach","admin"]}
  ]},
  {grp:"Administration", items:[
    {k:"dash",      t:"Programme Dashboard", roles:["admin"]},
    {k:"people",    t:"People & Coaches",    roles:["admin"]},
    {k:"cycles",    t:"Cycles & Settings",   roles:["admin"]}
  ]},
  {grp:"Records", items:[
    {k:"exports",   t:"Records & Downloads", roles:["coach","admin"]}
  ]},
  {grp:"Reference", items:[
    {k:"library",   t:"Goal & Competency Library", roles:["member","coach","admin"]},
    {k:"docs",      t:"How Ascend works",          roles:["member","coach","admin"]}
  ]}
];

