"use client"

import { useState } from "react"
import { SuggestionRow } from "./SuggestionRow"

type Suggestion = {
  id: string
  name: string
  address: string | null
  cuisine: string | null
  notes: string | null
  status: string | null
  created_at: string | null
}

type Status = "pending" | "imported" | "dismissed" | "all"

type Props = {
  initialSuggestions: Suggestion[]
  initialPendingCount: number
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "imported", label: "Imported" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
]

export function SuggestionsAdminTable({ initialSuggestions, initialPendingCount }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [statusFilter, setStatusFilter] = useState<Status>("pending")
  const [loading, setLoading] = useState(false)
  const [pendingCount, setPendingCount] = useState(initialPendingCount)

  async function loadSuggestions(status: Status) {
    setStatusFilter(status)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suggestions?status=${status}`)
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setPendingCount(data.pendingCount ?? 0)
    } catch {
      // keep current state
    } finally {
      setLoading(false)
    }
  }

  function handleStatusChange(id: string, newStatus: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
    if (newStatus !== "pending") {
      setPendingCount((c) => Math.max(0, c - 1))
    }
  }

  const visible = statusFilter === "all"
    ? suggestions
    : suggestions.filter((s) => (s.status ?? "pending") === statusFilter)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          Suggestions
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </h1>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => loadSuggestions(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No {statusFilter === "all" ? "" : statusFilter} suggestions
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Cuisine</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
