"use server";

import { revalidatePath } from "next/cache";

import {
  getActiveCycle,
  getOwnParticipant,
  getParticipantById,
  getVisibleParticipants,
} from "@/lib/data/cycle";
import { RECOMMENDATIONS, type Recommendation } from "@/lib/data/performance-types";
import { getViewer } from "@/lib/data/viewer";

export interface CoachingActionResult {
  error: string | null;
  message?: string;
}

function refresh() {
  revalidatePath("/check-ins");
  revalidatePath("/coaching/coachees");
  revalidatePath("/coaching/check-ins");
  revalidatePath("/coaching/scoring");
  revalidatePath("/coaching/approvals");
  revalidatePath("/admin/calibration");
  revalidatePath("/scores");
  revalidatePath("/records");
  revalidatePath("/");
}

/* -------------------------------------------------------------- check-ins */

/**
 * Record a monthly check-in.
 *
 * `check_ins` is unique per (participant, month), so the row is created on the
 * first save and reused after; the notes table hangs off it one-to-one. The
 * coach recorded here is the caller, which is what the RLS policy checks.
 */
export async function recordCheckIn(
  _previous: CoachingActionResult,
  formData: FormData,
): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const participantId = Number(formData.get("participant_id"));
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return { error: "Choose the person this check-in is for." };
  }

  const monthStart = String(formData.get("month_start") ?? "").trim();
  if (!/^\d{4}-\d{2}-01$/.test(monthStart)) {
    return { error: "Choose the month this check-in covers." };
  }

  const heldAtInput = String(formData.get("held_at") ?? "").trim();
  const heldAt = /^\d{4}-\d{2}-\d{2}$/.test(heldAtInput)
    ? new Date(`${heldAtInput}T12:00:00Z`).toISOString()
    : new Date().toISOString();

  const openContext = String(formData.get("open_context") ?? "").trim() || null;
  const progressSummary = String(formData.get("progress_summary") ?? "").trim();
  const wayForward = String(formData.get("way_forward") ?? "").trim();
  if (!progressSummary) return { error: "Record what was discussed." };
  if (!wayForward) return { error: "Record the way forward — what happens next, and who owes it." };

  const blockers = String(formData.get("blockers") ?? "").trim() || null;
  const transcript = String(formData.get("transcript") ?? "").trim();

  const participant = await getParticipantById(supabase, participantId);
  if (!participant) return { error: "That person is not in your coaching scope." };

  const { data: existing } = await supabase
    .from("check_ins")
    .select("id, check_in_number")
    .eq("cycle_participant_id", participantId)
    .eq("month_start", monthStart)
    .maybeSingle<{ id: number; check_in_number: number }>();

  let checkInId = existing?.id ?? null;

  if (checkInId === null) {
    const { count } = await supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("cycle_participant_id", participantId);

    const nextNumber = Math.min((count ?? 0) + 1, 6);

    const { data, error } = await supabase
      .from("check_ins")
      .insert({
        cycle_participant_id: participantId,
        coach_id: viewer.personId,
        month_start: monthStart,
        check_in_number: nextNumber,
        held_at: heldAt,
        status: "coach_recorded",
      })
      .select("id")
      .maybeSingle<{ id: number }>();

    if (error || !data) {
      return { error: `The check-in could not be created: ${error?.message ?? "unknown error"}` };
    }
    checkInId = data.id;
  } else {
    const { error } = await supabase
      .from("check_ins")
      .update({ status: "coach_recorded", held_at: heldAt })
      .eq("id", checkInId);
    if (error) return { error: `The check-in could not be updated: ${error.message}` };
  }

  const { error: noteError } = await supabase.from("check_in_notes").upsert(
    {
      check_in_id: checkInId,
      open_context: openContext,
      progress_summary: progressSummary,
      blockers,
      way_forward: wayForward,
    },
    { onConflict: "check_in_id" },
  );

  if (noteError) return { error: `The notes could not be saved: ${noteError.message}` };

  if (transcript) {
    const { error: transcriptError } = await supabase.from("transcript_entries").insert({
      check_in_id: checkInId,
      author_person_id: viewer.personId,
      body: transcript,
    });
    if (transcriptError) {
      return { error: `The transcript could not be saved: ${transcriptError.message}` };
    }
  }

  refresh();
  return { error: null, message: "Check-in recorded." };
}

