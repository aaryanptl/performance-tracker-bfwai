import { SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";

import { CalibrationForm } from "@/app/components/calibration-form";
import { PageHeader } from "@/app/components/page-header";
import { ReleaseReviewButton } from "@/app/components/record-actions";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCycleForRequest, getVisibleParticipants } from "@/lib/data/cycle";
import { REVIEW_STATUS_LABELS } from "@/lib/data/performance-types";
import { getReviews } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

export default async function CalibrationPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  const participants = cycle ? await getVisibleParticipants(viewer.supabase, cycle.id) : [];
  const entries = (
    await Promise.all(
      participants.map(async (participant) => {
        const reviews = await getReviews(viewer.supabase, participant.id);
        return reviews
          .filter(
            (review) =>
              review.okrRating !== null &&
              review.competencyRating !== null &&
              review.status !== "released" &&
              review.status !== "employee_acknowledged",
          )
          .map((review) => ({ participant, review }));
      }),
    )
  ).flat();

  return (
    <>
      <PageHeader
        eyebrow="Leadership only"
        title="Calibration"
        description="Review coach ratings, optionally record a final score adjustment with a reason, then release the agreed score to the team member."
      />
      {!cycle || entries.length === 0 ? (
        <WorkflowEmpty
          icon={SlidersHorizontal}
          title="Nothing is ready for calibration or release"
          description={
            cycle
              ? "Completed coach reviews will appear here for optional calibration or direct release."
              : "Open a cycle and complete a coach review first."
          }
        />
      ) : (
        <div className="grid gap-6">
          {entries.map(({ participant, review }) => (
            <Card key={review.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>{participant.personName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.quarterName} · coach {review.coachName ?? "—"}
                  </p>
                </div>
                <Badge variant="outline">{REVIEW_STATUS_LABELS[review.status]}</Badge>
              </CardHeader>
              <CardContent className="grid gap-4">
                <CalibrationForm review={review} />
                <div>
                  <ReleaseReviewButton reviewId={review.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
