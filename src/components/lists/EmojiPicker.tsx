"use client"
import { cn } from "@/lib/utils"

const EMOJIS = [
  "🍜","🍣","🍕","🍔","☕","🍷","🥗","🍱","🌮","🥐",
  "🍛","🍝","🦐","🥩","🍰","🧋","🍺","🍸","📍","⭐",
  "🔥","💎","🌙","🌿","🎯","✨","🏆","❤️","👑","🎪",
]

export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            "rounded-md p-1.5 text-xl hover:bg-accent transition-colors",
            value === emoji && "bg-accent ring-2 ring-primary ring-offset-1"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
