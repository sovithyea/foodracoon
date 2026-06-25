"use client";

export default function ListDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xs space-y-4">
        <p className="text-lg font-semibold text-[#2C2420]">Something went wrong</p>
        <p className="text-sm text-[#8C7E72]">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="inline-block rounded-xl bg-[#D44C2A] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(212,76,42,0.25)] transition-all hover:bg-[#B83D1E]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
