import type { SupabaseClient } from "@/lib/data/viewer";

/**
 * Competency name to its `public.competencies` id.
 *
 * The library wording lives in `src/data/library.ts` and the charter editor
 * still renders from it; this map is what turns a chosen competency into the
 * foreign key a charter row needs. An empty map means the library has not been
 * loaded into this workspace yet.
 */
export async function getCompetencyIds(
  supabase: SupabaseClient,
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("competencies")
    .select("id, name")
    .eq("active", true)
    .returns<{ id: number; name: string }[]>();

  return Object.fromEntries((data ?? []).map((row) => [row.name, row.id]));
}
