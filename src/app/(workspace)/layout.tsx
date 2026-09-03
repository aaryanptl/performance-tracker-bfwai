import { redirect } from "next/navigation";

import { AppShell } from "@/app/components/app-shell";
import { SessionProvider } from "@/hooks/use-session";
import { getPersonForAuthUser } from "@/lib/auth/profile";
import { getActiveCycle } from "@/lib/data/cycle";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const authUserId = data?.claims?.sub;
  if (!authUserId) redirect("/signin");

  const person = await getPersonForAuthUser(authUserId);
  if (!person) {
    // Do not sign out here: Server Components cannot write cookies, so the
    // session would survive and the proxy would bounce /signin back to "/",
    // rendering the homepage forever. Send the user to a terminal page with a
    // server-action sign-out button instead.
    redirect("/setup-required");
  }

  const cycle = await getActiveCycle(supabase);

  return (
    <SessionProvider person={person}>
      <AppShell cycle={cycle}>{children}</AppShell>
    </SessionProvider>
  );
}
