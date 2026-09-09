"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type CsvRow, csvFromRows } from "@/lib/csv";

export interface CsvDownloadFile {
  filename: string;
  content: string;
}

function downloadFile({ filename, content }: CsvDownloadFile) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadFiles(files: readonly CsvDownloadFile[]) {
  files.forEach(downloadFile);
}

export function CsvDownloadButton({
  filename,
  rows,
  content,
  files,
  label = "Download CSV",
  size = "sm",
}: {
  filename?: string;
  rows?: readonly CsvRow[];
  content?: string;
  files?: readonly CsvDownloadFile[];
  label?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";
}) {
  function handleDownload() {
    if (files) {
      downloadFiles(files);
      return;
    }
    if (!filename) return;
    downloadFile({ filename, content: content ?? csvFromRows(rows ?? []) });
  }

  return (
    <Button size={size} variant="outline" onClick={handleDownload}>
      <Download />
      {label}
    </Button>
  );
}
