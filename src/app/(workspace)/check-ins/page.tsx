import { CalendarCheck2 } from "lucide-react";

import { CheckInFramework } from "@/app/components/check-in-framework";
import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVE_CYCLE, CHECKIN_MONTHS } from "@/data/performance";

const GET_THE_MOST = [
  "Come with your charter open and know your numbers — the 15 minutes are for discussion, not status recital.",
  "Raise blockers early and honestly, while there is still time to act on them.",
  "Ask for feedback, and expect it to be specific. Nothing at your review should be a surprise.",
  "Leave with clarity: you should be able to say exactly what happens next and who owes what.",
];

export default function CheckInsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`0 of ${ACTIVE_CYCLE.checkins} recorded`}
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
      <Card>
        <CardContent className="grid gap-3">
          {CHECKIN_MONTHS.map((month, index) => (
            <div
              key={month}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-muted">
                <CalendarCheck2 className="size-4" />
              </span>
              <div className="flex-1">
                <p className="font-medium">{month}</p>
                <p className="text-xs text-muted-foreground">
                  {index === 0
                    ? "Available once your charter is approved"
                    : "Opens after the previous month"}
                </p>
              </div>
              <Badge variant="outline">Not recorded</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
