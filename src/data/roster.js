/* =====================================================================
   ROSTER — Build Fast with AI
   Source of truth: HC_Report_BSWA_v2.xlsx
     · "Roster"              — name, email, position, YAL, unit, employment type
     · "Reporting Lines"     — team leader and coach for each person
     · "Performance Tracker" — unit, level and coach used for scoring

   Roles are derived, not invented:
     admin  — Founder and People & HR (full visibility, downloads everything)
     coach  — anyone who appears in the Coach column for another person
     member — everyone else

   Two spreadsheet notes carried over deliberately:
     · Units are normalised to the competency-library spelling:
       "Marketing" -> "Marketing & Growth", "Admin" -> "Operations & Support".
     · Avi's coach: the Roster tab says Aryan, but both "Reporting Lines" and
       "Performance Tracker" say Sanjeev, so Sanjeev is used. Avi's *team
       leader* remains Aryan, which is what all three tabs agree on.
   ===================================================================== */

export const ROSTER = [
  { id:"u_aryan_patel"     , role:"coach" , name:"Aryan Patel"     , email:"aryan@buildfastwithai.com"    ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:3, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_prathmesh_sadake", role:"coach" , name:"Prathmesh Sadake", email:"prathmesh@buildfastwithai.com",
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:3, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_sakshi"          , role:"coach" , name:"Sakshi"          , email:"sakshi@buildfastwithai.com"   ,
    title:"Marketing & Growth Manager"  , unit:"Marketing & Growth"  , level:2, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_sanjeev_patel"   , role:"coach" , name:"Sanjeev Patel"   , email:"sanjeev@buildfastwithai.com"  ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:2, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_sanket"          , role:"coach" , name:"Sanket"          , email:"sanket@buildfastwithai.com"   ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:2, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_ankit_choudhary" , role:"coach" , name:"Ankit Choudhary" , email:"ankit@buildfastwithai.com"    ,
    title:"Sales Manager"               , unit:"Sales & Service"     , level:2, employment:"Full Time",
    coachId:"u_satvik"          , leaderId:"u_satvik" },
  { id:"u_jyoti"           , role:"member", name:"Jyoti"           , email:"jyoti@buildfastwithai.com"    ,
    title:"Sales Associate"             , unit:"Sales & Service"     , level:1, employment:"Full Time",
    coachId:"u_ankit_choudhary" , leaderId:"u_ankit_choudhary" },
  { id:"u_nitish"          , role:"member", name:"Nitish"          , email:"nitish@buildfastwithai.com"   ,
    title:"Video Editor - Associate"    , unit:"Marketing & Growth"  , level:1, employment:"Full Time",
    coachId:"u_sakshi"          , leaderId:"u_sakshi" },
  { id:"u_om_pandey"       , role:"member", name:"Om Pandey"       , email:"om.p@buildfastwithai.com"     ,
    title:"Product Associate"           , unit:"Product"             , level:1, employment:"Intern"   ,
    coachId:"u_prathmesh_sadake", leaderId:"u_prathmesh_sadake" },
  { id:"u_anshuman"        , role:"member", name:"Anshuman"        , email:"anshuman@buildfastwithai.com" ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:2, employment:"Intern"   ,
    coachId:"u_aryan_patel"     , leaderId:"u_aryan_patel" },
  { id:"u_avi"             , role:"member", name:"Avi"             , email:"avi@buildfastwithai.com"      ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:1, employment:"Intern"   ,
    coachId:"u_sanjeev_patel"   , leaderId:"u_aryan_patel" },
  { id:"u_bikash"          , role:"member", name:"Bikash"          , email:"bikash@buildfastwithai.com"   ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:1, employment:"Intern"   ,
    coachId:"u_aryan_patel"     , leaderId:"u_aryan_patel" },
  { id:"u_mansa"           , role:"member", name:"Mansa"           , email:"mansa@buildfastwithai.com"    ,
    title:"Customer Success - Associate", unit:"Sales & Service"     , level:1, employment:"Intern"   ,
    coachId:"u_ankit_choudhary" , leaderId:"u_ankit_choudhary" },
  { id:"u_pratik"          , role:"member", name:"Pratik"          , email:"pratik@buildfastwithai.com"   ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:2, employment:"Intern"   ,
    coachId:"u_sanket"          , leaderId:"u_sanket" },
  { id:"u_rishu"           , role:"member", name:"Rishu"           , email:"Rishi@buildfastwithai.com"    ,
    title:"AI Engineer"                 , unit:"AI & Engineering"    , level:2, employment:"Intern"   ,
    coachId:"u_prathmesh_sadake", leaderId:"u_prathmesh_sadake" },
  { id:"u_satvik"          , role:"admin" , name:"Satvik"          , email:"satvik@buildfastwithai.com"   ,
    title:"Founder"                     , unit:"Operations & Support", level:4, employment:"Full Time",
    coachId:null                , leaderId:null },
  { id:"u_sumedha"         , role:"admin" , name:"Sumedha"         , email:"sumiadhikari96work@gmail.com" ,
    title:"People & HR"                 , unit:"Operations & Support", level:4, employment:"Full Time",
    coachId:null                , leaderId:null }
];

/* Everyone the headcount report scores. The two admins (Founder, People & HR)
   run the programme and are not on the Performance Tracker tab. */
export const SCORED_ROLES = ["member", "coach"];

/* The reporting period the headcount report covers. */
export const REPORTING_PERIOD = "FY2026";
