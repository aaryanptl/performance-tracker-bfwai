"use client";

import { Download, FileJson } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PEOPLE } from "@/data/people";
import { useSession } from "@/hooks/use-session";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportActions() {
  const { person } = useSession();
  const visible =
    person?.role === "admin"
      ? PEOPLE
      : PEOPLE.filter(
          (candidate) => candidate.id === person?.id || candidate.coachId === person?.id,
        );
  const csv = [
    "Name,Email,Role,Unit,Level",
    ...visible.map((candidate) =>
      [candidate.name, candidate.email, candidate.role, candidate.unit, candidate.level]
        .map((cell) => `"${cell}"`)
        .join(","),
    ),
  ].join("\n");
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => download("ascend-people.csv", csv, "text/csv")}>
        <Download />
        Download CSV
      </Button>
      {person?.role === "admin" ? (
        <Button
          variant="outline"
          onClick={() =>
            download(
              "ascend-backup.json",
              JSON.stringify({ people: visible }, null, 2),
              "application/json",
            )
          }
        >
          <FileJson />
          JSON backup
        </Button>
      ) : null}
    </div>
  );
}
