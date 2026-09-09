import { cache } from "react";

import type { AuthorityRole } from "@/lib/data/roster-fields";
import { isAdminAuthority } from "@/lib/data/roster-fields";
import { getRequestClient } from "@/lib/supabase/server";

export type SupabaseClient = Awaited<ReturnType<typeof getRequestClient>>;

export interface Viewer {
  supabase: SupabaseClient;
  /** The `public.people` primary key — the id every performance row hangs off. */
  personId: number;
  organizationId: number;
  authority: AuthorityRole;
  isAdmin: boolean;
  name: string;
}

/**
 * The signed-in person, resolved to their roster row.
 *
 * Row-level security is the real gate on every table this app touches; this
 * only resolves identity so a caller can shape a page or return a sentence
 * instead of surfacing a policy refusal.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await getRequestClient();
  const { data: claims } = await supabase.auth.getClaims();
  const authUserId = claims?.claims?.sub;
  if (!authUserId) return null;

  const { data, error } = await supabase
    .from("people")
    .select("id, organization_id, authority_role, display_name")
    .eq("auth_user_id", authUserId)
    .eq("active", true)
    .maybeSingle<{
      id: number;
      organization_id: number;
      authority_role: AuthorityRole;
      display_name: string;
    }>();

  if (error || !data) return null;

  return {
    supabase,
    personId: data.id,
    organizationId: data.organization_id,
    authority: data.authority_role,
    isAdmin: isAdminAuthority(data.authority_role),
    name: data.display_name,
  };
});
