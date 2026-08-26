"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface PasswordState {
  error: string | null;
}

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export async function changePassword(
  _previousState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!STRONG_PASSWORD.test(password)) {
    return {
      error: "Use at least 12 characters with uppercase, lowercase, number, and symbol.",
    };
  }
  if (password !== confirmation) return { error: "The passwords do not match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/signin");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "The password could not be updated. Please try again." };

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    await supabase.auth.signOut();
    redirect("/signin");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
