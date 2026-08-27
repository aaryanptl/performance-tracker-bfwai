import type { LucideIcon } from "lucide-react";

export type Role = "admin" | "coach" | "member";

export interface Person {
  id: string;
  role: Role;
  name: string;
  email: string;
  title: string;
  unit: string;
  level: number;
  employment: "Full Time" | "Intern";
  coachId: string | null;
  leaderId: string | null;
}

export interface Cycle {
  id: string;
  name: string;
  start: string;
  end: string;
  goalWindow: { from: string; to: string };
  checkins: number;
  weights: { okr: number; competency: number };
  maxGoals: number;
  status: "Active" | "Draft" | "Complete";
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  badge?: string;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

/** A competency as it appears in the goal & competency library. */
export interface LibraryCompetency {
  unit: string;
  name: string;
  /** Fixed competencies every charter carries; the rest are chosen with a coach. */
  mandatory: boolean;
  definition: string;
  measure: string;
  /** What a 5, a 3 and a 1 look like for this competency. */
  l5: string;
  l3: string;
  l1: string;
}

/** An example objective + key result from the library, ready to start a goal from. */
export interface OkrExample {
  unit: string;
  objective: string;
  kr: string;
  source: string;
}

export interface Rating {
  value: number;
  label: string;
  description: string;
}

export interface CycleStage {
  id: string;
  title: string;
  detail: string;
  state: "open" | "later";
}

export interface CheckInStage {
  key: string;
  title: string;
  minutes: number;
  prompt: string;
}

export interface Level {
  value: number;
  label: string;
  hint: string;
}
