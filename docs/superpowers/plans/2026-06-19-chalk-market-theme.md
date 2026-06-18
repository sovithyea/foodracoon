# Chalk Market Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dark terracotta theme with the Chalk Market light palette across all components — a global CSS token swap plus Mapbox style switch, with zero feature logic changes.

**Architecture:** All shadcn/ui components already consume CSS custom properties via Tailwind tokens (`bg-card`, `text-primary`, etc.). Swapping the `:root` variable values in `globals.css` and removing the `dark` class from `<html>` propagates the palette to every token-based component automatically. Only `RestaurantMap.tsx` needs manual edits because it contains hardcoded hex values in Mapbox paint properties.

**Tech Stack:** Tailwind v4 (`@theme inline`), shadcn/ui (`@import "shadcn/tailwind.css"`), Mapbox GL JS, Next.js App Router.

## Global Constraints

- All colour values must match the Chalk Market spec exactly (hex, not oklch).
- No feature logic changes — CSS/style edits only.
- Mapbox style: `mapbox://styles/mapbox/light-v11`.
- No new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `src/app/globals.css` | Replace `:root` CSS variables with Chalk Market hex values; remove `.dark` block entirely |
| `src/app/layout.tsx` | Remove `dark` class from `<html>` element |
| `src/components/map/RestaurantMap.tsx` | Switch Mapbox style URL; update 3 hardcoded paint hex values |

Everything else (`Nav.tsx`, `FilterBar.tsx`, `RestaurantPanel.tsx`, `AuthForm.tsx`, `OnboardingForm.tsx`, `StubPage.tsx`, auth layout) uses only CSS token utilities and auto-updates when `globals.css` changes.

---

### Task 1: Chalk Market CSS tokens + remove dark mode

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: updated CSS custom properties consumed by every component via Tailwind utilities

- [ ] **Step 1: Replace `:root` variables in `globals.css`**

  Open `src/app/globals.css`. Replace the entire `:root { ... }` block (lines 52–85) with:

  ```css
  :root {
    --background: #F5F0E8;
    --foreground: #2C2420;
    --card: #EDE6D8;
    --card-foreground: #2C2420;
    --popover: #EDE6D8;
    --popover-foreground: #2C2420;
    --primary: #D44C2A;
    --primary-foreground: #F5F0E8;
    --secondary: #EDE6D8;
    --secondary-foreground: #2C2420;
    --muted: #D4C8B4;
    --muted-foreground: #8C7E72;
    --accent: #EDE6D8;
    --accent-foreground: #2C2420;
    --destructive: oklch(0.577 0.245 27.325);
    --border: #D4C8B4;
    --input: #D4C8B4;
    --ring: #D44C2A;
    --chart-1: oklch(0.87 0 0);
    --chart-2: oklch(0.556 0 0);
    --chart-3: oklch(0.439 0 0);
    --chart-4: oklch(0.371 0 0);
    --chart-5: oklch(0.269 0 0);
    --radius: 0.625rem;
    --sidebar: #F5F0E8;
    --sidebar-foreground: #2C2420;
    --sidebar-primary: #D44C2A;
    --sidebar-primary-foreground: #F5F0E8;
    --sidebar-accent: #EDE6D8;
    --sidebar-accent-foreground: #2C2420;
    --sidebar-border: #D4C8B4;
    --sidebar-ring: #D44C2A;
  }
  ```

- [ ] **Step 2: Remove the `.dark { ... }` block from `globals.css`**

  Delete the entire `.dark { ... }` block (lines 87–119). The app is light-only; the `.dark` variant definition on line 5 can stay (harmless).

  After removal the file from `:root` to the `@layer base` block should look like:

  ```css
  :root {
    /* ... Chalk Market values from Step 1 ... */
  }

  @layer base {
    * {
      @apply border-border outline-ring/50;
    }
    body {
      @apply bg-background text-foreground;
    }
    html {
      @apply font-sans;
    }
  }
  ```

- [ ] **Step 3: Remove `dark` class from `<html>` in `layout.tsx`**

  In `src/app/layout.tsx`, change:

  ```tsx
  <html
    lang="en"
    className={`dark ${inter.variable} ${notoKhmer.variable} h-full antialiased`}
  >
  ```

  to:

  ```tsx
  <html
    lang="en"
    className={`${inter.variable} ${notoKhmer.variable} h-full antialiased`}
  >
  ```

- [ ] **Step 4: Run type check**

  ```bash
  npm run build
  ```

  Expected: build succeeds, no TypeScript errors.

