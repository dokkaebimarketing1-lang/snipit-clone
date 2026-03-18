# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-18
**Commit:** 7c90a1b
**Branch:** master

## OVERVIEW

snipit.im clone — Korean ad reference search platform with real Meta Ad Library data.
Next.js 16 App Router + Mantine v7 + Supabase (auth/DB/storage) + Puppeteer crawling pipeline.

## STRUCTURE

```
snipit-clone/
├── src/
│   ├── app/
│   │   ├── actions/        # Server Actions — see actions/AGENTS.md
│   │   ├── api/search/     # Search API: category/sort/pagination/brand filters
│   │   ├── api/instagram/  # Instagram analysis (OpenAI GPT-4o-mini)
│   │   ├── auth/callback/  # Google OAuth callback
│   │   ├── brand/[name]/   # Dynamic brand profile page
│   │   ├── landing/        # Marketing page (own layout, no sidebar)
│   │   └── [pages]/        # search, monitoring, ai, experiment, board, profile
│   ├── components/
│   │   ├── layout/         # AppShell.tsx — 68px sidebar, 6 nav items
│   │   ├── cards/          # AdCard.tsx — image error fallback, brand placeholder
│   │   ├── auth/           # LoginButton, ProtectedRoute
│   │   └── common/         # MasonryGrid, PaywallOverlay
│   ├── hooks/              # useAuth.ts — Supabase auth + Google OAuth
│   ├── utils/supabase/     # client.ts (browser), server.ts (SSR) — build-time guards
│   ├── theme/              # Mantine theme: snipitBlue, SUIT+Pretendard fonts
│   ├── types/              # Platform, AdCard, Board, Competitor types
│   └── data/               # mockAds.ts — deterministic mock ads (final fallback)
├── scripts/                # Crawling pipeline — see scripts/AGENTS.md
├── supabase/
│   ├── schema.sql          # 8 tables (profiles, folders, boards, saved_ads, competitors, monitoring_data, search_history, scraped_ads)
│   ├── rls.sql             # RLS policies
│   └── migrations/         # DB migrations
├── chrome-extension/       # Chrome Extension — see chrome-extension/AGENTS.md
└── .env.local.example
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/app/{name}/page.tsx` | "use client", Mantine only |
| Add Server Action | `src/app/actions/{name}.ts` | "use server", see actions/AGENTS.md |
| Search/filter logic | `src/app/actions/search.ts` | `searchScrapedAds()` — DB-first, mock fallback |
| Ad card display | `src/components/cards/AdCard.tsx` | Image error → brand placeholder |
| Brand profile | `src/app/brand/[name]/page.tsx` | Dynamic route, server-rendered |
| Crawl new ads | `scripts/scrape-meta-ads.mjs` | `--connect --port=9333` for real Chrome |
| Optimize images | `scripts/optimize-images.mjs` | Download → AVIF → Supabase Storage |
| Add DB table | `supabase/schema.sql` + SQL Editor | Can't connect programmatically (IPv6/pooler issue) |
| Sidebar | `src/components/layout/AppShell.tsx` | navItems array |
| Theme | `src/theme/index.ts` | snipitBlue palette |

## DATA FLOW

```
Search Page ("use client")
  ↓ fetch("/api/search?q=...&category=뷰티&sort=scraped_at&page=1")
API Route (thin wrapper)
  ↓ calls searchAds()
Server Action: searchScrapedAds()
  ↓ supabase.from("scraped_ads").select()
  ↓ .contains("categories", [category])
  ↓ .or(ilike brand_name, copy_text)
Supabase DB (scraped_ads: 5000+ rows, 8 categories)
  ↓ fallback: generateMockResults() if DB empty
```

```
Crawling Pipeline (local, not on Vercel)
  Chrome (--remote-debugging-port=9333)
  ↓ Puppeteer vanilla connect (NOT stealth)
  scripts/scrape-meta-ads.mjs
  ↓ Navigate facebook.com/ads/library → text-based parsing
  ↓ CDP Network.getResponseBody → capture images
  ↓ sharp → AVIF (quality:50, max 600x600)
  ↓ Supabase Storage upload (ad-images bucket)
  ↓ Upsert to scraped_ads table
```

