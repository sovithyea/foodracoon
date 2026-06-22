import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireUser(supabase);
  if (authError) return authError;

  // resolve_target_by_username
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  // insert_follow_edge
  const { error: followError } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: target.id });

  if (followError) {
    // 23505 = unique_violation (already following)
    if (followError.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: followError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireUser(supabase);
  if (authError) return authError;

  // resolve_target_by_username
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // delete_follow_edge
  const { error: deleteError } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
