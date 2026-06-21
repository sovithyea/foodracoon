"use client"

import { useState } from "react"
import { MoreHorizontal, Globe, Lock, Pencil, Trash2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { CreateListSheet } from "./CreateListSheet"
import { cn } from "@/lib/utils"
import type { ListWithCount } from "@/lib/lists"

type Props = {
  list: ListWithCount
  onUpdated: (list: ListWithCount) => void
  onDeleted: (id: string) => void
  onClick: () => void
}

export function ListCard({ list, onUpdated, onDeleted, onClick }: Props) {
  const [editOpen, setEditOpen]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/lists/${list.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      onDeleted(list.id)
      toast.success(`"${list.title}" deleted`)
    } catch {
      toast.error("Failed to delete list")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleTogglePublic() {
    const res = await fetch(`/api/lists/${list.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !list.is_public }),
    })
    if (!res.ok) { toast.error("Failed to update"); return }
    const updated = await res.json()
    onUpdated({ ...updated, restaurant_count: list.restaurant_count })
    toast.success(list.is_public ? "Set to private" : "Set to public")
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-[#D4C8B4] bg-[#EDE6D8] px-4 py-3.5 transition-colors hover:bg-[#E2D9C8]">

        {/* Tappable main area */}
        <button
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="text-2xl leading-none">{list.emoji ?? "📋"}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#2C2420]">{list.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8C7E72]">
              {list.restaurant_count}{" "}
              {list.restaurant_count === 1 ? "place" : "places"} ·{" "}
              {list.is_public
                ? <><Globe className="inline size-3" /> Public</>
                : <><Lock className="inline size-3" /> Private</>
              }
            </p>
          </div>
          {/* Chevron = navigate affordance */}
          <ChevronRight className="size-4 shrink-0 text-[#8C7E72]" />
        </button>

        {/* Edit/delete menu — stops propagation so it doesn't trigger onClick */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-[#8C7E72]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "text-[#8C7E72] hover:bg-[#D4C8B4] hover:text-[#2C2420]",
                    )}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePublic}>
                  {list.is_public
                    ? <><Lock className="size-4" /> Make private</>
                    : <><Globe className="size-4" /> Make public</>
                  }
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <CreateListSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        editList={list}
        onUpdated={onUpdated}
      />
    </>
  )
}
