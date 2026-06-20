"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  initialName?: string
  triggerLabel?: string
  triggerClassName?: string
}

export function SuggestSheet({ initialName = "", triggerLabel = "Suggest a restaurant", triggerClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  function handleOpen() {
    setName(initialName)
    setAddress("")
    setCuisine("")
    setNotes("")
    setOpen(true)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("")
      setAddress("")
      setCuisine("")
      setNotes("")
    }
    setOpen(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, cuisine, notes }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to submit")
      }
      toast.success("Thanks! We'll look into it.")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit suggestion")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={triggerClassName ?? "flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"}
      >
        <Plus className="size-4" />
        {triggerLabel}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl px-4 pb-6">
          <SheetHeader className="px-0">
            <SheetTitle>Suggest a restaurant</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="suggest-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="suggest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lok Lak Palace"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suggest-address">Address or area</Label>
              <Input
                id="suggest-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Street 278, BKK1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suggest-cuisine">Cuisine type</Label>
              <Input
                id="suggest-cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. Khmer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suggest-notes">Anything else?</Label>
              <Textarea
                id="suggest-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                placeholder="Great lok lak, open late…"
                rows={3}
                maxLength={280}
              />
              <p className="text-xs text-muted-foreground text-right">{notes.length}/280</p>
            </div>

            <SheetFooter className="px-0 pt-2">
              <Button type="submit" className="w-full" disabled={!name.trim() || saving}>
                {saving ? "Submitting…" : "Submit suggestion"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
