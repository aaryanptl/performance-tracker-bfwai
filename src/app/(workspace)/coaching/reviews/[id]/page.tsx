import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/app/components/page-header";
import { ReviewForm } from "@/app/components/performance-forms";
import { ReleaseReviewButton } from "@/app/components/record-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCycle, getParticipantById } from "@/lib/data/cycle";
import { REVIEW_STATUS_LABELS } from "@/lib/data/performance-types";
import { getCharter, getReviews } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const { id } = await params;
  const participantId = Number(id);
  if (!Number.isInteger(participantId) || participantId <= 0) notFound();

  const participant = await getParticipantById(viewer.supabase, participantId);
  if (!participant) notFound();

  const cycle = await getActiveCycle(viewer.supabase);
  if (!cycle) notFound();

  const [charter, reviews] = await Promise.all([
    getCharter(viewer.supabase, participantId),
    getReviews(viewer.supabase, participantId),
  ]);

  // Only an approved charter is a fair basis to score against.
  const goals = charter?.status === "approved_locked" ? charter.goals : (charter?.goals ?? []);
  const releasable = reviews.filter(
    (review) =>
      review.okrRating !== null && review.competencyRating !== null && review.releasedAt === null,
  );

  return (
    <>
      <PageHeader
        eyebrow={cycle.name}
        title={`Review ${participant.personName}`}
        description="Rate the work against agreed outcomes and the behaviours expected at the person's level."
      />

      {viewer.isAdmin && releasable.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ready to release</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {releasable.map((review) => (
              <div
                key={review.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{review.quarterName}</p>
                  <p className="text-xs text-muted-foreground">
                    {REVIEW_STATUS_LABELS[review.status]} &middot; score{" "}
                    {review.quarterlyScore?.toFixed(2) ?? "—"}
                  </p>
                </div>
                <ReleaseReviewButton reviewId={review.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ReviewForm
        participantId={participantId}
        personName={participant.personName}
        quarters={cycle.quarters}
        goals={goals}
        reviews={reviews}
      />
    </>
  );
}
