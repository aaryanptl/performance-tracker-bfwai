import { redirect } from "next/navigation";

import { AppShell } from "@/app/components/app-shell";
import { SessionProvider } from "@/hooks/use-session";
import { getPersonForAuthUser } from "@/lib/auth/profile";
import { getApprovalQueue } from "@/lib/data/approvals";
import { getActiveCycleForRequest } from "@/lib/data/cycle";
import { getViewer } from "@/lib/data/viewer";
import { getRequestClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getRequestClient();
  const { data } = await supabase.auth.getClaims();
  const authUserId = data?.claims?.sub;
  if (!authUserId) redirect("/signin");

  const authUserEmail = typeof data.claims.email === "string" ? data.claims.email : null;
  const person = await getPersonForAuthUser(authUserId, authUserEmail);
  if (!person) {
    // Do not sign out here: Server Components cannot write cookies, so the
    // session would survive and the proxy would bounce /signin back to "/",
    // rendering the homepage forever. Send the user to a terminal page with a
    // server-action sign-out button instead.
    redirect("/setup-required");
  }

  const cycle = await getActiveCycleForRequest();
  const viewer = await getViewer();
  const approvalCount =
    viewer && cycle && (person.role === "coach" || person.role === "admin")
      ? (await getApprovalQueue({
          supabase: viewer.supabase,
          cycle,
          personId: viewer.personId,
          isAdmin: viewer.isAdmin,
        })).length
      : 0;

  return (
    <SessionProvider person={person}>
      <AppShell cycle={cycle} approvalCount={approvalCount}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
