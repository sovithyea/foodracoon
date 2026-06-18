# Chalk Market — Global Colour Scheme Update

**Date:** 2026-06-19
**Scope:** Visual/CSS only. No feature logic changes.
**Priority:** Done before Phase 2 features — all new components will be built on this palette.

---

## Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--fr-bg-primary` | `#F5F0E8` | Main background |
| `--fr-bg-secondary` | `#EDE6D8` | Surfaces, sidebar, cards |
| `--fr-bg-tertiary` | `#D4C8B4` | Borders, dividers, subtle strokes |
| `--fr-text-primary` | `#2C2420` | Dark espresso — main text |
| `--fr-text-secondary` | `#8C7E72` | Muted text, inactive nav items |
| `--fr-accent` | `#D44C2A` | Chilli red — primary action colour |
| `--fr-accent-hover` | `#B83D1E` | Darker red for hover states |
| `--fr-accent-light` | `#F5E8E4` | Very light red tint for selected chip backgrounds |
| `--fr-green` | `#3A7A5C` | Secondary accent — rated markers, success states |
| `--fr-orange` | `#E8834A` | Tertiary — "open now" badge, saved/want-to-try markers |

---

## shadcn/ui Token Mapping (`globals.css`)

Replace the existing dark-mode CSS variables with:

```css
:root {
  --background: #F5F0E8;
  --foreground: #2C2420;
  --card: #EDE6D8;
  --card-foreground: #2C2420;
  --primary: #D44C2A;
  --primary-foreground: #F5F0E8;
  --secondary: #EDE6D8;
  --secondary-foreground: #2C2420;
  --muted: #D4C8B4;
  --muted-foreground: #8C7E72;
  --border: #D4C8B4;
  --ring: #D44C2A;
}
```

Remove the `.dark` class from `<html>` in `src/app/layout.tsx` — Chalk Market is a light theme.

---

## Component Changes

### `src/app/globals.css`
- Define all `--fr-*` custom properties on `:root`
- Set shadcn token overrides above
- Remove any residual dark-mode overrides

### `src/app/layout.tsx`
- Remove `dark` class from `<html>`

### `src/components/shell/Nav.tsx`
- Desktop sidebar bg: `#F5F0E8`, border-right: `1px solid #D4C8B4`
- Mobile bottom bar bg: `#EDE6D8`
- Brand "foodracoon" text: `#D44C2A`
- Active nav item: bg `#EDE6D8`, text `#D44C2A`
- Inactive nav items: text `#8C7E72`
- User avatar ring: `#D4C8B4`

### `src/components/map/FilterBar.tsx`
- Bar bg: `#F5F0E8`, border-top: `1px solid #D4C8B4`
- Inactive chips: bg `#EDE6D8`, text `#2C2420`, border `#D4C8B4`
- Active/selected chips: bg `#D44C2A`, text `#F5F0E8`, border `#D44C2A`
- Disabled chips (Friends saved, Near me, Open now): text `#D4C8B4`, border `#D4C8B4`

### `src/components/map/RestaurantMap.tsx`
- Mapbox style URL: `mapbox://styles/mapbox/light-v11` (was `dark-v11`)
- Cluster circle fill: `#D44C2A`, cluster text: `#F5F0E8`
- Unclustered dot (unsaved): fill `#D44C2A`, stroke `#F5F0E8` 2px
- Saved/want-to-try dot: fill `#E8834A`, stroke `#F5F0E8` 2px

### `src/components/map/RestaurantPanel.tsx`
- Sheet bg: `#F5F0E8`, drag handle: `#D4C8B4`
- Restaurant name: `#2C2420`, weight 500
- Tags/badges: bg `#EDE6D8`, text `#8C7E72`, border `#D4C8B4`
- Price range text: `#2C2420`
- Save button: bg `#D44C2A`, text `#F5F0E8`
- Disabled buttons (Rate, View Full): border `#D4C8B4`, text `#D4C8B4`
- Dividers: `#D4C8B4`

### Auth pages (`/login`, `/signup`, `/onboarding`)
- Page bg: `#F5F0E8`
- Card/form surface: `#EDE6D8`
- Input borders: `#D4C8B4`, focus ring `#D44C2A`
- Primary button: bg `#D44C2A`, text `#F5F0E8`
- Brand/logo text: `#D44C2A`

### Stub pages (Search, Lists, Feed, Profile)
- Page bg: `#F5F0E8`
- Empty state text: `#8C7E72`
- Placeholder icons: `#D4C8B4`

---

## Mapbox Style Note

`mapbox://styles/mapbox/light-v11` gives a clean warm-neutral base that pairs naturally with Chalk Market. Custom GeoJSON layers (clusters, dots) use JS `map.addLayer()` paint properties — the style URL change does **not** recolour these. Update paint values explicitly in `RestaurantMap.tsx`.

---

## Verification

1. App loads — background is `#F5F0E8` (warm off-white), no dark tiles
2. Sidebar "foodracoon" brand in chilli red `#D44C2A`; active nav item bg `#EDE6D8`
3. Map renders `light-v11` tiles
4. Cluster markers: chilli red fill, white text
5. Selected cuisine chip: red fill, white text; unselected: `#EDE6D8` bg
6. Restaurant panel: off-white bg, espresso text, red Save button
7. Login page matches palette — no leftover dark backgrounds
8. No hardcoded dark values (`#1a1a1a`, `#0f0f0f`, `#111`, `#18181b`, etc.) remain — grep the codebase and replace with tokens
