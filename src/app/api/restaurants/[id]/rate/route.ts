import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Phase 1 minimal: "Save" a restaurant => want_to_try.
// (Full rating/review payload arrives in Phase 2.)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: restaurantId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let status: "want_to_try" | "visited" | "favourite" = "want_to_try";
  try {
    const body = await request.json();
    if (
      body?.status === "visited" ||
      body?.status === "favourite" ||
      body?.status === "want_to_try"
    ) {
      status = body.status;
    }
  } catch {
    // empty body is fine — default to want_to_try
  }

  const { data, error } = await supabase
    .from("user_restaurants")
    .upsert(
      { user_id: user.id, restaurant_id: restaurantId, status },
      { onConflict: "user_id,restaurant_id" },
    )
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userRestaurant: data });
}
