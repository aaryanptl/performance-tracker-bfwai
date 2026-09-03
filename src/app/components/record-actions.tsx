"use client";

import { CheckCircle2, Send, Undo2 } from "lucide-react";
import { useActionState, useState } from "react";

import { decideCharter } from "@/app/(workspace)/charter/actions";
import {
  acknowledgeCheckIn,
  acknowledgeReview,
  releaseReview,
} from "@/app/(workspace)/coaching/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ActionState {
  error: string | null;
  message?: string;
}

const IDLE: ActionState = { error: null };

function Result({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <Alert variant="destructive" className="mt-3">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  if (state.message) {
    return (
      <Alert className="mt-3">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}

/** The participant signs the check-in record their coach wrote. */
export function AcknowledgeCheckInButton({ checkInId }: { checkInId: number }) {
  const [state, action, pending] = useActionState(async () => acknowledgeCheckIn(checkInId), IDLE);
  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <CheckCircle2 />
        {pending ? "Signing…" : "Sign this record"}
      </Button>
      <Result state={state} />
    </form>
  );
}

/** Leadership releases a completed review to the person it is about. */
export function ReleaseReviewButton({ reviewId }: { reviewId: number }) {
  const [state, action, pending] = useActionState(async () => releaseReview(reviewId), IDLE);
  return (
    <form action={action}>
      <Button type="submit" size="sm" disabled={pending}>
        <Send />
        {pending ? "Releasing…" : "Release to the person"}
      </Button>
      <Result state={state} />
    </form>
  );
}

/** The person signs their released review, optionally with a verbatim comment. */
export function AcknowledgeReviewButton({ reviewId }: { reviewId: number }) {
  const [comment, setComment] = useState("");
  const [state, action, pending] = useActionState(
    async () => acknowledgeReview(reviewId, comment),
    IDLE,
  );
  return (
    <form action={action} className="grid gap-3">
      <Textarea
        rows={2}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Anything you want recorded alongside this score. Optional."
      />
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          <CheckCircle2 />
          {pending ? "Signing…" : "Sign my review"}
        </Button>
      </div>
      <Result state={state} />
    </form>
  );
}

/**
 * A coach's or Leadership's decision on a charter: sign it on, or send it back
 * with a written note saying exactly what must change.
 */
export function CharterDecisionForm({
  charterId,
  capacity,
}: {
  charterId: number;
  capacity: "coach" | "founder";
}) {
  const [comment, setComment] = useState("");
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, setPending] = useState(false);

  const run = async (decision: "reviewed" | "approved" | "changes_requested") => {
    setPending(true);
    setState(await decideCharter(charterId, capacity, decision, comment));
    setPending(false);
  };

  return (
    <div className="grid gap-3">
      <Textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="A note for the record. Required when you send it back."
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run(capacity === "coach" ? "reviewed" : "approved")}
        >
          <CheckCircle2 />
          {capacity === "coach" ? "Sign and send to Leadership" : "Approve and lock"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run("changes_requested")}
        >
          <Undo2 />
          Send back with a note
        </Button>
      </div>
      <Result state={state} />
    </div>
  );
}
