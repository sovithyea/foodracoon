"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Map, Search, ListChecks, Newspaper, User, Sun, Moon, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/", label: "Map", icon: Map },
  { href: "/search", label: "Search", icon: Search },
  { href: "/lists", label: "Lists", icon: ListChecks },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function Nav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
    });
  }, []);

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
        {isAdmin && (
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <Shield className="size-4" />
            Admin
          </Link>
        )}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
        >
          {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
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
