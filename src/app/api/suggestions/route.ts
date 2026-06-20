import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, address, cuisine, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (notes && notes.length > 280) {
    return NextResponse.json({ error: "Notes must be 280 characters or fewer" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("suggestions")
    .insert({
      name: name.trim(),
      address: address?.trim() || null,
      cuisine: cuisine?.trim() || null,
      notes: notes?.trim() || null,
      submitted_by: user?.id ?? null,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
