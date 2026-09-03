"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";

import { changePassword } from "@/app/change-password/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordPanel() {
  const [state, formAction, pending] = useActionState(changePassword, { error: null });

  return (
    <div>
      <Card className="shadow-2xl shadow-black/20">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="size-5" /> Choose a new password
          </CardTitle>
          <CardDescription>
            Update your password whenever you want from your profile menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 12 characters with uppercase, lowercase, number, and symbol.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirm new password</Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </div>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              <KeyRound /> {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
