/**
 * Seeds the `restaurants` table from supabase/seed/restaurants.sample.json.
 *
 * Uses the service-role key (bypasses RLS). Run with:
 *   npx tsx scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "../src/lib/database.types";

function loadEnv() {
  // Minimal .env.local loader (avoids adding a dotenv dependency).
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // ignore — env may already be set in the shell
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  const rows = JSON.parse(
    readFileSync(
      join(process.cwd(), "supabase/seed/restaurants.sample.json"),
      "utf8",
    ),
  ) as TablesInsert<"restaurants">[];

  // Idempotent guard: skip if the table is already populated.
  const { count: existing } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true });
  if (existing && existing > 0) {
    console.log(`restaurants already has ${existing} rows — skipping seed.`);
    return;
  }

  const { error, count } = await supabase
    .from("restaurants")
    .insert(rows, { count: "exact" });

  if (error) throw error;
  console.log(`Seeded ${count ?? rows.length} restaurants.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
