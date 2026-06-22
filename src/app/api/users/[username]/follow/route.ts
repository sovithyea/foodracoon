import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";
import { checkOrigin } from "@/lib/request-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireUser(supabase);
  if (authError) return authError;

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (targetError) return NextResponse.json({ error: "Server error" }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error: followError } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: target.id });

  if (followError) {
    if (followError.code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "Failed to follow" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireUser(supabase);
  if (authError) return authError;

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (targetError) return NextResponse.json({ error: "Server error" }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target.id);

  if (deleteError) return NextResponse.json({ error: "Failed to unfollow" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
