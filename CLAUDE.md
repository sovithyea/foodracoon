# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev               # start dev server (localhost:3000 or next available port)
npm run build             # production build + type check
npm run lint              # eslint
npx tsx scripts/seed.ts           # seed from local JSON (needs service-role key)
npx tsx scripts/import-places.ts  # import from Google Places API (needs GOOGLE_PLACES_API_KEY)
```

## Environment variables

`.env.local` needs:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY` (scripts only — bypasses RLS)
- `GOOGLE_PLACES_API_KEY` (import-places.ts only)

## Architecture

**Foodracoon** — Phnom Penh restaurant discovery app (Beli-style). Next.js 16 App Router + Supabase (project `gnmzwzmtdblkujyuvadi`) + Mapbox GL.

### Route groups

| Group | Path | Purpose |
|-------|------|---------|
| `(app)` | `/`, `/search`, `/lists`, `/feed`, `/profile` | App shell with Nav sidebar |
| `(app)` | `/restaurant/[id]` | Server-rendered restaurant detail page — cover photo, tags, community reviews |
| — | `/login` | Email/password sign-in (no auth wall — app works without login) |
| — | `/admin`, `/admin/restaurants`, `/admin/suggestions` | Admin panel — requires `profiles.is_admin = true` |

`/search` is fully implemented (public data, no auth). `/lists` is a real feature (see below). `/feed` is still a stub. `/profile` shows a sign-in prompt if unauthenticated (does not redirect).

### Auth

Auth is **optional**. `proxy.ts` (the middleware — not `middleware.ts`) calls `updateSession` on every request to refresh cookies, but does not enforce login. Status saves and ratings use optimistic updates client-side and persist to DB only when a user is signed in. The API routes (`/api/restaurants/[id]/rate`) return 401 silently — the UI never surfaces this to the user.

### Supabase client usage

- **Browser components**: `src/lib/supabase/client.ts`
- **Server components / route handlers**: `src/lib/supabase/server.ts` (`await createClient()`)
- **Middleware**: `src/lib/supabase/middleware.ts`
- DB types at `src/lib/database.types.ts` — regenerate with Supabase CLI after schema changes.

### Zustand store — `src/store/mapStore.ts`

Single store for all map state. Key fields:

- `restaurants` — full list, fetched client-side by `MapView` from `GET /api/restaurants` and cached (see below)
- `lastFetched: number | null` + `RESTAURANTS_TTL` (30 min) — `MapView` skips the fetch if cached restaurants are still fresh. `setRestaurants()` sets the list + stamps `lastFetched`; `setStatuses()` sets `statusMap` only. (There is no longer a combined `init` action.)
- `statusMap: Map<string, RestaurantStatus>` — per-restaurant user status (`want_to_try` / `visited` / `favourite`). Replaces the old `savedIds` set.
- `selectedId` — opens `RestaurantPanel` when set; triggers `flyTo` in `RestaurantMap`
- `cuisines` / `prices` — active filter sets; `filterRestaurants(state)` derives the filtered list
- `searchFilterIds: Set<string> | null` — when set, map shows only these restaurant IDs; `SearchFilterPill` shows a clear button
- `searchQuery` — stored alongside `searchFilterIds` for the pill label
- `activeRoute` / `userLocation` — directions state
- `mapStyleId: string | null` — user-selected base map style (`"light"` / `"dark"` / `"streets"` / `"satellite"`); `null` means follow app theme

`userLocation` is cached in the store so geolocation is only requested once (reused by both `RestaurantPanel` distance row and `/search` page result rows).

### Map rendering — `src/components/map/`

`MapView` receives only `statuses` (server-fetched, per-user) as a prop; it applies them immediately, then fetches `restaurants` client-side from `GET /api/restaurants` unless the Zustand cache is still fresh (`lastFetched` < 30 min). The store is the single source of truth — `RestaurantMap` reads `restaurants`/`statusMap` reactively and repaints, so updating the store after the fetch is enough. `MapView` renders `RestaurantMap` + `FilterBar` + `MapStylePicker` + `RestaurantPanel` + `DirectionsPanel` as absolute overlays on top of the Mapbox canvas (`SearchFilterPill` lives inside `RestaurantMap`).

The map page (`src/app/(app)/page.tsx`) is a server component that fetches **only** the small, auth-dependent `user_restaurants` status set — it no longer queries restaurants. The heavy restaurant payload (~3.9MB) is fetched client-side so navigation back to `/` within the TTL skips the network entirely.

`RestaurantMap` owns the Mapbox GL instance in a ref. Style reloads (dark/light theme switch) re-add all layers via `style.load`. GeoJSON source is updated via `source.setData()` on every filter/status/search change — never destroy/recreate the map.

Marker colours: red (unsaved) · orange (want_to_try) · green (visited) · amber (favourite).

### Restaurant panel — `src/components/map/RestaurantPanel.tsx`

Opens as a bottom sheet (`Sheet` from shadcn) when `selectedId` is set. Contains:
1. Google Places cover photo (`cover_photo_url`) if present
2. Mapbox Static Images thumbnail (light or dark, matching theme) — `src/lib/staticMap.ts`
3. Distance + walk time row — computed via `haversineDistance()` from `src/lib/geo.ts`, geolocation requested non-blocking on panel open
4. Status toggle (Want to Try / Visited / Favourite) with toggle-off — `RatingSection` subcomponent
5. 1–10 rating + review textarea (shown when status is visited or favourite)
6. "View Full" link → `/restaurant/[id]`; Recommend placeholder (disabled)
7. Get directions button — calls Mapbox Directions API via `/api/directions`, draws route on map

