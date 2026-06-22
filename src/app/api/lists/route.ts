import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseBody, checkOrigin, BadRequest } from "@/lib/request-guard";

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  const { data: lists, error } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load lists" }, { status: 400 });

  const listIds = lists.map((l) => l.id);

  const { data: memberRows } = await supabase
    .from("list_restaurants")
    .select("list_id")
    .in("list_id", listIds.length ? listIds : ["__none__"]);

  const countMap = new Map<string, number>();
  for (const row of memberRows ?? []) {
    countMap.set(row.list_id, (countMap.get(row.list_id) ?? 0) + 1);
  }

  const withCount = lists.map((l) => ({ ...l, restaurant_count: countMap.get(l.id) ?? 0 }));

  if (restaurantId) {
    const { data: memberships } = await supabase
      .from("list_restaurants")
      .select("list_id")
      .eq("restaurant_id", restaurantId)
      .in("list_id", listIds.length ? listIds : ["__none__"]);

    const memberSet = new Set((memberships ?? []).map((m) => m.list_id));
    return NextResponse.json(withCount.map((l) => ({ ...l, contains: memberSet.has(l.id) })));
  }

  return NextResponse.json(withCount);
}

export async function POST(request: Request) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody<{
    title: string;
    emoji?: string;
    description?: string;
    is_public?: boolean;
  }>(request, ["title", "emoji", "description", "is_public"]);

  if (!parsed.ok) return parsed.response;
  const { title, emoji, description, is_public } = parsed.data;

  if (typeof title !== "string" || !title.trim()) return BadRequest("title is required");
  if (title.trim().length > 80) return BadRequest("title must be at most 80 characters");
  if (emoji !== undefined && (typeof emoji !== "string" || emoji.length > 10)) {
    return BadRequest("emoji must be a string of at most 10 characters");
  }
  if (description !== undefined && description !== null) {
    if (typeof description !== "string" || description.length > 400) {
      return BadRequest("description must be at most 400 characters");
    }
  }
  if (is_public !== undefined && typeof is_public !== "boolean") {
    return BadRequest("is_public must be a boolean");
  }

  const slug = slugify(title.trim());
  const { data, error } = await supabase
    .from("lists")
    .insert({
      title: title.trim(), emoji: emoji ?? null, description: description ?? null,
      is_public: is_public ?? false, user_id: user.id, slug,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ...data, restaurant_count: 0 });
}
