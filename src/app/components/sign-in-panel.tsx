"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useState, useActionState } from "react";
import { signIn } from "@/app/signin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

export function SignInPanel({ initialError = null }: { initialError?: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, { error: initialError });
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGooglePending(true);
    setGoogleError(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      setGooglePending(false);
      setGoogleError("Google sign-in could not be started. Please try again.");
    }
  }

  const errorMessage = googleError ?? state.error;

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
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={pending || googlePending}
          >
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded-full bg-white text-sm font-semibold text-[#4285f4]"
            >
              G
            </span>
            {googlePending ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>
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
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
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
