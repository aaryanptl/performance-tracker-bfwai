/* =====================================================================
   THE ROSTER — Build Fast with AI
   Source: HC_Report_BFWA_v2.xlsx (Roster · Reporting Lines · Performance
   Tracker tabs). 17 people, 7 coaches, one named coach per person.

   This file is the single source of truth for who can sign in and what
   they may see. Sign-in matches on email, case-insensitively.

   Roles
     admin  — Founder and People & HR: approve charters, calibrate and
              release scores, configure the programme, download everything.
     coach  — anyone who appears as somebody's coach.
     member — everyone else.

   Editing it: change a row here (or use People & Coaches in the running
   app for changes that only apply to this browser's data). A person's
   `id` is what every record points at — never reuse or renumber an id.
   ===================================================================== */

export const ORG = {
  name: "Build Fast with AI",
  short: "BFWA",
  domain: "buildfastwithai.com"
};

/* `coach` holds the coach's id · null means no coach (the two admins).
   `emails` holds any additional addresses that may be used to sign in. */
export const ROSTER = [
  { id:"u_satvik",    name:"Satvik",            email:"satvik@buildfastwithai.com",     role:"admin",  unit:"Admin",             title:"Founder",                      level:4, employment:"Full Time", coach:null },
  { id:"u_sumedha",   name:"Sumedha",           email:"sumiadhikari96work@gmail.com",   role:"admin",  unit:"Admin",             title:"People & HR",                  level:4, employment:"Full Time", coach:null, emails:["sumiadhikari96@gmail.com"] },

  { id:"u_aryan",     name:"Aryan Patel",       email:"aryan@buildfastwithai.com",      role:"coach",  unit:"AI & Engineering",  title:"AI Engineer",                  level:3, employment:"Full Time", coach:"u_satvik" },
  { id:"u_prathmesh", name:"Prathmesh Sadake",  email:"prathmesh@buildfastwithai.com",  role:"coach",  unit:"AI & Engineering",  title:"AI Engineer",                  level:3, employment:"Full Time", coach:"u_satvik" },
  { id:"u_sakshi",    name:"Sakshi",            email:"sakshi@buildfastwithai.com",     role:"coach",  unit:"Marketing",         title:"Marketing & Growth Manager",   level:2, employment:"Full Time", coach:"u_satvik" },
  { id:"u_sanjeev",   name:"Sanjeev Patel",     email:"sanjeev@buildfastwithai.com",    role:"coach",  unit:"AI & Engineering",  title:"AI Engineer",                  level:2, employment:"Full Time", coach:"u_satvik" },
  { id:"u_sanket",    name:"Sanket",            email:"sanket@buildfastwithai.com",     role:"coach",  unit:"AI & Engineering",  title:"AI Engineer",                  level:2, employment:"Full Time", coach:"u_satvik" },
  { id:"u_ankit",     name:"Ankit Choudhary",   email:"ankit@buildfastwithai.com",      role:"coach",  unit:"Sales & Service",   title:"Sales Manager",                level:2, employment:"Full Time", coach:"u_satvik" },

  { id:"u_jyoti",     name:"Jyoti",             email:"jyoti@buildfastwithai.com",      role:"member", unit:"Sales & Service",   title:"Sales Associate",              level:1, employment:"Full Time", coach:"u_ankit" },
  { id:"u_nitish",    name:"Nitish",            email:"nitish@buildfastwithai.com",     role:"member", unit:"Marketing",         title:"Video Editor — Associate",     level:1, employment:"Full Time", coach:"u_sakshi" },
  { id:"u_om",        name:"Om Pandey",         email:"om.p@buildfastwithai.com",       role:"member", unit:"Product",           title:"Product Associate",            level:1, employment:"Intern",    coach:"u_prathmesh" },
  { id:"u_anshuman",  name:"Anshuman",          email:"anshuman@buildfastwithai.com",   role:"member", unit:"AI & Engineering",  title:"AI Engineer",                  level:2, employment:"Intern",    coach:"u_aryan" },
  { id:"u_avi",       name:"Avi",               email:"avi@buildfastwithai.com",        role:"member", unit:"AI & Engineering",  title:"AI Engineer",                  level:1, employment:"Intern",    coach:"u_sanjeev" },
  { id:"u_bikash",    name:"Bikash",            email:"bikash@buildfastwithai.com",     role:"member", unit:"AI & Engineering",  title:"AI Engineer",                  level:1, employment:"Intern",    coach:"u_aryan" },
  { id:"u_mansa",     name:"Mansa",             email:"mansa@buildfastwithai.com",      role:"member", unit:"Sales & Service",   title:"Customer Success — Associate", level:1, employment:"Intern",    coach:"u_ankit" },
  { id:"u_pratik",    name:"Pratik",            email:"pratik@buildfastwithai.com",     role:"member", unit:"AI & Engineering",  title:"AI Engineer",                  level:2, employment:"Intern",    coach:"u_sanket" },
  { id:"u_rishu",     name:"Rishu",             email:"rishi@buildfastwithai.com",      role:"member", unit:"AI & Engineering",  title:"AI Engineer",                  level:2, employment:"Intern",    coach:"u_prathmesh" }
];

/* Users in the shape the application stores them. */
export function rosterUsers(){
  return ROSTER.map(p => ({
    id: p.id, name: p.name, email: p.email, emails: p.emails || [],
    role: p.role, unit: p.unit, title: p.title,
    level: p.level, employment: p.employment, coachId: p.coach
  }));
}

/* All addresses that sign a person in, lower-cased. */
export function addressesOf(u){
  return [u.email, ...(u.emails || [])].filter(Boolean).map(e => e.trim().toLowerCase());
}
