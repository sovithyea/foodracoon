import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseBody, checkOrigin, isValidHttpUrl, BadRequest } from "@/lib/request-guard";

export async function PATCH(request: Request) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody<{
    display_name?: string;
    bio?: string;
    city?: string;
    avatar_url?: string;
    username?: string;
  }>(request, ["display_name", "bio", "city", "avatar_url", "username"]);

  if (!parsed.ok) return parsed.response;
  const { display_name, bio, city, avatar_url, username } = parsed.data;

  if (display_name !== undefined && (typeof display_name !== "string" || display_name.length > 60)) {
    return BadRequest("display_name must be a string of at most 60 characters");
  }
  if (bio !== undefined && (typeof bio !== "string" || bio.length > 300)) {
    return BadRequest("bio must be a string of at most 300 characters");
  }
  if (city !== undefined && (typeof city !== "string" || city.length > 60)) {
    return BadRequest("city must be a string of at most 60 characters");
  }
  if (avatar_url !== undefined && avatar_url !== null && !isValidHttpUrl(avatar_url)) {
    return BadRequest("avatar_url must be a valid http/https URL");
  }
  if (username !== undefined) {
    if (typeof username !== "string" || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return BadRequest("username must be 3–30 characters: letters, numbers, underscores only");
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name, bio, city, avatar_url, username })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(data);
}
