import { CalendarCheck2 } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CHECKIN_MONTHS } from "@/data/performance";

export default function CheckInsPage() {
  return (
    <>
      <PageHeader
        eyebrow="0 of 6 complete"
        title="Monthly check-ins"
        description="Short, honest conversations that connect goals to reality and leave both people with clear commitments."
      />
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
                    ? "Available once your charter is submitted"
                    : "Opens after the previous month"}
                </p>
              </div>
              <Badge variant="outline">Not started</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
