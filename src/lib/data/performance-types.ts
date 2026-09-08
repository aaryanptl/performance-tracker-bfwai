/**
 * The performance vocabulary shared by the server readers, the server actions
 * and the client forms. Kept free of server imports so client components can
 * import the types and the status labels without pulling in the Supabase client.
 */

export const CHARTER_STATUSES = [
  "draft",
  "submitted",
  "coach_changes_requested",
  "coach_reviewed",
  "founder_changes_requested",
  "approved_locked",
] as const;
export type CharterStatus = (typeof CHARTER_STATUSES)[number];

export const CHARTER_STATUS_LABELS: Record<CharterStatus, string> = {
  draft: "Draft",
  submitted: "With your coach",
  coach_changes_requested: "Changes requested by coach",
  coach_reviewed: "With Leadership",
  founder_changes_requested: "Changes requested by Leadership",
  approved_locked: "Approved & locked",
};

/** The statuses in which the person who owns the charter may still edit it. */
export const CHARTER_EDITABLE: CharterStatus[] = [
  "draft",
  "coach_changes_requested",
  "founder_changes_requested",
];

export const IMPACT_STATUSES = ["draft", "submitted", "verified", "locked"] as const;
export type ImpactStatus = (typeof IMPACT_STATUSES)[number];

export const IMPACT_STATUS_LABELS: Record<ImpactStatus, string> = {
  draft: "Not shared yet",
  submitted: "Shared with your coach",
  verified: "Verified by your coach",
  locked: "Locked",
};

export const CHECK_IN_STATUSES = [
  "planned",
  "held",
  "coach_recorded",
  "employee_acknowledged",
  "complete",
  "missed",
] as const;
export type CheckInStatus = (typeof CHECK_IN_STATUSES)[number];

export const CHECK_IN_STATUS_LABELS: Record<CheckInStatus, string> = {
  planned: "Planned",
  held: "Held",
  coach_recorded: "Recorded by coach",
  employee_acknowledged: "Acknowledged",
  complete: "Complete",
  missed: "Missed",
};

export const REVIEW_STATUSES = [
  "coach_draft",
  "calibration",
  "founder_signed",
  "released",
  "employee_acknowledged",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  coach_draft: "Coach draft",
  calibration: "In calibration",
  founder_signed: "Signed by Leadership",
  released: "Released",
  employee_acknowledged: "Acknowledged",
};

export const RECOMMENDATIONS = [
  "fast_track_growth",
  "on_track",
  "focused_improvement",
  "intern_conversion",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  fast_track_growth: "Fast-track growth",
  on_track: "On track",
  focused_improvement: "Focused improvement",
  intern_conversion: "Intern conversion",
};

export interface CycleSummary {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  goalWindowStart: string;
  goalWindowEnd: string;
  okrWeight: number;
  competencyWeight: number;
  maxGoals: number;
  status: string;
  quarters: QuarterSummary[];
}

export interface QuarterSummary {
  id: number;
  sequence: number;
  name: string;
  startDate: string;
  endDate: string;
  scoringDueAt: string | null;
  isFullReview: boolean;
  status: string;
}

export interface ParticipantSummary {
  id: number;
  cycleId: number;
  personId: number;
  personName: string;
  personEmail: string;
  coachId: number | null;
  coachName: string | null;
  unitName: string;
  title: string;
  jobLevel: number;
}

export interface CharterGoal {
  id: number;
  sortOrder: number;
  outcome: string;
  keyResult: string;
  baseline: string;
  target: string;
  dataSource: string;
}

export interface CharterCompetency {
  id: number;
  competencyId: number;
  name: string;
  sortOrder: number;
  selectionType: "fixed" | "selected";
  commitment: string;
}

export interface CharterDecision {
  id: number;
  actorName: string;
  capacity: "coach" | "founder";
  decision: "changes_requested" | "reviewed" | "approved" | "rejected";
  comment: string | null;
  createdAt: string;
}

