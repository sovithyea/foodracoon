import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium">Sign in to see your profile</p>
        <Link
          href="/login"
          className="text-sm text-[#D44C2A] underline underline-offset-2"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  const [
    { data: profile },
    { data: statusRows },
    { count: listsCount },
    { data: recentRatings },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, city")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_restaurants")
      .select("status, rating")
      .eq("user_id", user.id),
    supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_restaurants")
      .select("rating, visited_at, updated_at, restaurants(name)")
      .eq("user_id", user.id)
      .not("rating", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const visitedCount =
    statusRows?.filter((r) => r.status === "visited").length ?? 0;
  const wantToTryCount =
    statusRows?.filter((r) => r.status === "want_to_try").length ?? 0;
  const ratings =
    statusRows?.flatMap((r) => (r.rating != null ? [r.rating] : [])) ?? [];
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "—";

  const initials = (profile?.display_name ?? profile?.username ?? "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto h-full max-w-lg overflow-y-auto px-6 py-10 pb-20 md:pb-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
          style={{ backgroundColor: "#D44C2A" }}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            {profile?.display_name ?? "Foodracoon user"}
          </h1>
          <p className="text-muted-foreground text-sm">
            @{profile?.username ?? "—"} · {profile?.city ?? "Phnom Penh"}
          </p>
        </div>
        {profile?.bio && <p className="text-sm">{profile.bio}</p>}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        <StatCard label="Visited" value={visitedCount} />
        <StatCard label="Want to Try" value={wantToTryCount} />
        <StatCard label="Avg Rating" value={avgRating} />
      </div>

      <div className="mt-3 rounded-lg border bg-card p-4 text-center">
        <div className="text-2xl font-semibold">{listsCount ?? 0}</div>
        <div className="text-muted-foreground text-xs">Lists</div>
      </div>

      {recentRatings && recentRatings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
            Recent Ratings
          </h2>
          <div className="flex flex-col gap-2">
            {recentRatings.map((row, i) => {
              const restaurant = Array.isArray(row.restaurants)
                ? row.restaurants[0]
                : row.restaurants;
              const date = row.visited_at ?? row.updated_at?.slice(0, 10);
              return (
                <div
                  key={i}
                  className="bg-card flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {restaurant?.name ?? "Unknown"}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-3 text-sm">
                    {date && <span>{date}</span>}
                    <span className="text-foreground font-semibold">
                      {row.rating}/10
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
        className="mt-10"
      >
        <button
          type="submit"
          className="text-muted-foreground hover:text-destructive w-full py-2 text-sm transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card rounded-lg border p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
