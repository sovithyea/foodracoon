"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type Props = {
  pendingCount: number
}

export function AdminTabNav({ pendingCount }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: "Restaurants", href: "/admin/restaurants" },
    {
      label: "Suggestions",
      href: "/admin/suggestions",
      badge: pendingCount > 0 ? pendingCount : null,
    },
  ]

  return (
    <div className="mb-6 flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-white leading-none">
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