## CONVENTIONS

- **Styling**: Mantine components + CSS modules ONLY. Zero Tailwind.
- **Font stack**: `"SUIT Variable", "Pretendard Variable", Pretendard, -apple-system`
- **Auth pattern**: `createClient()` → `getUser()` → throw if no user
- **Search pattern**: DB query first → mock fallback → never empty results
- **Image URLs**: Supabase Storage AVIF (permanent) preferred over Facebook CDN (expires)
- **Categories**: `text[]` column, 8 categories: 뷰티, 건강식품, 패션, 헬스/운동, 식품/배달, 테크/앱, 리빙, 건강기기, 기타
- **Crawling**: Always `--connect` mode with real Chrome (headless/stealth = 0 results)
- **Error handling**: DB/auth → throw. External API → try-catch → fallback data.

## ANTI-PATTERNS (THIS PROJECT)

- **NO Tailwind** — Mantine handles all styling
- **NO `as any` / `@ts-ignore`** — Strict TypeScript
- **NO `export default`** — Named exports (except pages)
- **NO direct Supabase env access** — Always `createClient()` with build-time guards
- **NO puppeteer-extra for --connect mode** — Stealth plugin breaks real Chrome sessions
- **NO fetch() for Facebook CDN images** — Always returns 403. Use CDP interception.
- **NO headless Puppeteer for Meta scraping** — Facebook detects. Use real Chrome only.

## SUPABASE

| Table | Purpose | RLS |
|-------|---------|-----|
| profiles | User profiles (auto-created on signup) | Own profile only |
| folders | Board folders | Own only |
| boards | Ad boards | Own only |
| saved_ads | User-saved ads | Own only |
| competitors | Monitored competitors | Own only |
| monitoring_data | Competitor ad snapshots | Via competitor ownership |
| search_history | Search queries | Own only |
| **scraped_ads** | **Crawled Meta ads (5000+)** | **Public read, service write** |

Storage bucket: `ad-images` (public, AVIF, 1yr cache)

## ENV VARS

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | For DB/auth | Must also be on Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For DB/auth | Must also be on Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | For crawling scripts | Local + Vercel |
| `META_AD_LIBRARY_ENABLED` | Toggle real search | Set `true` on Vercel |
| `UNSPLASH_ACCESS_KEY` | Deprecated | Mock fallback used instead |
| `META_ACCESS_TOKEN` | For monitoring | Meta Ads Library official API |
| `OPENAI_API_KEY` | For IG analysis | GPT-4o-mini |

## COMMANDS

```bash
npm run build      # Production build (always works)
npm run dev        # Dev server (may fail on Windows — use build+start)
npm run start      # Production server

# Crawling (requires Chrome with --remote-debugging-port=9333)
node scripts/scrape-meta-ads.mjs --connect --port=9333 올리브영 무신사
node scripts/optimize-images.mjs --port=9333  # AVIF conversion

# Launch Chrome for crawling
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9333 \
  --user-data-dir="C:/Users/LGS_002/chrome-scraper" \
  --no-first-run "about:blank"
```

## DEPLOYMENT (VERCEL)

- Auto-deploy on `git push origin master`
- Force deploy: `npx vercel --prod --force`
- Env vars: Set via `npx vercel env add NAME production`
- CRITICAL: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `META_AD_LIBRARY_ENABLED=true` must be set

## NOTES

- **DB direct connection impossible**: IPv6 only + pooler "Tenant not found". Use SQL Editor or REST API.
- **Facebook blocks all automated access**: Only real Chrome via `--connect` mode works.
- **Image pipeline**: CDN URLs expire within hours. Must capture via CDP during crawl, convert AVIF, upload to Storage.
- **Category filter**: Uses PostgreSQL array contains: `.contains("categories", ["뷰티"])`
- **Brand page**: Dynamic route `/brand/[name]` — server-rendered, queries by brand_name.
