import { CalendarCheck2, CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";

import { CheckInFramework } from "@/app/components/check-in-framework";
import { PageHeader } from "@/app/components/page-header";
import { AcknowledgeCheckInButton } from "@/app/components/record-actions";
import { WorkflowEmpty } from "@/app/components/workflow-empty";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCycleForRequest, getOwnParticipant } from "@/lib/data/cycle";
import { CHECK_IN_STATUS_LABELS } from "@/lib/data/performance-types";
import { getCheckIns } from "@/lib/data/records";
import { getViewer } from "@/lib/data/viewer";

const GET_THE_MOST = [
  "Come with your charter open and know your numbers — the 15 minutes are for discussion, not status recital.",
  "Raise blockers early and honestly, while there is still time to act on them.",
  "Ask for feedback, and expect it to be specific. Nothing at your review should be a surprise.",
  "Leave with clarity: you should be able to say exactly what happens next and who owes what.",
];

function monthLabel(monthStart: string) {
  return new Date(`${monthStart}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function CheckInsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const cycle = await getActiveCycleForRequest();
  const participant = cycle
    ? await getOwnParticipant(viewer.supabase, cycle.id, viewer.personId)
    : null;
  const checkIns = participant ? await getCheckIns(viewer.supabase, participant.id) : [];
  const recorded = checkIns.filter((checkIn) => checkIn.notes !== null).length;

  return (
    <>
      <PageHeader
        eyebrow={`${recorded} of 6 recorded`}
        title="Monthly check-ins"
        description="15 minutes with your coach, once a month. A conversation, not an evaluation — no ratings are given here. The summary and the way forward are recorded, and you both sign the record."
      />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How to get the most from yours</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-muted-foreground">
              {GET_THE_MOST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <CheckInFramework />
      </div>

      {!cycle || !participant ? (
        <WorkflowEmpty
          icon={CalendarClock}
          title={cycle ? "You are not enrolled in this cycle" : "No cycle is open yet"}
          description={
            cycle
              ? "Ask an administrator to add you to the current cycle from Cycles & settings."
              : "An administrator opens the cycle and enrols the roster."
          }
        />
      ) : checkIns.length === 0 ? (
        <WorkflowEmpty
          icon={CalendarCheck2}
          title="No check-ins recorded yet"
          description="Your coach records each conversation here. Once one is recorded you will be able to read it and sign it."
        />
      ) : (
        <Card>
          <CardContent className="grid gap-3">
            {checkIns.map((checkIn) => (
              <div key={checkIn.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted">
                    <CalendarCheck2 className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{monthLabel(checkIn.monthStart)}</p>
                    <p className="text-xs text-muted-foreground">
                      {checkIn.coachName ? `${checkIn.coachName} · ` : ""}
                      {CHECK_IN_STATUS_LABELS[checkIn.status]}
                    </p>
                  </div>
                  {checkIn.acknowledgedByParticipant ? (
                    <Badge variant="outline">Signed</Badge>
                  ) : null}
                </div>

                {checkIn.notes ? (
                  <div className="mt-4 grid gap-3 text-sm leading-6">
                    {checkIn.notes.openContext ? (
                      <div>
                        <p className="font-medium">Open</p>
                        <p className="text-muted-foreground">{checkIn.notes.openContext}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="font-medium">Goals</p>
                      <p className="text-muted-foreground">{checkIn.notes.progressSummary}</p>
                    </div>
                    {checkIn.notes.blockers ? (
                      <div>
                        <p className="font-medium">Blockers</p>
                        <p className="text-muted-foreground">{checkIn.notes.blockers}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="font-medium">Way forward</p>
                      <p className="text-muted-foreground">{checkIn.notes.wayForward}</p>
                    </div>
                    {!checkIn.acknowledgedByParticipant ? (
                      <div className="pt-1">
                        <AcknowledgeCheckInButton checkInId={checkIn.id} />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Scheduled — your coach has not recorded this one yet.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
