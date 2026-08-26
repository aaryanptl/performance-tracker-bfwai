"use client";

import { Check, Save, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RATINGS } from "@/data/performance";

function SavedBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <Badge variant="secondary">
      <Check />
      Saved in this browser
    </Badge>
  ) : null;
}

export function CharterForm() {
  const [saved, setSaved] = useState(false);
  const save = () => {
    window.localStorage.setItem("ascend:charter:draft", new Date().toISOString());
    setSaved(true);
  };
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Cycle intent</CardTitle>
          <CardDescription>
            Start with the change your work should create, then define evidence that makes the
            outcome unambiguous.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="focus">Primary focus</Label>
            <Input id="focus" placeholder="What is the most important outcome for this cycle?" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="context">Why this matters</Label>
            <Textarea
              id="context"
              rows={4}
              placeholder="Connect the outcome to the customer, team, or business priority."
            />
          </div>
        </CardContent>
      </Card>
      {[1, 2, 3].map((number) => (
        <Card key={number}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Goal {number}</CardTitle>
              <Badge variant="outline">{number === 1 ? "Required" : "Optional"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor={`goal-${number}`}>Outcome</Label>
              <Input
                id={`goal-${number}`}
                placeholder="Deliver a measurable result, not a task list"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`metric-${number}`}>Success measure</Label>
              <Input id={`metric-${number}`} placeholder="Metric and target" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`weight-${number}`}>Weight</Label>
              <NativeSelect
                id={`weight-${number}`}
                defaultValue={number === 1 ? "40" : "30"}
                className="w-full"
              >
                <NativeSelectOption value="20">20%</NativeSelectOption>
                <NativeSelectOption value="30">30%</NativeSelectOption>
                <NativeSelectOption value="40">40%</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor={`evidence-${number}`}>Evidence source</Label>
              <Textarea
                id={`evidence-${number}`}
                placeholder="Where will the reviewer find trustworthy evidence?"
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <SavedBadge saved={saved} />
        <Button variant="outline" onClick={save}>
          <Save />
          Save draft
        </Button>
        <Button onClick={save}>
          <Send />
          Send for review
        </Button>
      </div>
    </div>
  );
}

export function ImpactForm() {
  const [saved, setSaved] = useState(false);
  return (
    <Tabs defaultValue="q1">
      <TabsList className="mb-5">
        <TabsTrigger value="q1">Q1 · Sep–Nov</TabsTrigger>
        <TabsTrigger value="q2">Q2 · Dec–Feb</TabsTrigger>
      </TabsList>
      {["q1", "q2"].map((quarter) => (
        <TabsContent key={quarter} value={quarter}>
          <Card>
            <CardHeader>
              <CardTitle>{quarter.toUpperCase()} impact statement</CardTitle>
              <CardDescription>
                Use specific evidence. Name what changed because of the work, not only what was
                completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor={`${quarter}-outcomes`}>Outcomes delivered</Label>
                <Textarea
                  id={`${quarter}-outcomes`}
                  rows={5}
                  placeholder="What measurable customer, product, revenue, or team outcome changed?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${quarter}-evidence`}>Evidence and links</Label>
                <Textarea
                  id={`${quarter}-evidence`}
                  rows={4}
                  placeholder="Metrics, customer feedback, shipped work, or other verifiable evidence"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${quarter}-learning`}>Learning carried forward</Label>
                <Textarea
                  id={`${quarter}-learning`}
                  rows={3}
                  placeholder="What will you repeat, change, or stop next quarter?"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3 border-t">
              <SavedBadge saved={saved} />
              <Button onClick={() => setSaved(true)}>
                <Save />
                Save statement
              </Button>
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
        <CardTitle>Monthly conversation with {personName}</CardTitle>
        <CardDescription>
          Use this structure to support a useful conversation; do not turn it into a status report.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="progress">Progress worth recognising</Label>
          <Textarea
            id="progress"
            placeholder="What moved, and what should be recognised specifically?"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="blockers">Reality and blockers</Label>
          <Textarea id="blockers" placeholder="What is in the way? What has already been tried?" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="support">Support the coach will arrange</Label>
          <Textarea id="support" placeholder="Name the support, owner, and date." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="commitment">Commitment before the next check-in</Label>
          <Textarea id="commitment" placeholder="A specific next action with a clear owner." />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-3 border-t">
        <SavedBadge saved={saved} />
        <Button onClick={() => setSaved(true)}>
          <Save />
          Save check-in
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ReviewForm({ personName }: { personName: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-5">
      {[
        ["Goal outcomes", "Rate delivery against the agreed success measures."],
        ["Role competencies", "Rate behaviours and craft against the person's current level."],
      ].map(([title, description]) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div className="grid gap-2">
              <Label>Rating for {personName}</Label>
              <NativeSelect defaultValue="3" className="w-full">
                {RATINGS.map((rating) => (
                  <NativeSelectOption key={rating.value} value={String(rating.value)}>
                    {rating.value} · {rating.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label>Evidence and rationale</Label>
              <Textarea placeholder="Reference outcomes, behaviours, and examples observed during the quarter." />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-end gap-3">
        <SavedBadge saved={saved} />
        <Button onClick={() => setSaved(true)}>
          <Save />
          Save review
        </Button>
      </div>
    </div>
  );
}
