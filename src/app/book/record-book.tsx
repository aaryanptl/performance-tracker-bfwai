import {
  CHARTER_STATUS_LABELS,
  CHECK_IN_STATUS_LABELS,
  halfYearScore,
  IMPACT_STATUS_LABELS,
  type PersonRecord,
  RECOMMENDATION_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/data/performance-types";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Paragraphs({ text }: { text: string | null }) {
  if (!text) return <p className="muted">Not recorded.</p>;
  return (
    <>
      {text.split(/\n+/).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );
}

/** One person's complete cycle, laid out to read on screen and to print. */
export function RecordBook({ record }: { record: PersonRecord }) {
  const { participant, cycle, charter, checkIns, impactStatements, reviews } = record;
  const half = halfYearScore(reviews);

  return (
    <article className="person">
      <div className="band">
        <div className="eyebrow" style={{ color: "#b9d9ef" }}>
          {cycle.name} &middot; performance record
        </div>
        <h1>{participant.personName}</h1>
        <div className="sub">
          {participant.title} &middot; {participant.unitName}
          {participant.coachName ? ` · coached by ${participant.coachName}` : ""}
        </div>
        <div className="sub" style={{ marginTop: 10 }}>
          Cycle {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)} &middot; generated{" "}
          {formatDate(new Date().toISOString())}
        </div>
      </div>

      <h2>1 &middot; Goal Charter</h2>
      {charter ? (
        <>
          <p className="muted">
            Status: {CHARTER_STATUS_LABELS[charter.status]} &middot; sent{" "}
            {formatDate(charter.submittedAt)} &middot; coach review{" "}
            {formatDate(charter.coachReviewedAt)} &middot; approved{" "}
            {formatDate(charter.founderApprovedAt)}
          </p>
          {charter.goals.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Objective</th>
                  <th>Key result</th>
                  <th>Baseline</th>
                  <th>Target</th>
                  <th>Data source</th>
                </tr>
              </thead>
              <tbody>
                {charter.goals.map((goal) => (
                  <tr key={goal.id}>
                    <td>{goal.outcome}</td>
                    <td>{goal.keyResult}</td>
                    <td className="num">{goal.baseline}</td>
                    <td className="num">{goal.target}</td>
                    <td>{goal.dataSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No goals recorded.</p>
          )}

          <h3>Competency commitments</h3>
          {charter.competencies.length > 0 ? (
            charter.competencies.map((competency) => (
              <div key={competency.id} className="box">
                <span className="pill">{competency.name}</span>
                <p style={{ marginTop: 8 }}>{competency.commitment}</p>
              </div>
            ))
          ) : (
            <p className="muted">No competency commitments recorded.</p>
          )}

          {charter.decisions.length > 0 ? (
            <>
              <h3>Review history</h3>
              {charter.decisions.map((decision) => (
                <div key={decision.id} className="box">
                  <p>
                    <strong>{decision.actorName}</strong> &middot; {decision.capacity} &middot;{" "}
                    {decision.decision.replace(/_/g, " ")} &middot;{" "}
                    {formatDate(decision.createdAt)}
                  </p>
                  {decision.comment ? <p className="muted">{decision.comment}</p> : null}
                </div>
              ))}
            </>
          ) : null}
        </>
      ) : (
        <p className="muted">No charter has been drafted for this cycle.</p>
      )}

      <h2>2 &middot; Monthly check-ins</h2>
      {checkIns.length > 0 ? (
        checkIns.map((checkIn) => (
          <div key={checkIn.id} className="box">
            <p>
              <strong>{formatDate(checkIn.monthStart)}</strong> &middot; check-in{" "}
              {checkIn.checkInNumber} &middot; {CHECK_IN_STATUS_LABELS[checkIn.status]}
              {checkIn.coachName ? ` · ${checkIn.coachName}` : ""}
              {checkIn.acknowledgedByParticipant ? " · signed" : ""}
            </p>
            {checkIn.notes ? (
              <>
                <h3>Progress</h3>
                <Paragraphs text={checkIn.notes.progressSummary} />
                {checkIn.notes.blockers ? (
                  <>
                    <h3>Blockers</h3>
                    <Paragraphs text={checkIn.notes.blockers} />
                  </>
                ) : null}
                {checkIn.notes.recognition ? (
                  <>
                    <h3>Recognition</h3>
                    <Paragraphs text={checkIn.notes.recognition} />
                  </>
                ) : null}
                <h3>Way forward</h3>
                <Paragraphs text={checkIn.notes.wayForward} />
                {checkIn.notes.supportToArrange ? (
                  <>
                    <h3>Support to arrange</h3>
                    <Paragraphs text={checkIn.notes.supportToArrange} />
                  </>
                ) : null}
              </>
            ) : (
              <p className="muted">Scheduled, not yet recorded.</p>
            )}
          </div>
        ))
      ) : (
        <p className="muted">No check-ins recorded for this cycle.</p>
      )}

      <h2>3 &middot; Impact statements</h2>
      {impactStatements.length > 0 ? (
        impactStatements.map((statement) => (
          <div key={statement.id} className="box">
            <p>
              <strong>{statement.quarterName ?? "Half year"}</strong> &middot;{" "}
              {IMPACT_STATUS_LABELS[statement.status]}
              {statement.submittedAt ? ` · shared ${formatDate(statement.submittedAt)}` : ""}
            </p>
            {statement.items.map((item) => (
              <div key={item.id} style={{ marginTop: 10 }}>
                <h3>Impact created</h3>
                <Paragraphs text={item.impactCreated} />
                <h3>Numbers &amp; evidence</h3>
                <Paragraphs text={item.numbersAndEvidence} />
                {item.competencyDemonstrated ? (
                  <>
                    <h3>Competency demonstrated</h3>
                    <Paragraphs text={item.competencyDemonstrated} />
                  </>
                ) : null}
              </div>
            ))}
            {statement.learningCarriedForward ? (
              <>
                <h3>Learning carried forward</h3>
                <Paragraphs text={statement.learningCarriedForward} />
              </>
            ) : null}
          </div>
        ))
      ) : (
        <p className="muted">No impact statement has been written for this cycle.</p>
      )}

      <h2>4 &middot; Scores</h2>
      {reviews.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Goal attainment</th>
                <th>What was delivered</th>
                <th>How it was delivered</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.quarterName}</td>
                  <td className="num">
                    {review.goalAttainmentAverage === null
                      ? "—"
                      : review.goalAttainmentAverage.toFixed(2)}
                  </td>
                  <td className="num">{review.okrRating ?? "—"}</td>
                  <td className="num">{review.competencyRating ?? "—"}</td>
                  <td className="num">
                    {review.releasedAt && review.quarterlyScore !== null
                      ? review.quarterlyScore.toFixed(2)
                      : "—"}
                  </td>
                  <td>{REVIEW_STATUS_LABELS[review.status]}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <strong>Half-yearly (average of released quarters)</strong>
                </td>
                <td className="num">
                  <strong>{half === null ? "—" : half.toFixed(2)}</strong>
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          {reviews.map((review) => (
            <div key={`detail-${review.id}`} className="box">
              <p>
                <strong>{review.quarterName}</strong>
                {review.coachName ? ` · ${review.coachName}` : ""}
                {review.recommendation
                  ? ` · ${RECOMMENDATION_LABELS[review.recommendation]}`
                  : ""}
              </p>
              {review.goalScores.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Actual result</th>
                      <th>Attainment</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.goalScores.map((score) => (
                      <tr key={score.id}>
                        <td>{score.goalOutcome}</td>
                        <td>{score.actualResult}</td>
                        <td className="num">{score.attainment.toFixed(2)}</td>
                        <td>{score.evidenceNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {review.coachVerifiedImpact ? (
                <>
                  <h3>Coach-verified impact</h3>
                  <Paragraphs text={review.coachVerifiedImpact} />
                </>
              ) : null}
              {review.developmentNeeds ? (
                <>
                  <h3>Development needs</h3>
                  <Paragraphs text={review.developmentNeeds} />
                </>
              ) : null}
              {review.supportToProvide ? (
                <>
                  <h3>Support to provide</h3>
                  <Paragraphs text={review.supportToProvide} />
                </>
              ) : null}
            </div>
          ))}
        </>
      ) : (
        <p className="muted">No scores have been recorded for this cycle.</p>
      )}
    </article>
  );
}
