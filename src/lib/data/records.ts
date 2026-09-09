import type {
  Charter,
  CharterStatus,
  CheckInRecord,
  CheckInStatus,
  DevelopmentAction,
  ImpactStatement,
  ImpactStatus,
  QuarterlyReview,
  Recommendation,
  ReviewStatus,
  TranscriptEntry,
} from "@/lib/data/performance-types";
import type { SupabaseClient } from "@/lib/data/viewer";

/* ---------------------------------------------------------------- charter */

interface CharterRow {
  id: number;
  cycle_participant_id: number;
  version: number;
  cycle_intent: string | null;
  context: string | null;
  status: CharterStatus;
  submitted_at: string | null;
  coach_reviewed_at: string | null;
  founder_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalRow {
  id: number;
  sort_order: number;
  outcome: string;
  key_result: string;
  baseline: string;
  target: string;
  data_source: string;
}

interface CompetencyRow {
  id: number;
  competency_id: number;
  sort_order: number;
  selection_type: "fixed" | "selected";
  commitment: string;
  competency: { name: string } | null;
}

interface DecisionRow {
  id: number;
  actor_capacity: "coach" | "founder";
  decision: "changes_requested" | "reviewed" | "approved" | "rejected";
  comment: string | null;
  created_at: string;
  actor: { display_name: string } | null;
}

/**
 * The current charter for a participant — the highest version, so a re-issued
 * charter supersedes the one it replaced.
 *
 * Goals and competencies read through `can_read_charter_content`, which is
 * narrower than the metadata policy: a caller may legitimately see that a
 * charter exists and still get no content rows back. Empty content is therefore
 * not treated as an error here.
 */
export async function getCharter(
  supabase: SupabaseClient,
  participantId: number,
): Promise<Charter | null> {
  const { data: row } = await supabase
    .from("goal_charters")
    .select(
      "id, cycle_participant_id, version, cycle_intent, context, status, submitted_at, coach_reviewed_at, founder_approved_at, created_at, updated_at",
    )
    .eq("cycle_participant_id", participantId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<CharterRow>();

  if (!row) return null;

  return loadCharter(supabase, row);
}

/** Every saved charter version, newest first, for the change-history view. */
export async function getCharterHistory(
  supabase: SupabaseClient,
  participantId: number,
): Promise<Charter[]> {
  const { data: rows } = await supabase
    .from("goal_charters")
    .select(
      "id, cycle_participant_id, version, cycle_intent, context, status, submitted_at, coach_reviewed_at, founder_approved_at, created_at, updated_at",
    )
    .eq("cycle_participant_id", participantId)
    .order("version", { ascending: false })
    .returns<CharterRow[]>();

  return Promise.all((rows ?? []).map((row) => loadCharter(supabase, row)));
}

async function loadCharter(supabase: SupabaseClient, row: CharterRow): Promise<Charter> {
  const [goals, competencies, decisions] = await Promise.all([
    supabase
      .from("charter_goals")
      .select("id, sort_order, outcome, key_result, baseline, target, data_source")
      .eq("charter_id", row.id)
      .order("sort_order")
      .returns<GoalRow[]>(),
    supabase
      .from("charter_competencies")
      .select(
        "id, competency_id, sort_order, selection_type, commitment, competency:competencies(name)",
      )
      .eq("charter_id", row.id)
      .order("sort_order")
      .returns<CompetencyRow[]>(),
    supabase
      .from("charter_decisions")
      .select(
        "id, actor_capacity, decision, comment, created_at, actor:people!charter_decisions_actor_person_id_fkey(display_name)",
      )
      .eq("charter_id", row.id)
      .order("created_at")
      .returns<DecisionRow[]>(),
  ]);

  return {
    id: row.id,
    participantId: row.cycle_participant_id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cycleIntent: row.cycle_intent,
    context: row.context,
    status: row.status,
    submittedAt: row.submitted_at,
    coachReviewedAt: row.coach_reviewed_at,
    founderApprovedAt: row.founder_approved_at,
    goals: (goals.data ?? []).map((goal) => ({
      id: goal.id,
      sortOrder: goal.sort_order,
      outcome: goal.outcome,
      keyResult: goal.key_result,
      baseline: goal.baseline,
      target: goal.target,
      dataSource: goal.data_source,
    })),
    competencies: (competencies.data ?? []).map((competency) => ({
      id: competency.id,
      competencyId: competency.competency_id,
      name: competency.competency?.name ?? "Competency",
      sortOrder: competency.sort_order,
      selectionType: competency.selection_type,
      commitment: competency.commitment,
    })),
    decisions: (decisions.data ?? []).map((decision) => ({
      id: decision.id,
      actorName: decision.actor?.display_name ?? "Unknown",
      capacity: decision.actor_capacity,
      decision: decision.decision,
      comment: decision.comment,
      createdAt: decision.created_at,
    })),
  };
}

/* --------------------------------------------------------------- check-ins */

interface CheckInRow {
  id: number;
  cycle_participant_id: number;
  month_start: string;
  check_in_number: number;
  held_at: string | null;
  status: CheckInStatus;
  coach: { display_name: string } | null;
  notes: {
    open_context: string | null;
    progress_summary: string;
    blockers: string | null;
    way_forward: string;
  } | null;
  acknowledgments: { actor_capacity: string }[] | null;
  transcript: TranscriptRow[] | null;
}

interface TranscriptRow {
  id: number;
  body: string;
  created_at: string;
  author: { display_name: string } | null;
}

function toTranscript(rows: TranscriptRow[] | null): TranscriptEntry[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    authorName: row.author?.display_name ?? "Unknown",
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function getCheckIns(
  supabase: SupabaseClient,
  participantId: number,
): Promise<CheckInRecord[]> {
  const { data } = await supabase
    .from("check_ins")
    .select(
      "id, cycle_participant_id, month_start, check_in_number, held_at, status, coach:people!check_ins_coach_id_fkey(display_name), notes:check_in_notes(open_context, progress_summary, blockers, way_forward), acknowledgments:check_in_acknowledgments(actor_capacity), transcript:transcript_entries!transcript_entries_check_in_id_fkey(id, body, created_at, author:people!transcript_entries_author_person_id_fkey(display_name))",
    )
    .eq("cycle_participant_id", participantId)
    .order("month_start")
    .returns<CheckInRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    participantId: row.cycle_participant_id,
    monthStart: row.month_start,
    checkInNumber: row.check_in_number,
    heldAt: row.held_at,
    status: row.status,
    coachName: row.coach?.display_name ?? null,
    notes: row.notes
      ? {
          openContext: row.notes.open_context,
          progressSummary: row.notes.progress_summary,
          blockers: row.notes.blockers,
          wayForward: row.notes.way_forward,
        }
      : null,
    acknowledgedByParticipant: (row.acknowledgments ?? []).some(
      (entry) => entry.actor_capacity === "participant",
    ),
    transcript: toTranscript(row.transcript),
  }));
}

