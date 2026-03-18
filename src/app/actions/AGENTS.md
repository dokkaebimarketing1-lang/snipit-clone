# SERVER ACTIONS

All files use `"use server"`. Supabase Server Client via `createClient()` from `@/utils/supabase/server`.

## AUTH PATTERN

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Unauthorized");
```

Exception: `search.ts` — auth optional (gracefully skips history tracking).

## FILES

| File | Functions | External API | Notes |
|------|-----------|-------------|-------|
| **search.ts** | `searchAds`, `searchScrapedAds`, `getFeaturedAds`, `generateMockResults` | — | DB-first search with category/sort/pagination. Mock fallback. |
| **boards.ts** | `getBoards`, `createBoard`, `updateBoard`, `deleteBoard` | — | `revalidatePath("/board")` |
| **folders.ts** | `getFolders`, `createFolder`, `updateFolder`, `deleteFolder` | — | `revalidatePath("/board")` |
| **saved-ads.ts** | `saveAd`, `getSavedAds`, `removeSavedAd`, `moveAdToBoard` | — | `revalidatePath("/board")` |
| **competitors.ts** | `getCompetitors`, `addCompetitor`, `removeCompetitor` | — | `revalidatePath("/monitoring")` |
| **monitoring.ts** | `getMonitoringData`, `fetchMetaAdsLibrary`, `getMonitoringStats` | Meta Ads Library API | Official API — EU ads only |
| **instagram.ts** | `analyzeInstagramAccount` | OpenAI GPT-4o-mini | Instagram account analysis |

## SEARCH.TS (MOST COMPLEX)

```
searchAds(query, mode, options)
  ↓ options: { category, sort, page, limit, brandName }
  ↓ tries searchScrapedAds() first
  ↓   .from("scraped_ads")
  ↓   .contains("categories", [category])  — PostgreSQL array filter
  ↓   .or("brand_name.ilike.%q%, copy_text.ilike.%q%")
  ↓   .order(sort).range(offset, offset+limit-1)
  ↓ returns { results, totalCount, hasMore }
  ↓ fallback: generateMockResults(query)
```

Key: `getFeaturedAds()` — random ads for initial page load (no query).

## ERROR HANDLING

- DB/Auth errors → `throw`
- External API errors → `try-catch` → return `[]` or fallback
- Search → NEVER returns empty. Mock fallback guaranteed.
