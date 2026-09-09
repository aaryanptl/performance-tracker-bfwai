/**
 * The roster vocabulary shared by the server reader, the server actions and the
 * editable table. Kept free of server imports so client components can use it.
 */

export const AUTHORITY_ROLES = ["member", "hr_admin", "founder"] as const;
export const EMPLOYMENT_TYPES = ["full_time", "intern", "contractor"] as const;
export const POSITION_OPTIONS = [
  "AI Engineer",
  "Customer Success - Associate",
  "Founder",
  "Marketing & Growth Manager",
  "People & HR",
  "Product Associate",
  "Sales Associate",
  "Sales Manager",
  "Video Editor - Associate",
] as const;

export type AuthorityRole = (typeof AUTHORITY_ROLES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** The role the application shows: admin comes from authority, coach is earned. */
export type RosterRole = "admin" | "coach" | "member";

export const AUTHORITY_LABELS: Record<AuthorityRole, string> = {
  member: "Member",
  hr_admin: "People & HR",
  founder: "Founder",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full Time",
  intern: "Intern",
  contractor: "Contractor",
};

export interface RosterUnit {
  id: number;
  name: string;
}

export interface RosterPerson {
  /** The `public.people` primary key — the id every roster action writes against. */
  id: number;
  sourceKey: string | null;
  name: string;
  email: string;
  title: string;
  unitId: number | null;
  unitName: string;
  level: number;
  employment: EmploymentType;
  authority: AuthorityRole;
  active: boolean;
  /** True once an auth account is linked, which is what lets the person sign in. */
  hasAccount: boolean;
  coachId: number | null;
  leaderId: number | null;
  coacheeCount: number;
  role: RosterRole;
}

export interface Roster {
  people: RosterPerson[];
  units: RosterUnit[];
  currentCycle: { id: number; name: string } | null;
  currentCycleParticipantIds: number[];
  /** The signed-in administrator, so the table can refuse self-inflicted lockouts. */
  viewerId: number | null;
}

export function isAdminAuthority(authority: AuthorityRole) {
  return authority === "founder" || authority === "hr_admin";
}
