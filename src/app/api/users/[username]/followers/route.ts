import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const supabase = await createClient();

  // resolve_target_by_username
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // get_followers_page
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follower_id(username, display_name, avatar_url, followers_count)")
    .eq("following_id", target.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profiles = (data ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return p;
  }).filter(Boolean);

  return NextResponse.json({ profiles, hasMore: profiles.length === PAGE_SIZE });
}
