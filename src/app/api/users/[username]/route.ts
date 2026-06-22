import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const supabase = await createClient();

  // get_caller_identity — may be null (public route)
  const { data: { user: caller } } = await supabase.auth.getUser();

  // get_profile_by_username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, city, followers_count, following_count, created_at")
    .eq("username", username)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let is_following = false;

  if (caller && caller.id !== profile.id) {
    // check_follow_edge
    const { data: followEdge } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", caller.id)
      .eq("following_id", profile.id)
      .maybeSingle();

    is_following = followEdge !== null;
  }

  return NextResponse.json({ ...profile, is_following });
}