/** The participant signs the record their coach wrote. */
export async function acknowledgeCheckIn(checkInId: number): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const { error } = await supabase.from("check_in_acknowledgments").insert({
    check_in_id: checkInId,
    actor_person_id: viewer.personId,
    actor_capacity: "participant",
  });

  if (error && !error.message.includes("duplicate")) {
    return { error: `The check-in could not be signed: ${error.message}` };
  }

  const { data: updated, error: statusError } = await supabase
    .from("check_ins")
    .update({ status: "employee_acknowledged" })
    .eq("id", checkInId)
    .eq("status", "coach_recorded")
    .select("id");
  if (statusError) {
    return { error: `The check-in could not be signed: ${statusError.message}` };
  }
  if (!updated || updated.length === 0) {
    return { error: "This check-in is not waiting on your signature." };
  }

  refresh();
  return { error: null, message: "Signed." };
}

/* ---------------------------------------------------------------- reviews */

interface ScoreInput {
  charterGoalId: number;
  actualResult: string;
  attainment: number;
  evidenceNote: string;
}

function parseScores(raw: FormDataEntryValue | null): ScoreInput[] | string {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "The scores could not be read. Reload the page and try again.";
  }
  if (!Array.isArray(parsed)) return "The scores could not be read.";

  const scores: ScoreInput[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const score = entry as Record<string, unknown>;
    const charterGoalId = Number(score.charterGoalId);
    const actualResult = String(score.actualResult ?? "").trim();
    const evidenceNote = String(score.evidenceNote ?? "").trim();
    const attainmentRaw = score.attainment;
    if (!Number.isInteger(charterGoalId) || charterGoalId <= 0) continue;
    if (!actualResult && !evidenceNote && (attainmentRaw === "" || attainmentRaw === null))
      continue;
    const attainment = Number(attainmentRaw);
    if (!Number.isFinite(attainment) || attainment < 0 || attainment > 1) {
      return "Attainment sits between 0.00 and 1.00.";
    }
    scores.push({
      charterGoalId,
      actualResult: actualResult || "Not provided yet.",
      attainment,
      evidenceNote: evidenceNote || "Verified against the named data source.",
    });
  }

  return scores;
}

/**
 * A coach's quarterly review, with the per-goal scores it rests on.
 *
 * The quarterly score itself is not written here — the schema computes it as a
 * generated column from the two ratings and the 0.6/0.4 split, so there is one
 * place the weighting can come from.
 */
export async function saveReview(
  _previous: CoachingActionResult,
  formData: FormData,
): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const participantId = Number(formData.get("participant_id"));
  const quarterId = Number(formData.get("quarter_id"));
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return { error: "Choose the person this review is for." };
  }
  if (!Number.isInteger(quarterId) || quarterId <= 0) {
    return { error: "Choose the quarter this review covers." };
  }

  const competencyRating = formData.get("competency_rating")
    ? Number(formData.get("competency_rating"))
    : null;

  for (const rating of [competencyRating]) {
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return { error: "Ratings sit between 1 and 5." };
    }
  }

  const recommendationRaw = String(formData.get("recommendation") ?? "").trim();
  const recommendation =
    recommendationRaw && RECOMMENDATIONS.includes(recommendationRaw as Recommendation)
      ? (recommendationRaw as Recommendation)
      : null;
  const transcript = String(formData.get("transcript") ?? "").trim();

  const scores = parseScores(formData.get("scores"));
  if (typeof scores === "string") return { error: scores };

  const attainmentAverage =
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s.attainment, 0) / scores.length) * 10000) /
        10000
      : null;

  const patch = {
    cycle_participant_id: participantId,
    quarter_id: quarterId,
    coach_id: viewer.personId,
    goal_attainment_average: attainmentAverage,
    // Score 1 is derived by the database from the per-goal attainment average.
    okr_rating: null,
    competency_rating: competencyRating,
    coach_verified_impact: String(formData.get("coach_verified_impact") ?? "").trim() || null,
    development_needs: String(formData.get("development_needs") ?? "").trim() || null,
    // Kept out of the prototype form. The legacy column remains for old records.
    support_to_provide: null,
    recommendation,
  };

  // Check the released state before writing, not after: the upsert would
  // already have overwritten a released review by the time we could complain.
  const { data: current } = await supabase
    .from("quarterly_reviews")
    .select("status")
    .eq("cycle_participant_id", participantId)
    .eq("quarter_id", quarterId)
    .maybeSingle<{ status: string }>();

  if (current?.status === "released" || current?.status === "employee_acknowledged") {
    return { error: "This review has been released and can no longer be edited." };
  }

  const { data: review, error } = await supabase
    .from("quarterly_reviews")
    .upsert(patch, { onConflict: "cycle_participant_id,quarter_id" })
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error || !review) {
    return { error: `The review could not be saved: ${error?.message ?? "unknown error"}` };
  }

  await supabase.from("goal_scores").delete().eq("quarterly_review_id", review.id);
  if (scores.length > 0) {
    const { error: scoreError } = await supabase.from("goal_scores").insert(
      scores.map((score) => ({
        quarterly_review_id: review.id,
        charter_goal_id: score.charterGoalId,
        actual_result: score.actualResult,
        attainment: score.attainment,
        evidence_note: score.evidenceNote,
      })),
    );
    if (scoreError) return { error: `The goal scores could not be saved: ${scoreError.message}` };
  }

  if (transcript) {
    const { error: transcriptError } = await supabase.from("transcript_entries").insert({
      quarterly_review_id: review.id,
      author_person_id: viewer.personId,
      body: transcript,
    });
    if (transcriptError) {
      return { error: `The transcript could not be saved: ${transcriptError.message}` };
    }
  }

  refresh();
  return { error: null, message: "Review saved." };
}

