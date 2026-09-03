import { KeyRound } from "lucide-react";

import { AuthShell } from "@/app/components/auth-shell";
import { signOut } from "@/app/signin/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupRequiredPage() {
  return (
    <AuthShell>
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
    </AuthShell>
  );
}
