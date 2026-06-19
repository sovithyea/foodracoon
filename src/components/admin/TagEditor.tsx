"use client"

import { useState, useRef } from "react"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Props = {
  restaurantId: string
  field: "tags" | "cuisine_type"
  values: string[]
  suggestions?: string[]
  onUpdate: (newValues: string[]) => void
}

export function TagEditor({ restaurantId, field, values, suggestions = [], onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = input.trim()
    ? suggestions.filter(
        (s) => s.includes(input.toLowerCase()) && !values.includes(s)
      ).slice(0, 6)
    : []

  async function save(next: string[]) {
    setSaving(true)
    onUpdate(next)
    const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    })
    setSaving(false)
    if (!res.ok) {
      onUpdate(values)
      toast.error("Failed to update")
    }
  }

  function removeTag(tag: string) {
    save(values.filter((t) => t !== tag))
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-")
    if (!tag || values.includes(tag)) { close(); return }
    save([...values, tag])
    close()
  }

  function close() {
    setAdding(false)
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addTag(input) }
    else if (e.key === "Escape") close()
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.map((tag) => (
        <span
          key={tag}
          className="bg-secondary text-secondary-foreground inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="text-muted-foreground hover:text-foreground ml-0.5"
            disabled={saving}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}

      {adding ? (
        <div className="relative">
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              if (!e.relatedTarget?.closest?.("[data-suggestion]")) {
                if (input.trim()) addTag(input)
                else close()
              }
            }}
            placeholder="tag name"
            className="bg-background border-border w-24 rounded border px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          {filtered.length > 0 && (
            <div className="bg-card border-border absolute left-0 top-full z-10 mt-0.5 w-36 rounded border shadow-sm">
              {filtered.map((s) => (
                <button
                  key={s}
                  data-suggestion
                  onMouseDown={() => addTag(s)}
                  className="hover:bg-accent w-full px-2 py-1 text-left text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0) }}
          className={cn(
            "text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs transition-colors",
            saving && "opacity-40 pointer-events-none"
          )}
        >
          <Plus className="size-3" /> Add
        </button>
      )}
    </div>
  )
}
