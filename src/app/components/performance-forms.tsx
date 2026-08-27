"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { APPROVER_LABEL, CHECKIN_STAGES, RATINGS, RECOMMENDATIONS } from "@/data/performance";

function SavedBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <Badge variant="secondary">
      <Check />
      Saved in this browser
    </Badge>
  ) : null;
}

function Field({
  id,
  label,
  hint,
  placeholder,
  rows = 4,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="-mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      <Textarea id={id} rows={rows} placeholder={placeholder} />
    </div>
  );
}

export function ImpactForm() {
  const [saved, setSaved] = useState(false);
  return (
    <Tabs defaultValue="q1">
      <TabsList className="mb-5">
        <TabsTrigger value="q1">Q1 · Sep–Nov 2026</TabsTrigger>
        <TabsTrigger value="q2">Q2 · Dec–Feb 2027</TabsTrigger>
      </TabsList>
      {["q1", "q2"].map((quarter) => (
        <TabsContent key={quarter} value={quarter}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Part 1 — written by you</CardTitle>
                  <CardDescription className="mt-1">
                    Your coach cannot see this until you share it. Once shared it becomes read-only.
                  </CardDescription>
                </div>
                <Badge variant="outline">Not shared yet</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Field
                id={`${quarter}-results`}
                label="Impact created — results against my goals"
                hint="What moved, by how much, against which target. Name the evidence your coach can verify."
                placeholder="e.g. Inbound response within 48h moved from 70% to 95% (CRM export, Sep–Nov). Closed ₹16L of the ₹20L target…"
                rows={5}
              />
              <Field
                id={`${quarter}-behaviours`}
                label="Competency commitments I lived — and how"
                hint="Take each of your five commitments and say, concretely, what you did."
                placeholder="e.g. Communication — sent the weekly written pipeline update 12 of 12 weeks…"
                rows={5}
              />
            </CardContent>
            <CardFooter className="justify-end gap-3 border-t">
              <SavedBadge saved={saved} />
              <Button variant="outline" onClick={() => setSaved(true)}>
                <Save />
                Save draft
              </Button>
              <Button onClick={() => setSaved(true)}>Share with my coach</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function CheckInForm({ personName }: { personName: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>The conversation with {personName}</CardTitle>
        <CardDescription>
          15 minutes on the four-stage framework. Recorded by the coach, in the room. No ratings are
          given in a check-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {CHECKIN_STAGES.map((stage) => (
          <Field
            key={stage.key}
            id={`checkin-${stage.key}`}
            label={`${stage.title} · ${stage.minutes} min`}
            hint={stage.prompt}
            placeholder="Recorded by the coach, in the room."
            rows={3}
          />
        ))}
      </CardContent>
      <CardFooter className="justify-end gap-3 border-t">
        <SavedBadge saved={saved} />
        <Button onClick={() => setSaved(true)}>
          <Save />
          Sign and share with {personName}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ReviewForm({ personName }: { personName: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Score 2 — how it was delivered</CardTitle>
          <CardDescription>
            Discussed orally against the written commitments, then one overall rating out of 5.
            Anchor it in specifics from your check-in records — moments, deliverables, behaviours.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="score-2">Score 2 for {personName}</Label>
            <NativeSelect id="score-2" defaultValue="" className="w-full">
              <NativeSelectOption value="">Not yet rated</NativeSelectOption>
              {RATINGS.map((rating) => (
                <NativeSelectOption key={rating.value} value={String(rating.value)}>
                  {rating.value} — {rating.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Field
            id="score-2-evidence"
            label="Evidence discussed"
            hint="Reference the commitments, the observed behaviour, and examples from the quarter."
            placeholder="What was said in the conversation, and the specifics it rested on."
            rows={3}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Part 2 — coach review</CardTitle>
          <CardDescription>
            Written after scoring, and released to {personName} once {APPROVER_LABEL} signs off.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Field
            id="impact-summary"
            label="1 · The impact this person has created — your verified summary"
            hint="Verified against the charter, the check-in records and the named data sources."
            placeholder="What changed because of this person's work this quarter."
          />
          <Field
            id="development-needs"
            label="2 · Development needs — and the training, exposure or support to be provided"
            hint="You own one development action per coachee per cycle. Name it here and follow it through."
            placeholder="The gap, and the specific support you will arrange for it."
          />
          <div className="grid gap-2">
            <Label htmlFor="recommendation">3 · Recommendation</Label>
            <NativeSelect id="recommendation" defaultValue="" className="w-full sm:w-80">
              <NativeSelectOption value="">Not recorded</NativeSelectOption>
              {RECOMMENDATIONS.map((recommendation) => (
                <NativeSelectOption key={recommendation} value={recommendation}>
                  {recommendation}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-3 border-t">
          <SavedBadge saved={saved} />
          <Button onClick={() => setSaved(true)}>
            <Save />
            Sign and send to calibration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
