import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the OAuth (and email-confirmation) code exchange.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send brand-new users through onboarding; returning users to their target.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        const dest = profile?.username ? redirect : "/onboarding";
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
