import { KeyRound, Mountain } from "lucide-react";

import { signOut } from "@/app/signin/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupRequiredPage() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-primary px-4 py-12">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_10%,white_0,transparent_28%),radial-gradient(circle_at_80%_90%,white_0,transparent_24%)]" />
      <div className="relative z-10 mx-auto w-full max-w-md">
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
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="size-5" /> Account setup incomplete
            </CardTitle>
            <CardDescription>
              Your login works, but it is not connected to an active employee profile yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <AlertTitle>What happened?</AlertTitle>
              <AlertDescription>
                An administrator needs to link your email to a roster profile (or apply pending
                database migrations) before you can open the workspace.
              </AlertDescription>
            </Alert>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="lg" className="w-full">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
