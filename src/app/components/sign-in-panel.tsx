"use client";

import { ArrowRight, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials, PEOPLE } from "@/data/people";
import { useSession } from "@/hooks/use-session";
import type { Role } from "@/lib/types";

const ROLE_LABELS: Record<Role, string> = {
  member: "Team members",
  coach: "Coaches",
  admin: "Administrators",
};

export function SignInPanel() {
  const router = useRouter();
  const { selectPerson } = useSession();

  const select = (personId: string) => {
    selectPerson(personId);
    router.push("/");
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 flex items-center justify-center gap-3 text-primary-foreground">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/12">
          <Mountain />
        </span>
        <div>
          <p className="font-heading text-xl font-semibold">Ascend</p>
          <p className="text-sm text-primary-foreground/70">Build Fast with AI</p>
        </div>
      </div>
      <Card className="shadow-2xl shadow-black/20">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Choose your workspace</CardTitle>
          <CardDescription>
            This prototype stores the selected identity and performance records in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="member">
            <TabsList className="mb-5 grid w-full grid-cols-3">
              {(["member", "coach", "admin"] as Role[]).map((role) => (
                <TabsTrigger key={role} value={role}>
                  {ROLE_LABELS[role]}
                </TabsTrigger>
              ))}
            </TabsList>
            {(["member", "coach", "admin"] as Role[]).map((role) => (
              <TabsContent key={role} value={role} className="grid gap-3 sm:grid-cols-2">
                {PEOPLE.filter((person) => person.role === role).map((person) => (
                  <Button
                    key={person.id}
                    variant="outline"
                    className="h-auto justify-start rounded-2xl p-4"
                    onClick={() => select(person.id)}
                  >
                    <Avatar size="lg">
                      <AvatarFallback>{initials(person.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-medium">{person.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {person.title} · L{person.level}
                      </span>
                    </span>
                    <Badge variant="secondary" className="capitalize">
                      {person.role}
                    </Badge>
                    <ArrowRight className="size-4" />
                  </Button>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs text-primary-foreground/60">
        Identity selection is for this browser-only prototype and is not authentication.
      </p>
    </div>
  );
}
