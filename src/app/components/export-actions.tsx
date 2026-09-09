"use client";

import { BookOpen, FileJson } from "lucide-react";
import Link from "next/link";

import { CsvDownloadButton } from "@/app/components/csv-download-button";
import { Button } from "@/components/ui/button";
import type { ExportSet } from "@/lib/data/exports";

function downloadJson(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Downloads built from the records the current viewer may already read. */
export function ExportActions({
  exports: files,
  canDownloadAll,
}: {
  exports: ExportSet;
  canDownloadAll: boolean;
}) {
  const csvFiles = [
    { filename: "ascend-people.csv", content: files.people },
    { filename: "ascend-charters.csv", content: files.charters },
    { filename: "ascend-check-ins.csv", content: files.checkIns },
    { filename: "ascend-impact.csv", content: files.impact },
    { filename: "ascend-scores.csv", content: files.scores },
    { filename: "ascend-transcript.csv", content: files.transcript },
    { filename: "ascend-development-actions.csv", content: files.developmentActions },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <Button nativeButton={false} render={<Link href="/book/team" target="_blank" />}>
        <BookOpen />
        Record book
      </Button>
      <CsvDownloadButton files={csvFiles} label="All CSVs" />
      <CsvDownloadButton filename="ascend-people.csv" content={files.people} label="People CSV" />
      <CsvDownloadButton filename="ascend-charters.csv" content={files.charters} label="Charters" />
      <CsvDownloadButton
        filename="ascend-check-ins.csv"
        content={files.checkIns}
        label="Check-ins"
      />
      <CsvDownloadButton filename="ascend-impact.csv" content={files.impact} label="Impact" />
      <CsvDownloadButton filename="ascend-scores.csv" content={files.scores} label="Scores" />
      <CsvDownloadButton
        filename="ascend-transcript.csv"
        content={files.transcript}
        label="Transcript"
      />
      <CsvDownloadButton
        filename="ascend-development-actions.csv"
        content={files.developmentActions}
        label="Development actions"
      />
      {canDownloadAll ? (
        <Button variant="outline" onClick={() => downloadJson("ascend-backup.json", files.backup)}>
          <FileJson />
          JSON backup
        </Button>
      ) : null}
    </div>
  );
}
