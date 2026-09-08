"use client";

import { FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CheckInDraft {
  openContext: string;
  progressSummary: string;
  blockers: string;
  wayForward: string;
}

interface TranscriptAssistantProps {
  participantId: number;
  monthStart: string;
  personName: string;
  onApply: (draft: CheckInDraft, transcript: string) => void;
}

const MAX_FILE_SIZE = 1_000_000;

export function TranscriptAssistant({
  participantId,
  monthStart,
  personName,
  onApply,
}: TranscriptAssistantProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<CheckInDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setDraft(null);
    if (file.size > MAX_FILE_SIZE) {
      setError("Keep the transcript file under 1 MB.");
      return;
    }
    if (!file.type.startsWith("text/") && !/\.(txt|md|csv)$/i.test(file.name)) {
      setError("Upload a plain-text transcript (.txt, .md, or .csv).");
      return;
    }
    setFileName(file.name);
    setTranscript(await file.text());
  };

  const analyse = async () => {
    setError("");
    if (!transcript.trim()) {
      setError("Paste a transcript or upload a text file first.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/coaching/check-in-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, monthStart, transcript }),
      });
      const result = (await response.json()) as { draft?: CheckInDraft; error?: string };
      if (!response.ok || !result.draft) {
        setError(result.error || "The transcript could not be analysed.");
        return;
      }
      setDraft(result.draft);
    } catch {
      setError("The transcript could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline">
              <Upload />
              Upload transcript
            </Button>
          }
        />
        <DialogContent className="max-h-[85vh] gap-5 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              Fill check-in from transcript
            </DialogTitle>
            <DialogDescription>
              Add a transcript for {personName}. Gemini will prepare an editable draft for the four
              check-in fields.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/25 p-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <FileText className="size-4 shrink-0 text-brand" />
                <span className="truncate">{fileName || "No transcript file selected"}</span>
              </div>
              <Input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                className="hidden"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload />
                Choose file
              </Button>
            </div>

            <Textarea
              value={transcript}
              onChange={(event) => {
                setTranscript(event.target.value);
                setDraft(null);
              }}
              rows={10}
              placeholder="Or paste the meeting transcript here…"
              aria-label="Transcript to analyse"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Plain-text files up to 1 MB. The transcript is sent to Gemini for analysis and is
              saved with the check-in only when you submit the form.
            </p>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          {draft ? (
            <div className="grid gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
              <div>
                <p className="text-sm font-medium">Draft ready</p>
                <p className="text-xs text-muted-foreground">
                  Apply it to the form, then edit anything that needs correction.
                </p>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <DraftPreview label="Progress" value={draft.progressSummary} />
                <DraftPreview label="Way forward" value={draft.wayForward} />
                <DraftPreview label="Opening context" value={draft.openContext} />
                <DraftPreview label="Blockers" value={draft.blockers} />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            {draft ? (
              <Button
                type="button"
                onClick={() => {
                  onApply(draft, transcript.trim());
                  setOpen(false);
                }}
              >
                Apply to form
              </Button>
            ) : (
              <Button type="button" onClick={analyse} disabled={busy || !transcript.trim()}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                {busy ? "Analysing…" : "Analyse transcript"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraftPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-3 leading-5">{value || "No support found in transcript."}</p>
    </div>
  );
}
