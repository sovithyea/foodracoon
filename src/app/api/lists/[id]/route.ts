import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseBody, checkOrigin, BadRequest } from "@/lib/request-guard";
import type { Tables } from "@/lib/database.types";

type ListUpdate = Partial<Pick<Tables<"lists">, "title" | "slug" | "emoji" | "description" | "is_public">>;

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody<{
    title?: string;
    emoji?: string;
    description?: string;
    is_public?: boolean;
  }>(request, ["title", "emoji", "description", "is_public"]);

  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const updates: ListUpdate = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return BadRequest("title must be a non-empty string");
    if (body.title.trim().length > 80) return BadRequest("title must be at most 80 characters");
    updates.title = body.title.trim();
    updates.slug = slugify(body.title.trim());
  }
  if (body.emoji !== undefined) {
    if (typeof body.emoji !== "string" || body.emoji.length > 10) return BadRequest("emoji must be a string of at most 10 characters");
    updates.emoji = body.emoji;
  }
  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 400)) {
      return BadRequest("description must be at most 400 characters");
    }
    updates.description = body.description;
  }
  if (body.is_public !== undefined) {
    if (typeof body.is_public !== "boolean") return BadRequest("is_public must be a boolean");
    updates.is_public = body.is_public;
  }

  const { data, error } = await supabase
    .from("lists")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("lists").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
