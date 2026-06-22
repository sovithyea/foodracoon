# Legal Pages — Design Spec

**Date:** 2026-06-23  
**Status:** Approved

## Goal

Add `/privacy` and `/terms` static pages. Accessible without auth, no app shell, Chalk Market branded. Required because the app collects user email, reviews, and ratings via Supabase.

## Routes

| Path | File |
|------|------|
| `/privacy` | `src/app/(public)/privacy/page.tsx` |
| `/terms` | `src/app/(public)/terms/page.tsx` |

Both live under the existing `(public)` route group which has a bare pass-through layout.

## Layout

- `bg-[#F5F0E8]` page background, `#2C2420` body text
- Max-width prose container: `max-w-2xl mx-auto px-6 py-12`
- Top: `foodraccoon` logo in `#D44C2A` linking back to `/`
- `h1` / `h2` in `#D44C2A`
- Bottom: small footer with links to the other legal page + back to app
- No Nav, no Toaster, no client JS

## Privacy Policy (`/privacy`)

**Effective date:** 2026-06-23

Sections:
1. **Information We Collect** — email address (via Supabase Auth), restaurant reviews/ratings/save-status, localStorage keys (`foodraccoon:recent-searches`, `foodraccoon:install-dismissed`)
2. **How We Use It** — display your saved restaurants and reviews, personalise the app
3. **Data Storage** — Supabase (AWS ap-southeast-1, Singapore); data encrypted at rest and in transit
4. **Third-Party Services** — Mapbox (map tiles; their privacy policy applies); no advertising networks
5. **Data Sharing** — not sold or shared with third parties
6. **Your Rights** — email to request export or deletion; we action within 30 days
7. **Cookies / Storage** — localStorage only (no tracking cookies)
8. **Contact** — prachsovithyea11@gmail.com

## Terms of Service (`/terms`)

**Effective date:** 2026-06-23

Sections:
1. **Acceptance** — using the app constitutes acceptance
2. **Description** — Foodraccoon is a restaurant discovery app for Phnom Penh
3. **User Content** — you own your reviews; you grant Foodraccoon a non-exclusive licence to display them; you must not post false or defamatory content
4. **Acceptable Use** — no spam, no scraping, no impersonation, no illegal activity
5. **Accuracy** — restaurant data may be incomplete or outdated; use your own judgement
6. **No Warranty** — app provided as-is; no guarantee of uptime or accuracy
7. **Limitation of Liability** — Foodraccoon not liable for indirect or consequential loss
8. **Governing Law** — Kingdom of Cambodia
9. **Changes** — terms may update; continued use constitutes acceptance
10. **Contact** — prachsovithyea11@gmail.com

## Linking

Add links to `/privacy` and `/terms` in:
- `src/components/shell/OnboardingFlow.tsx` — small footer on the last slide
- `src/app/login/page.tsx` — below the sign-in form ("By signing in you agree to our Terms and Privacy Policy")
