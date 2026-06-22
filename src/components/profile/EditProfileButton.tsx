"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { EditProfileSheet } from "./EditProfileSheet"

type Props = {
  profile: {
    display_name: string | null
    username: string | null
    bio: string | null
    city: string | null
    avatar_url: string | null
  }
}

export function EditProfileButton({ profile }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[#D4C8B4] bg-[#EDE6D8] px-3 py-1.5 text-xs font-medium text-[#2C2420] transition-colors hover:bg-[#D4C8B4]"
      >
        <Pencil className="size-3" />
        Edit profile
      </button>
      <EditProfileSheet open={open} onOpenChange={setOpen} initial={profile} />
    </>
  )
}