- [ ] **Step 5: Start dev server and verify visually**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000`. Verify:
  - Page background is warm off-white `#F5F0E8` (not dark)
  - Sidebar: "foodracoon" brand in chilli red `#D44C2A`
  - Active nav item background `#EDE6D8`
  - Inactive nav items text `#8C7E72`
  - Login/signup page: warm off-white background, red primary button
  - Filter chips: unselected `#EDE6D8` bg; selected `#D44C2A` fill, white text
  - Restaurant panel (click a marker): off-white background, espresso text

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/globals.css src/app/layout.tsx
  git commit -m "feat: apply Chalk Market CSS tokens, remove dark mode"
  ```

---

### Task 2: Mapbox style switch + paint colour update

**Files:**
- Modify: `src/components/map/RestaurantMap.tsx`

**Interfaces:**
- Consumes: updated CSS tokens from Task 1 (no code dependency — visual only)
- Produces: `light-v11` map tiles; cluster and dot markers in Chalk Market colours

- [ ] **Step 1: Update the Mapbox style URL**

  In `src/components/map/RestaurantMap.tsx`, inside the `new mapboxgl.Map({ ... })` call, change:

  ```ts
  style: "mapbox://styles/mapbox/dark-v11",
  ```

  to:

  ```ts
  style: "mapbox://styles/mapbox/light-v11",
  ```

- [ ] **Step 2: Update cluster bubble paint values**

  In the `map.addLayer` call for layer id `"clusters"`, replace the `paint` object:

  ```ts
  paint: {
    "circle-color": "#D44C2A",
    "circle-opacity": 0.9,
    "circle-radius": [
      "step",
      ["get", "point_count"],
      16,
      5,
      22,
      15,
      28,
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255,255,255,0.6)",
  },
  ```

- [ ] **Step 3: Update cluster count text colour**

  In the `map.addLayer` call for layer id `"cluster-count"`, the `paint` is already `{ "text-color": "#fff" }` — leave it unchanged.

- [ ] **Step 4: Update unclustered point paint values**

  In the `map.addLayer` call for layer id `"unclustered-point"`, replace the `paint` object:

  ```ts
  paint: {
    "circle-color": [
      "case",
      ["get", "saved"],
      "#E8834A",
      "#D44C2A",
    ],
    "circle-radius": ["case", ["get", "saved"], 9, 7],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#F5F0E8",
  },
  ```

  Changes from Phase 1:
  - Cluster fill: `#C75D3C` → `#D44C2A`
  - Saved dot fill: `#E8A33D` → `#E8834A`
  - Unsaved dot fill: `#C75D3C` → `#D44C2A`
  - Stroke: `#1a1410` (dark) → `#F5F0E8` (off-white)

- [ ] **Step 5: Verify no other hardcoded dark hex values remain**

  Run:

  ```bash
  grep -rn "#1a1410\|#0f0f0f\|#111\|#18181b\|#1a1a1a\|#0d0d0d" src/
  ```

  Expected: no matches.

- [ ] **Step 6: Start dev server and verify map visually**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000`. Verify:
  - Map renders `light-v11` tiles (warm neutral, not dark)
  - Cluster bubbles: chilli red fill, white count text
  - Individual restaurant dots: chilli red (unsaved), orange `#E8834A` (saved)
  - Marker strokes: off-white, visible against the light map

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/map/RestaurantMap.tsx
  git commit -m "feat: switch Mapbox to light-v11, update marker paint to Chalk Market palette"
  ```

---

### Task 3: Full verification pass

**Files:** No changes — read-only verification.

- [ ] **Step 1: Run lint**

  ```bash
  npm run lint
  ```

  Expected: no errors.

- [ ] **Step 2: Run build**

  ```bash
  npm run build
  ```

  Expected: clean build.

- [ ] **Step 3: Verify auth pages**

  Open `/login` and `/signup`:
  - Background: `#F5F0E8`
  - "Continue with Google" button: outlined, espresso text
  - "Sign in" / "Sign up" button: chilli red `#D44C2A`, off-white text
  - Input border: `#D4C8B4`; focus ring: `#D44C2A`
  - "foodracoon" brand above form: chilli red

- [ ] **Step 4: Verify stub pages**

  Open `/search`, `/lists`, `/feed`, `/profile` (stubs):
  - Background: `#F5F0E8`
  - Empty state text: muted `#8C7E72`
  - "Open the map" button: chilli red

- [ ] **Step 5: Verify restaurant panel**

  Click a map marker:
  - Sheet slides up with `#F5F0E8` background
  - Restaurant name: `#2C2420` espresso
  - Cuisine/tag badges: `#EDE6D8` bg, `#8C7E72` text, `#D4C8B4` border
  - Save button: `#D44C2A` bg, off-white text
  - Disabled buttons (Rate, View Full): `#D4C8B4` text and border

- [ ] **Step 6: Final commit (if any fixes needed)**

  If Step 3–5 reveal any residual dark values in components, fix them and commit:

  ```bash
  git add <files>
  git commit -m "fix: remove residual dark colour values from <component>"
  ```
