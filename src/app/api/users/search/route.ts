import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type PeopleResult = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json<PeopleResult[]>([]);

  const supabase = await createClient();

  // search_profiles_by_username_or_name
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, followers_count")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .not("username", "is", null)
    .order("followers_count", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json<PeopleResult[]>([]);

  return NextResponse.json<PeopleResult[]>(data ?? []);
}
