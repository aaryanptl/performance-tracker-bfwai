import type {
  CycleSummary,
  ParticipantSummary,
  QuarterSummary,
} from "@/lib/data/performance-types";
import type { SupabaseClient } from "@/lib/data/viewer";

interface CycleRow {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  goal_window_start: string;
  goal_window_end: string;
  okr_weight: number;
  competency_weight: number;
  max_goals: number;
  status: string;
}

interface QuarterRow {
  id: number;
  sequence: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

function toQuarter(row: QuarterRow): QuarterSummary {
  return {
    id: row.id,
    sequence: row.sequence,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

/**
 * The cycle the workspace is currently working in: the newest one that is not
 * closed, falling back to the newest of any status so a closed programme still
 * renders its history instead of an empty app.
 */
export async function getActiveCycle(supabase: SupabaseClient): Promise<CycleSummary | null> {
  const { data } = await supabase
    .from("cycles")
    .select(
      "id, name, start_date, end_date, goal_window_start, goal_window_end, okr_weight, competency_weight, max_goals, status",
    )
    .order("start_date", { ascending: false })
    .returns<CycleRow[]>();

  if (!data || data.length === 0) return null;
  const row = data.find((candidate) => candidate.status !== "closed") ?? data[0];

  const { data: quarters } = await supabase
    .from("quarters")
    .select("id, sequence, name, start_date, end_date, status")
    .eq("cycle_id", row.id)
    .order("sequence")
    .returns<QuarterRow[]>();

  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    goalWindowStart: row.goal_window_start,
    goalWindowEnd: row.goal_window_end,
    okrWeight: Number(row.okr_weight),
    competencyWeight: Number(row.competency_weight),
    maxGoals: row.max_goals,
    status: row.status,
    quarters: (quarters ?? []).map(toQuarter),
  };
}

interface ParticipantRow {
  id: number;
  cycle_id: number;
  person_id: number;
  coach_id: number | null;
  title_snapshot: string;
  job_level_snapshot: number;
  person: { display_name: string; work_email: string } | null;
  coach: { display_name: string } | null;
  unit: { name: string } | null;
}

const PARTICIPANT_SELECT =
  "id, cycle_id, person_id, coach_id, title_snapshot, job_level_snapshot, " +
  "person:people!cycle_participants_person_id_fkey(display_name, work_email), " +
  "coach:people!cycle_participants_coach_id_fkey(display_name), " +
  "unit:units(name)";

function toParticipant(row: ParticipantRow): ParticipantSummary {
  return {
    id: row.id,
    cycleId: row.cycle_id,
    personId: row.person_id,
    personName: row.person?.display_name ?? "Unknown",
    personEmail: row.person?.work_email ?? "",
    coachId: row.coach_id,
    coachName: row.coach?.display_name ?? null,
    unitName: row.unit?.name ?? "",
    title: row.title_snapshot,
    jobLevel: row.job_level_snapshot,
  };
}

/** The signed-in person's own enrolment in a cycle, if they were enrolled. */
export async function getOwnParticipant(
  supabase: SupabaseClient,
  cycleId: number,
  personId: number,
): Promise<ParticipantSummary | null> {
  const { data } = await supabase
    .from("cycle_participants")
    .select(PARTICIPANT_SELECT)
    .eq("cycle_id", cycleId)
    .eq("person_id", personId)
    .eq("active", true)
    .maybeSingle<ParticipantRow>();

  return data ? toParticipant(data) : null;
}

/**
 * Every participant the caller may read. Row-level security already limits this
 * to themselves plus, for a coach, the people they coach — and everyone for an
 * administrator — so no scope filter is repeated here.
 */
export async function getVisibleParticipants(
  supabase: SupabaseClient,
  cycleId: number,
): Promise<ParticipantSummary[]> {
  const { data } = await supabase
    .from("cycle_participants")
    .select(PARTICIPANT_SELECT)
    .eq("cycle_id", cycleId)
    .eq("active", true)
    .order("id")
    .returns<ParticipantRow[]>();

  return (data ?? []).map(toParticipant);
}

export async function getParticipantById(
  supabase: SupabaseClient,
  participantId: number,
): Promise<ParticipantSummary | null> {
  const { data } = await supabase
    .from("cycle_participants")
    .select(PARTICIPANT_SELECT)
    .eq("id", participantId)
    .maybeSingle<ParticipantRow>();

  return data ? toParticipant(data) : null;
}
