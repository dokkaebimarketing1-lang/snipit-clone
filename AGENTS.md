# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-16
**Commit:** a9ffb22
**Branch:** main

## OVERVIEW

snipit.im clone — AI-powered ad reference search & competitor monitoring platform.
Next.js 16 App Router + Mantine v7 + Supabase (auth/DB) + Unsplash/Meta/OpenAI APIs.

## STRUCTURE

```
snipit-clone/
├── src/
│   ├── app/
│   │   ├── actions/      # Server Actions (7 files) — see actions/AGENTS.md
│   │   ├── api/           # API routes: /search, /instagram/analyze
│   │   ├── auth/callback/ # Google OAuth callback handler
│   │   ├── landing/       # Marketing landing page (separate layout, no sidebar)
│   │   └── [pages]/       # search, monitoring, ai, experiment, board, profile
│   ├── components/
│   │   ├── layout/        # AppShell.tsx — sidebar nav with 6 items + LoginButton
│   │   ├── cards/         # AdCard.tsx — ad reference card (platform border, blur badge)
│   │   ├── auth/          # LoginButton.tsx, ProtectedRoute.tsx
│   │   └── common/        # MasonryGrid, PaywallOverlay
│   ├── hooks/             # useAuth.ts — Supabase auth state + Google OAuth
│   ├── utils/supabase/    # client.ts (browser), server.ts (SSR) — build-time guards
│   ├── theme/             # Mantine theme: snipitBlue, SUIT+Pretendard fonts
│   ├── types/             # Platform, AdCard, Board, Folder, Competitor types
│   ├── data/              # mockAds.ts — 40 deterministic mock ads + blog posts
│   └── middleware.ts      # Supabase session refresh (skips if no env vars)
├── supabase/
│   ├── schema.sql         # 7 tables: profiles, folders, boards, saved_ads, competitors, monitoring_data, search_history
│   └── rls.sql            # Row Level Security — user_id ownership policies
├── chrome-extension/      # Standalone Chrome Extension — see chrome-extension/AGENTS.md
└── .env.local.example     # Supabase, Unsplash, Meta, OpenAI keys
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/app/{name}/page.tsx` | "use client", Mantine components only |
| Add Server Action | `src/app/actions/{name}.ts` | "use server", auth via `createClient()` → `getUser()` |
| Add API route | `src/app/api/{name}/route.ts` | Wraps Server Action, returns NextResponse.json() |
| Modify sidebar | `src/components/layout/AppShell.tsx` | navItems array, Divider after index 1 |
| Modify ad card | `src/components/cards/AdCard.tsx` | Platform colors, blur badge, hover effect |
| Change theme | `src/theme/index.ts` | snipitBlue palette, font stack |
| Add DB table | `supabase/schema.sql` + `supabase/rls.sql` | Run in Supabase SQL Editor |
| Auth flow | `src/hooks/useAuth.ts` → `src/utils/supabase/client.ts` | Lazy ref pattern (no SSR call) |

## DATA FLOW

```
Client Component
  ↓ fetch("/api/search?q=...")  OR  direct Server Action call
API Route (optional thin wrapper)
  ↓ calls Server Action
Server Action ("use server")
  ↓ createClient() → getUser() → query
Supabase (DB) + External API (Unsplash/Meta/OpenAI)
```

## CONVENTIONS

- **Styling**: Mantine components + CSS modules ONLY. Zero Tailwind.
- **Font stack**: `"SUIT Variable", "Pretendard Variable", Pretendard, -apple-system`
- **Exports**: Named exports only (no `export default` except pages)
- **Auth pattern**: Every Server Action starts with `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Unauthorized");`
- **Error handling**: Throw on auth/DB errors. Try-catch with empty array fallback for external APIs.
- **Path revalidation**: `revalidatePath()` after every mutation (boards, folders, saved-ads, competitors)
- **Mock fallback**: Pages use mock data when Supabase not configured (dynamic import + try-catch)
- **Deterministic mock data**: `seeded()` function instead of `Math.random()` to prevent hydration mismatch

## ANTI-PATTERNS (THIS PROJECT)

- **NO Tailwind** — Mantine handles all styling. postcss.config uses `postcss-preset-mantine`.
- **NO `as any` / `@ts-ignore`** — Strict TypeScript throughout.
- **NO `export default`** — Named exports for all components/hooks/utils.
- **NO direct Supabase env access** — Always through `createClient()` which has build-time guards.
- **NO `console.log`** — Zero logging in production code.

## UNIQUE STYLES

- **Platform border colors**: meta=`rgba(0,114,235,0.3)`, instagram=`rgba(162,49,193,0.29)`, google=`rgba(52,168,82,0.3)`, tiktok=`rgba(0,0,0,0.29)`
- **Ad card media badge**: `backdrop-filter: blur(4px)`, `rgba(0,0,0,0.4)` background
- **Sidebar**: 68px fixed width, icon(22px) + text label(10px) below, Divider between monitoring↔AI
- **Search bar**: Loader spinner left, ActionIcon right (no button)
- **Paywall**: Sticky gradient overlay at search results bottom

## COMMANDS

```bash
npm run dev        # Dev server (Turbopack — may have Windows DLL issues)
npm run build      # Production build (always works)
npm run start      # Production server (after build)
npm run lint       # ESLint
```

## ENV VARS

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | For auth/DB | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth/DB | Supabase anon key |
| `UNSPLASH_ACCESS_KEY` | For search | Image search API |
| `META_ACCESS_TOKEN` | For monitoring | Meta Ads Library API |
| `OPENAI_API_KEY` | For IG analysis | GPT-4o-mini analysis |

All optional — app runs with mock data when keys absent.

## NOTES

- **Windows dev server**: `npm run dev` may fail with `0xc0000142` (DLL init). Use `npm run build && npm run start` instead.
- **Landing page**: `/landing` route has its own layout (no sidebar) via CSS override, NOT route groups.
- **Build-time guards**: `client.ts` and `server.ts` use placeholder Supabase URL when env vars missing to prevent SSG crashes.
- **Homepage**: 9 sections (hero, today's snipit 3:1, features, NEW, experiment mini, onboarding cards, SNIPIT LOG, testimonials, CTA+footer).
- **DB setup**: Run `supabase/schema.sql` then `supabase/rls.sql` in Supabase SQL Editor. Google OAuth needs separate config in Supabase dashboard.
