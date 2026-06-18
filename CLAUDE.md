# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # eslint
npx tsx scripts/seed.ts  # seed restaurants table (needs .env.local with service-role key)
```

## Environment variables

`.env.local` needs:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY` (seed script only)

## Architecture

**Foodracoon** — Phnom Penh restaurant discovery app (Beli-style). Next.js 16 App Router + Supabase (project `gnmzwzmtdblkujyuvadi`) + Mapbox GL.

### Route groups

| Group | Path | Purpose |
|-------|------|---------|
| `(auth)` | `/login`, `/signup` | Unauthenticated pages |
| `(app)` | `/`, `/search`, `/lists`, `/feed`, `/profile` | Authenticated app shell with Nav |
| — | `/onboarding` | Post-signup username setup |
| — | `/auth/callback` | Supabase OAuth callback |

### Auth flow

1. `proxy.ts` (the middleware file — not `middleware.ts`) calls `updateSession` on every request.
2. `updateSession` (`src/lib/supabase/middleware.ts`) redirects unauthenticated users to `/login` unless path is in `PUBLIC_PATHS`.
3. Page-level RSCs re-check auth and redirect to `/onboarding` if `profiles.username` is null.

### Supabase client usage

- **Browser components**: `src/lib/supabase/client.ts`
- **Server components / route handlers / Server Actions**: `src/lib/supabase/server.ts` (`await createClient()`)
- **Middleware**: `src/lib/supabase/middleware.ts`
- DB types auto-generated at `src/lib/database.types.ts` — regenerate with Supabase CLI after schema changes.

### Client state

`src/store/mapStore.ts` — single Zustand store. Holds restaurant list, filter sets (cuisine, price), selected restaurant ID, and saved IDs. Initialised by `MapView` on mount. `filterRestaurants(state)` derives the filtered list — call inside a selector.

### Key DB tables

`profiles` (1:1 with auth.users) · `restaurants` (seed/admin writes only) · `user_restaurants` (saves/ratings/reviews) · `lists` + `list_restaurants` · `recommendations` · `follows` · `dishes` + `dish_logs`

`restaurants` rows are written only via the seed script or service-role admin — normal users never write to this table.

### API routes

`POST /api/restaurants/[id]/rate` — upserts a `user_restaurants` row. Accepts optional `{ status }` body; defaults to `"want_to_try"`.

### UI conventions

- Components live in `src/components/{domain}/`. Shared primitives from shadcn (Base UI) in `src/components/ui/`.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `src/lib/restaurants.ts` — `MapRestaurant` type, `priceLabel()`, map center/zoom constants.
- Tailwind v4. Dark mode class strategy (`dark` on `<html>`).