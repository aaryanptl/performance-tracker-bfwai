"use client";

import { BookOpen, Download, FileJson } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ExportSet } from "@/lib/data/exports";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * The downloads offered on the records page.
 *
 * Every file is built on the server from the records the caller may read, so
 * the button set can be decided purely on what is useful — the boundary has
 * already been applied to the contents.
 */
export function ExportActions({
  exports: files,
  canDownloadAll,
}: {
  exports: ExportSet;
  canDownloadAll: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button nativeButton={false} render={<Link href="/book/team" target="_blank" />}>
        <BookOpen />
        Record book
      </Button>
      <Button
        variant="outline"
        onClick={() => download("ascend-people.csv", files.people, "text/csv")}
      >
        <Download />
        People CSV
      </Button>
      <Button
        variant="outline"
        onClick={() => download("ascend-charters.csv", files.charters, "text/csv")}
      >
        <Download />
        Charters
      </Button>
      <Button
        variant="outline"
        onClick={() => download("ascend-check-ins.csv", files.checkIns, "text/csv")}
      >
        <Download />
        Check-ins
      </Button>
      <Button
        variant="outline"
        onClick={() => download("ascend-impact.csv", files.impact, "text/csv")}
      >
        <Download />
        Impact
      </Button>
      <Button
        variant="outline"
        onClick={() => download("ascend-scores.csv", files.scores, "text/csv")}
      >
        <Download />
        Scores
      </Button>
      {canDownloadAll ? (
        <Button
          variant="outline"
          onClick={() => download("ascend-backup.json", files.backup, "application/json")}
        >
          <FileJson />
          JSON backup
        </Button>
      ) : null}
    </div>
  );
}
