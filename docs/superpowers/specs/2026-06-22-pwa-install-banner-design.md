# PWA Install Banner — Design Spec

**Date:** 2026-06-22  
**Status:** Approved

## Goal

Surface "Add to Home Screen" to mobile users who visit via browser. Two paths:
- **Android/Chrome**: intercept `beforeinstallprompt`, trigger native install dialog on tap
- **iOS Safari**: show static instructions (Share → Add to Home Screen) since iOS has no API

Desktop: banner never shown (browser chrome handles install natively).

## Dismissal

Option C — snooze with re-show. `localStorage` key `foodracoon:install-dismissed` stores a Unix timestamp. Banner is suppressed if timestamp exists and is less than 7 days old. After 7 days, banner resurfaces once. Dismissing again resets the 7-day clock.

Banner is also permanently suppressed once the app is running in standalone mode (`window.matchMedia('(display-mode: standalone)').matches`).

## Component

**`src/components/shell/InstallBanner.tsx`** — single client component handling both platforms.

### Mount logic

1. If `display-mode: standalone` → return null (already installed)
2. Read `foodracoon:install-dismissed` from `localStorage`; if timestamp < 7 days ago → return null
3. Detect iOS: `navigator.userAgent` matches `/iphone|ipad|ipod/i`
4. iOS path: render static banner immediately
5. Android/Chrome path: listen for `beforeinstallprompt` event; render banner only after event fires (means browser deems site installable)

### Render

- Fixed position, `bottom` = height of mobile nav + safe-area-inset (`bottom-[calc(env(safe-area-inset-bottom,0px)+60px)]`)
- Horizontal padding matches nav
- Only visible on mobile (`md:hidden`)
- Chalk Market palette: `bg-[#EDE6D8]` card, `#D44C2A` accent, `#2C2420` text, `#D4C8B4` border-top
- Left: raccoon/app icon + text
  - iOS: "Tap Share then 'Add to Home Screen'"
  - Android: "Install Foodracoon for quick access"
- Right: Install button (Android) or dismiss X (both)
- `appinstalled` event → hide banner + clear localStorage key

### Types

Add `BeforeInstallPromptEvent` interface to `src/types/next-pwa.d.ts`:
```ts
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
```

## Integration

Add `<InstallBanner />` directly in `src/app/(app)/layout.tsx`, alongside `<Nav />`, so it renders on all app routes but not on `/login` or `/admin`.

The component is self-contained — no store, no context, no props needed.

## Non-goals

- No desktop install button (browser handles it)
- No push notification prompting
- No install analytics/tracking
