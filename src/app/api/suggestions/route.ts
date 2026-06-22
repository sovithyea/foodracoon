import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseBody, checkOrigin, BadRequest } from "@/lib/request-guard";

export async function POST(request: Request) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody<{
    name: string;
    address?: string;
    cuisine?: string;
    notes?: string;
  }>(request, ["name", "address", "cuisine", "notes"]);

  if (!parsed.ok) return parsed.response;
  const { name, address, cuisine, notes } = parsed.data;

  if (typeof name !== "string" || !name.trim()) return BadRequest("name is required");
  if (name.trim().length > 120) return BadRequest("name must be at most 120 characters");
  if (address !== undefined && address !== null && typeof address !== "string") {
    return BadRequest("address must be a string");
  }
  if (cuisine !== undefined && cuisine !== null && typeof cuisine !== "string") {
    return BadRequest("cuisine must be a string");
  }
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string" || notes.length > 280) {
      return BadRequest("notes must be at most 280 characters");
    }
  }

  const { error } = await supabase.from("suggestions").insert({
    name: name.trim(),
    address: address?.trim() || null,
    cuisine: cuisine?.trim() || null,
    notes: notes?.trim() || null,
    submitted_by: user.id,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
  return NextResponse.json({ success: true });
}