/* ------------------------------------------------------- impact statements */

interface ImpactItemRow {
  id: number;
  sort_order: number;
  impact_created: string;
  numbers_and_evidence: string;
  competency_demonstrated: string | null;
}

interface ImpactRow {
  id: number;
  cycle_participant_id: number;
  quarter_id: number | null;
  period_type: "quarterly" | "half_year";
  status: ImpactStatus;
  learning_carried_forward: string | null;
  submitted_at: string | null;
  quarter: { name: string } | null;
  items: ImpactItemRow[] | null;
  transcript: TranscriptRow[] | null;
}

export async function getImpactStatements(
  supabase: SupabaseClient,
  participantId: number,
): Promise<ImpactStatement[]> {
  const { data } = await supabase
    .from("impact_statements")
    .select(
      "id, cycle_participant_id, quarter_id, period_type, status, learning_carried_forward, submitted_at, quarter:quarters(name), items:impact_items(id, sort_order, impact_created, numbers_and_evidence, competency_demonstrated), transcript:transcript_entries!transcript_entries_impact_statement_id_fkey(id, body, created_at, author:people!transcript_entries_author_person_id_fkey(display_name))",
    )
    .eq("cycle_participant_id", participantId)
    .returns<ImpactRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    participantId: row.cycle_participant_id,
    quarterId: row.quarter_id,
    quarterName: row.quarter?.name ?? null,
    periodType: row.period_type,
    status: row.status,
    learningCarriedForward: row.learning_carried_forward,
    submittedAt: row.submitted_at,
    items: (row.items ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => ({
        id: item.id,
        sortOrder: item.sort_order,
        impactCreated: item.impact_created,
        numbersAndEvidence: item.numbers_and_evidence,
        competencyDemonstrated: item.competency_demonstrated,
      })),
    transcript: toTranscript(row.transcript),
  }));
}

/* ----------------------------------------------------------------- reviews */

interface GoalScoreRow {
  id: number;
  charter_goal_id: number;
  actual_result: string;
  attainment: number;
  evidence_note: string;
  goal: { outcome: string } | null;
}

interface ReviewRow {
  id: number;
  cycle_participant_id: number;
  quarter_id: number;
  goal_attainment_average: number | null;
  okr_rating: number | null;
  competency_rating: number | null;
  quarterly_score: number | null;
  calibrated_score: number | null;
  coach_verified_impact: string | null;
  development_needs: string | null;
  support_to_provide: string | null;
  recommendation: Recommendation | null;
  status: ReviewStatus;
  released_at: string | null;
  quarter: { name: string; sequence: number } | null;
  coach: { display_name: string } | null;
  scores: GoalScoreRow[] | null;
  calibration_events: CalibrationEventRow[] | null;
  acknowledgments: ReviewAcknowledgmentRow[] | null;
  transcript: TranscriptRow[] | null;
}

interface ReviewAcknowledgmentRow {
  actor_capacity: "coach" | "founder" | "participant";
  decision: "signed" | "acknowledged";
  verbatim_comment: string | null;
  acknowledged_at: string;
  actor: { display_name: string } | null;
}

