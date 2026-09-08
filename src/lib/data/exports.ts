import { halfYearScore, type PersonRecord } from "@/lib/data/performance-types";
import { formatDate, formatDateTime } from "@/lib/utils";

function cell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function rows(lines: (string | number | null)[][]) {
  return lines.map((line) => line.map(cell).join(",")).join("\n");
}

/**
 * The export set, built from the records the caller may already read.
 *
 * Nothing here re-derives scope: `records` comes from `getVisibleRecords`,
 * which reads through row-level security, so a download can never reach
 * further than the screen that offered it.
 */
export function buildExports(records: PersonRecord[]) {
  const people = rows([
    ["Name", "Email", "Title", "Unit", "Level", "Coach", "Charter status", "Half-yearly score"],
    ...records.map((record) => [
      record.participant.personName,
      record.participant.personEmail,
      record.participant.title,
      record.participant.unitName,
      record.participant.jobLevel,
      record.participant.coachName ?? "",
      record.charter?.status ?? "not started",
      halfYearScore(record.reviews)?.toFixed(2) ?? "",
    ]),
  ]);

  const charters = rows([
    ["Person", "Status", "Objective", "Key result", "Baseline", "Target", "Data source"],
    ...records.flatMap((record) =>
      (record.charter?.goals ?? []).map((goal) => [
        record.participant.personName,
        record.charter?.status ?? "",
        goal.outcome,
        goal.keyResult,
        goal.baseline,
        goal.target,
        goal.dataSource,
      ]),
    ),
  ]);

  const checkIns = rows([
    ["Person", "Month", "Status", "Coach", "Open", "Goals", "Reality", "Way forward", "Signed"],
    ...records.flatMap((record) =>
      record.checkIns.map((checkIn) => [
        record.participant.personName,
        formatDate(checkIn.monthStart),
        checkIn.status,
        checkIn.coachName ?? "",
        checkIn.notes?.openContext ?? "",
        checkIn.notes?.progressSummary ?? "",
        checkIn.notes?.blockers ?? "",
        checkIn.notes?.wayForward ?? "",
        checkIn.acknowledgedByParticipant ? "yes" : "no",
      ]),
    ),
  ]);

  const impact = rows([
    ["Person", "Quarter", "Status", "Impact created", "Competency"],
    ...records.flatMap((record) =>
      record.impactStatements.flatMap((statement) =>
        statement.items.map((item) => [
          record.participant.personName,
          statement.quarterName ?? "",
          statement.status,
          item.impactCreated,
          item.competencyDemonstrated ?? "",
        ]),
      ),
    ),
  ]);

  const scores = rows([
    [
      "Person",
      "Quarter",
      "Goal attainment",
      "Score 1 (delivered)",
      "Score 2 (how)",
      "Quarterly score",
      "Calibrated score",
      "Recommendation",
      "Status",
      "Released",
    ],
    ...records.flatMap((record) =>
      record.reviews.map((review) => [
        record.participant.personName,
        review.quarterName,
        review.goalAttainmentAverage?.toFixed(4) ?? "",
        review.okrRating,
        review.competencyRating,
        review.quarterlyScore?.toFixed(2) ?? "",
        review.calibratedScore?.toFixed(2) ?? "",
        review.recommendation ?? "",
        review.status,
        review.releasedAt ? formatDate(review.releasedAt) : "",
      ]),
    ),
  ]);

  const transcript = rows([
    ["Person", "Record type", "Period", "Author", "Created", "Entry"],
    ...records.flatMap((record) => [
      ...record.checkIns.flatMap((checkIn) =>
        checkIn.transcript.map((entry) => [
          record.participant.personName,
          "check-in",
          formatDate(checkIn.monthStart),
          entry.authorName,
          formatDateTime(entry.createdAt),
          entry.body,
        ]),
      ),
      ...record.impactStatements.flatMap((statement) =>
        statement.transcript.map((entry) => [
          record.participant.personName,
          "impact statement",
          statement.quarterName ?? "half year",
          entry.authorName,
          formatDateTime(entry.createdAt),
          entry.body,
        ]),
      ),
      ...record.reviews.flatMap((review) =>
        review.transcript.map((entry) => [
          record.participant.personName,
          "quarterly review",
          review.quarterName,
          entry.authorName,
          formatDateTime(entry.createdAt),
          entry.body,
        ]),
      ),
    ]),
  ]);

  return {
    people,
    charters,
    checkIns,
    impact,
    scores,
    transcript,
    backup: JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2),
  };
}

export type ExportSet = ReturnType<typeof buildExports>;
