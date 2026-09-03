"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useActionState } from "react";
import { signIn } from "@/app/signin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInPanel({ initialError = null }: { initialError?: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, { error: initialError });

  return (
    <div>
      <Card className="shadow-2xl shadow-black/20">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <LockKeyhole className="size-5" /> Sign in
          </CardTitle>
          <CardDescription>
            Use the employee email and temporary password provided by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@buildfastwithai.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              <LogIn /> {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs text-sidebar-foreground/60">
        Password recovery email is unavailable. Contact an administrator for a manual reset.
      </p>
    </div>
  );
}
