import { redirect } from "next/navigation";

import { AuthShell } from "@/app/components/auth-shell";
import { ChangePasswordPanel } from "@/app/components/change-password-panel";
import { createClient } from "@/lib/supabase/server";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/signin");

  return (
    <AuthShell>
      <ChangePasswordPanel />
    </AuthShell>
  );
}
