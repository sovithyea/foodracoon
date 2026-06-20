"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ManualAddSheet } from "./ManualAddSheet"

type Suggestion = {
  id: string
  name: string
  address: string | null
  cuisine: string | null
  notes: string | null
  status: string | null
  created_at: string | null
}

type Props = {
  suggestion: Suggestion
  onStatusChange: (id: string, status: string) => void
}

export function SuggestionRow({ suggestion, onStatusChange }: Props) {
  const [importing, setImporting] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestion.id}/import`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "NO_RESULT") {
          toast.error("No Google result found — try adding manually")
        } else {
          toast.error(data.error ?? "Import failed")
        }
        return
      }
      toast.success(`Imported: ${data.restaurant.name}`)
      onStatusChange(suggestion.id, "imported")
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  async function handleDismiss() {
    if (!confirmDismiss) {
      setConfirmDismiss(true)
      return
    }
    setDismissing(true)
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      })
      if (!res.ok) throw new Error("Failed to dismiss")
      toast.success("Suggestion dismissed")
      onStatusChange(suggestion.id, "dismissed")
    } catch {
      toast.error("Failed to dismiss suggestion")
    } finally {
      setDismissing(false)
      setConfirmDismiss(false)
    }
  }

  return (
    <>
      <tr className="border-b hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3 text-sm font-medium">{suggestion.name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{suggestion.address ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{suggestion.cuisine ?? "—"}</td>
        <td className="max-w-[180px] px-4 py-3 text-sm text-muted-foreground">
          {suggestion.notes ? (
            <span title={suggestion.notes}>
              {suggestion.notes.length > 60
                ? suggestion.notes.slice(0, 60) + "…"
                : suggestion.notes}
            </span>
          ) : "—"}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString() : "—"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleImport}
              disabled={importing}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {importing ? "Importing…" : "Import"}
            </button>
            <span className="text-border">·</span>
            <button
              onClick={() => setManualOpen(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Add manually
            </button>
            <span className="text-border">·</span>
            {confirmDismiss ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={handleDismiss}
                  disabled={dismissing}
                  className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDismiss(false)}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-muted-foreground hover:text-destructive"
              >
                Dismiss
              </button>
            )}
          </div>
        </td>
      </tr>

      <ManualAddSheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        initialName={suggestion.name}
        initialAddress={suggestion.address ?? ""}
        initialCuisine={suggestion.cuisine ?? ""}
        suggestionId={suggestion.id}
        onAdded={() => onStatusChange(suggestion.id, "imported")}
      />
    </>
  )
}
