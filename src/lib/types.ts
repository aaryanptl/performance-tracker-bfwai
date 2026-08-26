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

export interface Competency {
  name: string;
  category: string;
  description: string;
  evidence: string;
}

export interface Rating {
  value: number;
  label: string;
  description: string;
}
