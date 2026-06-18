"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return {
      error: "Username must be 3–20 chars: lowercase letters, numbers, or _.",
    };
  }

  // Reject if the username is taken by someone else.
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (taken) return { error: "That username is taken." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || username,
    })
    .eq("id", user.id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That username is taken."
          : "Could not save your profile. Try again.",
    };
  }

  redirect("/");
}