/** Append a transcript note from a record page. */
export async function addTranscriptEntry(
  parent: { type: "check_in"; id: number } | { type: "review"; id: number },
  body: string,
): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const text = body.trim();
  if (!text) return { error: "Write the transcript entry first." };

  const payload: {
    check_in_id?: number;
    quarterly_review_id?: number;
    author_person_id: number;
    body: string;
  } =
    parent.type === "check_in"
      ? { check_in_id: parent.id, author_person_id: viewer.personId, body: text }
      : { quarterly_review_id: parent.id, author_person_id: viewer.personId, body: text };
  const { error } = await viewer.supabase.from("transcript_entries").insert(payload);
  if (error) return { error: `The transcript could not be saved: ${error.message}` };

  refresh();
  return { error: null, message: "Transcript entry added." };
}

/** Release a completed review to the person it is about. Calibration is optional. */
export async function releaseReview(reviewId: number): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };

  const { data: review } = await viewer.supabase
    .from("quarterly_reviews")
    .select("id, coach_id, okr_rating, competency_rating, status")
    .eq("id", reviewId)
    .maybeSingle<{
      id: number;
      coach_id: number;
      okr_rating: number | null;
      competency_rating: number | null;
      status: string;
    }>();

  if (!review) return { error: "That review is not available to you." };
  if (!viewer.isAdmin && review.coach_id !== viewer.personId) {
    return { error: "Only the assigned coach or Leadership can release this score." };
  }
  if (review.okr_rating === null || review.competency_rating === null) {
    return { error: "Both ratings must be set before a review can be released." };
  }
  if (!["coach_draft", "calibration", "founder_signed"].includes(review.status)) {
    return { error: "This review is not ready to be released." };
  }
  if (!viewer.isAdmin && review.status !== "coach_draft") {
    return { error: "Leadership must release a review that is already in calibration." };
  }

  const { data: released, error } = await viewer.supabase
    .from("quarterly_reviews")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("id")
    .maybeSingle<{ id: number }>();

  if (error) return { error: `The review could not be released: ${error.message}` };
  if (!released) return { error: "The review could not be released in its current state." };

  refresh();
  return { error: null, message: "Released." };
}

/** Release every completed review assigned to the current coach in the active cycle. */
export async function releaseOwnReviews(): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };

  const cycle = await getActiveCycle(viewer.supabase);
  if (!cycle) return { error: "No cycle is open." };

  const participants = (await getVisibleParticipants(viewer.supabase, cycle.id)).filter(
    (participant) => participant.coachId === viewer.personId,
  );
  const participantIds = participants.map((participant) => participant.id);
  if (participantIds.length === 0) {
    return { error: "You do not have any assigned people in the active cycle." };
  }

  const { data: reviews, error: reviewError } = await viewer.supabase
    .from("quarterly_reviews")
    .select("id, okr_rating, competency_rating")
    .in("cycle_participant_id", participantIds)
    .eq("status", "coach_draft")
    .returns<{ id: number; okr_rating: number | null; competency_rating: number | null }[]>();

  if (reviewError) return { error: `Scores could not be loaded: ${reviewError.message}` };

  const eligibleIds = (reviews ?? [])
    .filter((review) => review.okr_rating !== null && review.competency_rating !== null)
    .map((review) => review.id);
  if (eligibleIds.length === 0) {
    return { error: "No completed scores are ready to release." };
  }

  const { data: released, error: releaseError } = await viewer.supabase
    .from("quarterly_reviews")
    .update({ status: "released", released_at: new Date().toISOString() })
    .in("id", eligibleIds)
    .eq("status", "coach_draft")
    .select("id")
    .returns<{ id: number }[]>();

  if (releaseError) return { error: `Scores could not be released: ${releaseError.message}` };

  const releasedCount = released?.length ?? 0;
  if (releasedCount === 0) return { error: "No scores were released." };

  refresh();
  return {
    error: null,
    message: `${releasedCount} ${releasedCount === 1 ? "score" : "scores"} released to your people.`,
  };
}