### Search — `src/app/(app)/search/page.tsx` + `src/app/api/search/route.ts`

Search page debounces 300ms then calls `GET /api/search?q=`. The API runs four parallel Supabase queries: name ilike, district ilike, all-restaurants filtered in JS for cuisine/tag arrays, and dish name ilike (two-step: dishes → restaurants). Results are deduplicated (name > dish > cuisine > district priority) and returned as four bucketed arrays.

Tapping a result calls `setSearchFilter(query, [id])` + `select(id)` + `router.push("/")` — map flies to the pin, panel opens, all other markers hidden. Recent searches are persisted to `localStorage` (`foodracoon:recent-searches`, max 8) and shown in the empty state.

### Lists — `src/app/(app)/lists/` + `src/store/listsStore.ts`

Three fixed default lists (`want-to-try` / `visited` / `favourites`, derived from `user_restaurants` status) plus user-created custom lists (`lists` + `list_restaurants` tables). `listsStore` (Zustand) holds custom lists for optimistic add/update/remove, but **the DB is the source of truth** — `/lists` re-fetches from `GET /api/lists` on every mount (do not gate the fetch on a cached flag). Types in `src/lib/lists.ts`.

When joining `list_restaurants` → `restaurants`, PostgREST nests the related row under the **table name** (`restaurants`); the UI (`ListRestaurantCard`, `ListRestaurantDetail`) expects it under `restaurant` (singular), so the API route remaps the key. `CreateListSheet` is shared between create and edit (pass `editList`); it syncs its form fields to `editList` on open so stale values aren't shown after an external change.

### Key DB tables

`profiles` (1:1 with auth.users) · `restaurants` (service-role writes only — via seed/import scripts) · `user_restaurants` (status, rating 1–10, review per user×restaurant) · `lists` + `list_restaurants` · `recommendations` · `follows` · `dishes` + `dish_logs`

### API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/restaurants` | GET | All restaurants, paginated past the 1000-row cap — feeds the client-side map cache |
| `/api/restaurants/[id]/rate` | POST | Upsert `user_restaurants` row — accepts `{ status, rating?, review? }` |
| `/api/restaurants/[id]/rate` | DELETE | Remove user's relationship with a restaurant |
| `/api/search` | GET | Multi-bucket restaurant search, `?q=` param |
| `/api/directions` | GET | Mapbox walking/driving directions, `?from=lng,lat&to=lng,lat&profile=` |
| `/api/lists` | GET/POST | List user's lists (with restaurant counts) / create a list |
| `/api/lists/[id]` | PUT/DELETE | Update (title/emoji/description/`is_public`, re-slugs on title change) / delete a list |
| `/api/lists/[id]/restaurants` | GET/POST | List members (joins `restaurants`, adds `user_rating`) / add a restaurant |
| `/api/lists/[id]/restaurants/[rid]` | DELETE | Remove a restaurant from a list |
| `/api/lists/user/[username]/[slug]` | GET | Public list by owner username + slug (share links) |
| `/api/admin/restaurants/add` | POST | Admin-only: insert a new restaurant (service-role client) |
| `/api/admin/restaurants/[id]` | PATCH | Admin-only: update tags/cuisine/district |

### Supabase pagination

PostgREST default `max_rows = 1000`. `GET /api/restaurants` bypasses this with a `count: "exact"` head query then parallel `.range()` fetches. Never use `.limit()` to fetch > 1000 rows; it silently truncates. Note: this full payload exceeds Next.js's 2MB `unstable_cache` limit, so it cannot be wrapped in the data cache — caching is done client-side in Zustand instead.

### Next.js 16 — dynamic route params

`params` is a `Promise` in Next.js 16 App Router:
```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Button component gotcha

`src/components/ui/button.tsx` wraps `@base-ui/react/button` which has **no `asChild` prop**. To make a styled Link, use `buttonVariants()` directly on the `<Link>`:
```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
<Link href="/somewhere" className={buttonVariants({ variant: "outline" })}>Go</Link>
```

### base-ui Menu gotcha

`DropdownMenu*` (`src/components/ui/dropdown-menu.tsx`) wraps `@base-ui/react/menu`, **not** Radix. `DropdownMenuItem` fires **`onClick`**, not `onSelect` — `onSelect` is silently ignored and the action never runs (`closeOnClick` defaults true). The `DropdownMenuTrigger` takes its button via the `render` prop, not `asChild`.

### UI conventions

- Components live in `src/components/{domain}/`. Shared primitives from shadcn in `src/components/ui/`.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `src/lib/restaurants.ts` — `MapRestaurant` type, `priceLabel()`, map center/zoom constants.
- `src/lib/geo.ts` — `haversineDistance()`, `formatDistance()`, `walkTimeMinutes()`.
- `src/lib/staticMap.ts` — Mapbox Static Images URL builder.
- `src/lib/search.ts` — `SearchResult` and `SearchResponse` types shared between API and UI.
- Tailwind v4. Dark mode via `dark` class on `<html>`. Theme provided by `next-themes` with `suppressHydrationWarning` on `<html>` and `<body>`.
- Chalk Market palette: `#F5F0E8` bg · `#EDE6D8` card · `#D44C2A` accent/primary · `#2C2420` text · `#D4C8B4` border.