export interface Charter {
  id: number;
  participantId: number;
  version: number;
  cycleIntent: string | null;
  context: string | null;
  status: CharterStatus;
  submittedAt: string | null;
  coachReviewedAt: string | null;
  founderApprovedAt: string | null;
  goals: CharterGoal[];
  competencies: CharterCompetency[];
  decisions: CharterDecision[];
}

export interface CheckInRecord {
  id: number;
  participantId: number;
  monthStart: string;
  checkInNumber: number;
  heldAt: string | null;
  status: CheckInStatus;
  coachName: string | null;
  notes: {
    openContext: string | null;
    progressSummary: string;
    blockers: string | null;
    wayForward: string;
  } | null;
  acknowledgedByParticipant: boolean;
  transcript: TranscriptEntry[];
}

export interface TranscriptEntry {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ImpactItem {
  id: number;
  sortOrder: number;
  impactCreated: string;
  numbersAndEvidence: string;
  competencyDemonstrated: string | null;
}

export interface ImpactStatement {
  id: number;
  participantId: number;
  quarterId: number | null;
  quarterName: string | null;
  periodType: "quarterly" | "half_year";
  status: ImpactStatus;
  learningCarriedForward: string | null;
  submittedAt: string | null;
  items: ImpactItem[];
  transcript: TranscriptEntry[];
}

export interface GoalScore {
  id: number;
  charterGoalId: number;
  goalOutcome: string;
  actualResult: string;
  attainment: number;
  evidenceNote: string;
}

export interface QuarterlyReview {
  id: number;
  participantId: number;
  quarterId: number;
  quarterName: string;
  coachName: string | null;
  goalAttainmentAverage: number | null;
  okrRating: number | null;
  competencyRating: number | null;
  calibratedScore: number | null;
  quarterlyScore: number | null;
  coachVerifiedImpact: string | null;
  developmentNeeds: string | null;
  supportToProvide: string | null;
  recommendation: Recommendation | null;
  status: ReviewStatus;
  releasedAt: string | null;
  goalScores: GoalScore[];
  calibrationEvents: CalibrationEvent[];
  acknowledgments: ReviewAcknowledgment[];
  transcript: TranscriptEntry[];
}

export interface ReviewAcknowledgment {
  actorName: string;
  capacity: "coach" | "founder" | "participant";
  decision: "signed" | "acknowledged";
  comment: string | null;
  acknowledgedAt: string;
}

export interface CalibrationEvent {
  id: number;
  actorName: string;
  previousOkrRating: number | null;
  newOkrRating: number | null;
  previousCompetencyRating: number | null;
  newCompetencyRating: number | null;
  previousCalibratedScore: number | null;
  newCalibratedScore: number | null;
  rationale: string;
  createdAt: string;
}

export interface DevelopmentAction {
  id: number;
  actionText: string;
  supportType: string | null;
  dueDate: string | null;
  status: "planned" | "in_progress" | "complete" | "cancelled";
  completedAt: string | null;
}

/** Everything one person's cycle contains, assembled for a record page or book. */
export interface PersonRecord {
  participant: ParticipantSummary;
  cycle: CycleSummary;
  charter: Charter | null;
  checkIns: CheckInRecord[];
  impactStatements: ImpactStatement[];
  reviews: QuarterlyReview[];
  developmentActions: DevelopmentAction[];
}

/**
 * Maps an effective calibrated score to the whole-number performance level it
 * falls into. Scores are stored with two decimal places, while the programme
 * presents the resulting level on the 1–5 scale.
 */
export function performanceLevelForScore(score: number | null): number | null {
  if (score === null || !Number.isFinite(score)) return null;
  return Math.min(5, Math.max(1, Math.round(score)));
}

/** The half-yearly score: the plain average of the released quarterly scores. */
export function halfYearScore(reviews: QuarterlyReview[]): number | null {
  const released = reviews.filter(
    (review) => review.quarterlyScore !== null && review.releasedAt !== null,
  );
  if (released.length === 0) return null;
  const total = released.reduce(
    (sum, review) => sum + (review.calibratedScore ?? review.quarterlyScore ?? 0),
    0,
  );
  return Math.round((total / released.length) * 100) / 100;
}
