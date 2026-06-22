"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useAuthModal } from "@/hooks/useAuthModal";

export function AuthModal() {
  const { isOpen, close } = useAuthModal();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-[199] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className={`fixed inset-x-0 bottom-0 z-[200] mx-auto max-w-sm rounded-t-2xl bg-[#F5F0E8] px-8 pb-12 pt-8 shadow-[0_-4px_24px_rgba(44,36,32,0.12)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <button
            onClick={close}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-[#EDE6D8] text-[#8C7E72] transition-colors hover:bg-[#D4C8B4] hover:text-[#2C2420]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <img
            src="/icon-512x512.png"
            alt="Foodracoon"
            width={48}
            height={48}
            className="size-12 rounded-[14px] shadow-[0_2px_8px_rgba(44,36,32,0.12)]"
          />

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#2C2420]">Sign in to continue</h2>
            <p className="text-sm leading-relaxed text-[#8C7E72]">
              Create an account to rate restaurants, save lists, and follow friends.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Link
              href="/login"
              onClick={close}
              className="flex w-full items-center justify-center rounded-2xl bg-[#D44C2A] py-3 text-sm font-bold text-white shadow-[0_3px_10px_rgba(212,76,42,0.28)] transition-all hover:bg-[#B83D1E] active:scale-[.98]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={close}
              className="flex w-full items-center justify-center rounded-2xl border border-[#D4C8B4] bg-[#EDE6D8] py-3 text-sm font-bold text-[#2C2420] transition-all hover:bg-[#D4C8B4] active:scale-[.98]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
