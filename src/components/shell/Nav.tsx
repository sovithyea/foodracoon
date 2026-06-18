"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, Search, ListChecks, Newspaper, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Map", icon: Map },
  { href: "/search", label: "Search", icon: Search },
  { href: "/lists", label: "Lists", icon: ListChecks },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="bg-card hidden w-56 shrink-0 flex-col border-r p-4 md:flex">
        <Link
          href="/"
          className="text-primary mb-6 px-2 text-2xl font-bold tracking-tight"
        >
          foodracoon
        </Link>
        <ul className="flex flex-1 flex-col gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="bg-card/95 fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t backdrop-blur md:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
