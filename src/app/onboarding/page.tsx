import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Already onboarded — skip straight to the map.
  if (profile?.username) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <span className="text-primary text-3xl font-bold tracking-tight">
          foodracoon
        </span>
      </div>
      <OnboardingForm
        defaultDisplayName={
          profile?.display_name ??
          (user.user_metadata?.full_name as string | undefined)
        }
      />
    </main>
  );
}