interface CalibrationEventRow {
  id: number;
  previous_okr_rating: number | null;
  new_okr_rating: number | null;
  previous_competency_rating: number | null;
  new_competency_rating: number | null;
  previous_calibrated_score: number | null;
  new_calibrated_score: number | null;
  rationale: string;
  created_at: string;
  actor: { display_name: string } | null;
}

export async function getReviews(
  supabase: SupabaseClient,
  participantId: number,
): Promise<QuarterlyReview[]> {
  const { data } = await supabase
    .from("quarterly_reviews")
    .select(
      "id, cycle_participant_id, quarter_id, goal_attainment_average, okr_rating, competency_rating, calibrated_score, quarterly_score, coach_verified_impact, development_needs, support_to_provide, recommendation, status, released_at, quarter:quarters(name, sequence), coach:people!quarterly_reviews_coach_id_fkey(display_name), scores:goal_scores(id, charter_goal_id, actual_result, attainment, evidence_note, goal:charter_goals(outcome)), calibration_events(id, previous_okr_rating, new_okr_rating, previous_competency_rating, new_competency_rating, previous_calibrated_score, new_calibrated_score, rationale, created_at, actor:people!calibration_events_actor_person_id_fkey(display_name)), acknowledgments:review_acknowledgments(actor_capacity, decision, verbatim_comment, acknowledged_at, actor:people!review_acknowledgments_actor_person_id_fkey(display_name)), transcript:transcript_entries!transcript_entries_quarterly_review_id_fkey(id, body, created_at, author:people!transcript_entries_author_person_id_fkey(display_name))",
    )
    .eq("cycle_participant_id", participantId)
    .returns<ReviewRow[]>();

  return (data ?? [])
    .slice()
    .sort((left, right) => (left.quarter?.sequence ?? 0) - (right.quarter?.sequence ?? 0))
    .map((row) => ({
      id: row.id,
      participantId: row.cycle_participant_id,
      quarterId: row.quarter_id,
      quarterName: row.quarter?.name ?? "",
      coachName: row.coach?.display_name ?? null,
      goalAttainmentAverage:
        row.goal_attainment_average === null ? null : Number(row.goal_attainment_average),
      okrRating: row.okr_rating,
      competencyRating: row.competency_rating,
      calibratedScore: row.calibrated_score === null ? null : Number(row.calibrated_score),
      quarterlyScore: row.quarterly_score === null ? null : Number(row.quarterly_score),
      coachVerifiedImpact: row.coach_verified_impact,
      developmentNeeds: row.development_needs,
      supportToProvide: row.support_to_provide,
      recommendation: row.recommendation,
      status: row.status,
      releasedAt: row.released_at,
      goalScores: (row.scores ?? []).map((score) => ({
        id: score.id,
        charterGoalId: score.charter_goal_id,
        goalOutcome: score.goal?.outcome ?? "",
        actualResult: score.actual_result,
        attainment: Number(score.attainment),
        evidenceNote: score.evidence_note,
      })),
      calibrationEvents: (row.calibration_events ?? []).map((event) => ({
        id: event.id,
        actorName: event.actor?.display_name ?? "Leadership",
        previousOkrRating: event.previous_okr_rating,
        newOkrRating: event.new_okr_rating,
        previousCompetencyRating: event.previous_competency_rating,
        newCompetencyRating: event.new_competency_rating,
        previousCalibratedScore:
          event.previous_calibrated_score === null ? null : Number(event.previous_calibrated_score),
        newCalibratedScore:
          event.new_calibrated_score === null ? null : Number(event.new_calibrated_score),
        rationale: event.rationale,
        createdAt: event.created_at,
      })),
      acknowledgments: (row.acknowledgments ?? []).map((acknowledgment) => ({
        actorName: acknowledgment.actor?.display_name ?? "Unknown",
        capacity: acknowledgment.actor_capacity,
        decision: acknowledgment.decision,
        comment: acknowledgment.verbatim_comment,
        acknowledgedAt: acknowledgment.acknowledged_at,
      })),
      transcript: toTranscript(row.transcript),
    }));
}

interface DevelopmentActionRow {
  id: number;
  action_text: string;
  support_type: string | null;
  due_date: string | null;
  status: "planned" | "in_progress" | "complete" | "cancelled";
  completed_at: string | null;
}

export async function getDevelopmentActions(
  supabase: SupabaseClient,
  participantId: number,
): Promise<DevelopmentAction[]> {
  const { data } = await supabase
    .from("development_actions")
    .select("id, action_text, support_type, due_date, status, completed_at")
    .eq("cycle_participant_id", participantId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .returns<DevelopmentActionRow[]>();

  return (data ?? []).map((action) => ({
    id: action.id,
    actionText: action.action_text,
    supportType: action.support_type,
    dueDate: action.due_date,
    status: action.status,
    completedAt: action.completed_at,
  }));
}