/** Leadership records a calibration decision, including a final score override. */
export async function calibrateReview(
  reviewId: number,
  calibratedScore: number | null,
  rationale: string,
): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  if (!viewer.isAdmin) return { error: "Only Leadership can calibrate scores." };

  const score = calibratedScore === null ? null : Number(calibratedScore);
  const note = rationale.trim();
  if (score !== null && (!Number.isFinite(score) || score < 1 || score > 5)) {
    return { error: "The calibrated score must be between 1.00 and 5.00." };
  }
  if (!note) return { error: "Explain the calibration decision." };

  const { data: review } = await viewer.supabase
    .from("quarterly_reviews")
    .select("id, okr_rating, competency_rating, calibrated_score, status")
    .eq("id", reviewId)
    .maybeSingle<{
      id: number;
      okr_rating: number | null;
      competency_rating: number | null;
      calibrated_score: number | null;
      status: string;
    }>();
  if (!review) return { error: "That review is not available to you." };
  if (review.okr_rating === null || review.competency_rating === null) {
    return { error: "The coach must record both ratings before calibration." };
  }
  if (["released", "employee_acknowledged"].includes(review.status)) {
    return { error: "Released scores cannot be recalibrated." };
  }

  const { data: calibrated, error: updateError } = await viewer.supabase
    .from("quarterly_reviews")
    .update({ calibrated_score: score, status: "calibration" })
    .eq("id", reviewId)
    .select("id")
    .maybeSingle<{ id: number }>();
  if (updateError) return { error: `The score could not be calibrated: ${updateError.message}` };
  if (!calibrated) return { error: "The review could not be calibrated in its current state." };

  const { error: eventError } = await viewer.supabase.from("calibration_events").insert({
    quarterly_review_id: reviewId,
    actor_person_id: viewer.personId,
    previous_okr_rating: review.okr_rating,
    new_okr_rating: review.okr_rating,
    previous_competency_rating: review.competency_rating,
    new_competency_rating: review.competency_rating,
    previous_calibrated_score: review.calibrated_score,
    new_calibrated_score: score,
    rationale: note,
  });
  if (eventError)
    return { error: `The calibration note could not be saved: ${eventError.message}` };

  refresh();
  return {
    error: null,
    message: "Calibration saved. Release the score when sign-off is complete.",
  };
}

/** The person signs their released review. */
export async function acknowledgeReview(
  reviewId: number,
  comment: string,
): Promise<CoachingActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has expired. Sign in again." };
  const { supabase } = viewer;

  const cycle = await getActiveCycle(supabase);
  if (!cycle) return { error: "No cycle is open." };
  const participant = await getOwnParticipant(supabase, cycle.id, viewer.personId);
  if (!participant) return { error: "You are not enrolled in the current cycle." };

  const { error } = await supabase.from("review_acknowledgments").insert({
    quarterly_review_id: reviewId,
    actor_person_id: viewer.personId,
    actor_capacity: "participant",
    decision: "acknowledged",
    verbatim_comment: comment.trim() || null,
  });

  if (error && !error.message.includes("duplicate")) {
    return { error: `The review could not be signed: ${error.message}` };
  }

  const { data: updated, error: statusError } = await supabase
    .from("quarterly_reviews")
    .update({ status: "employee_acknowledged" })
    .eq("id", reviewId)
    .eq("status", "released")
    .select("id");
  if (statusError) {
    return { error: `The review could not be signed: ${statusError.message}` };
  }
  if (!updated || updated.length === 0) {
    return { error: "This review is not waiting on your signature." };
  }

  refresh();
  return { error: null, message: "Signed." };
}
