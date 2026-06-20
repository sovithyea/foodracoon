import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { AdminTabNav } from "@/components/admin/AdminTabNav"
import { SuggestionsAdminTable } from "@/components/admin/SuggestionsAdminTable"

const adminDb = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function AdminSuggestionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) redirect("/")

  const [{ data: suggestions }, { count: pendingCount }] = await Promise.all([
    adminDb
      .from("suggestions")
      .select("id, name, address, cuisine, notes, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminDb
      .from("suggestions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ])

  return (
    <>
      <AdminTabNav pendingCount={pendingCount ?? 0} />
      <SuggestionsAdminTable
        initialSuggestions={suggestions ?? []}
        initialPendingCount={pendingCount ?? 0}
      />
    </>
  )
}
