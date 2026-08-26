import {
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  FileArchive,
  Gauge,
  Goal,
  LayoutDashboard,
  LibraryBig,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import type { NavigationGroup } from "@/lib/types";

export const NAVIGATION: NavigationGroup[] = [
  {
    label: "My performance",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Goal charter", href: "/charter", icon: Goal },
      { label: "Check-ins", href: "/check-ins", icon: CalendarCheck2 },
      { label: "Impact", href: "/impact", icon: Sparkles },
      { label: "Scores", href: "/scores", icon: Trophy },
    ],
  },
  {
    label: "Coaching",
    items: [
      { label: "Coachees", href: "/coaching/coachees", icon: Users, roles: ["coach", "admin"] },
      {
        label: "Approvals",
        href: "/coaching/approvals",
        icon: ShieldCheck,
        roles: ["coach", "admin"],
        badge: "0",
      },
      {
        label: "Scoring",
        href: "/coaching/scoring",
        icon: ClipboardCheck,
        roles: ["coach", "admin"],
      },
    ],
  },
  {
    label: "Programme",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Gauge, roles: ["admin"] },
      { label: "People", href: "/admin/people", icon: BriefcaseBusiness, roles: ["admin"] },
      { label: "Cycles", href: "/admin/cycles", icon: Settings2, roles: ["admin"] },
      { label: "Records", href: "/records", icon: FileArchive, roles: ["coach", "admin"] },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Library", href: "/library", icon: LibraryBig },
      { label: "How Ascend works", href: "/docs", icon: BookOpen },
    ],
  },
];

export const ROUTE_TITLES: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Overview",
    description: "Your priorities, progress, and next actions for the active cycle.",
  },
  "/charter": {
    title: "My goal charter",
    description: "The outcomes and behaviours you are accountable for this cycle.",
  },
  "/charter/edit": {
    title: "Edit goal charter",
    description: "Define measurable outcomes before sending the charter for review.",
  },
  "/check-ins": {
    title: "Monthly check-ins",
    description: "A consistent record of progress, blockers, support, and commitments.",
  },
  "/impact": {
    title: "Impact statements",
    description: "Capture the evidence and outcomes behind your contribution.",
  },
  "/scores": {
    title: "My scores",
    description: "Quarterly ratings and the evidence that supports them.",
  },
  "/coaching/coachees": { title: "Coachees", description: "People in your direct coaching scope." },
  "/coaching/approvals": {
    title: "Charter approvals",
    description: "Review goal charters waiting for your decision.",
  },
  "/coaching/scoring": {
    title: "Scoring",
    description: "Complete evidence-backed quarterly ratings for your team.",
  },
  "/admin/dashboard": {
    title: "Programme dashboard",
    description: "Organisation-wide readiness and performance programme health.",
  },
  "/admin/people": {
    title: "People & coaches",
    description: "The source of truth for roles, levels, units, and coaching lines.",
  },
  "/admin/cycles": {
    title: "Cycles",
    description: "Configure the timing and weighting of performance cycles.",
  },
  "/records": {
    title: "Records & downloads",
    description: "Scope-aware performance records and programme exports.",
  },
  "/library": {
    title: "Competency library",
    description: "Shared expectations for craft, behaviour, and growth.",
  },
  "/docs": {
    title: "How Ascend works",
    description: "A practical guide to the performance cycle and its decisions.",
  },
};
