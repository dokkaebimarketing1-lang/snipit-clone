# SERVER ACTIONS

All files use `"use server"` directive. Supabase Server Client via `createClient()` from `@/utils/supabase/server`.

## AUTH PATTERN (every function)

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Unauthorized");
// ... query with .eq("user_id", user.id)
```

Exception: `search.ts` — auth optional (gracefully skips history if no user).

## FILES

| File | Functions | External API | Mutations |
|------|-----------|-------------|-----------|
| **boards.ts** | `getBoards`, `createBoard`, `updateBoard`, `deleteBoard` | — | `revalidatePath("/board")` |
| **folders.ts** | `getFolders`, `createFolder`, `updateFolder`, `deleteFolder` | — | `revalidatePath("/board")` |
| **saved-ads.ts** | `saveAd`, `getSavedAds`, `removeSavedAd`, `moveAdToBoard` | — | `revalidatePath("/board")` |
| **competitors.ts** | `getCompetitors`, `addCompetitor`, `removeCompetitor` | — | `revalidatePath("/monitoring")` |
| **monitoring.ts** | `getMonitoringData`, `fetchMetaAdsLibrary`, `getMonitoringStats` | Meta Ads Library (`graph.facebook.com/v21.0/ads_archive`) | — |
| **search.ts** | `searchAds` | Unsplash (`api.unsplash.com/search/photos`) | Inserts to `search_history` |
| **instagram.ts** | `analyzeInstagramAccount` | OpenAI (`api.openai.com/v1/chat/completions`, gpt-4o-mini) | — |

## ERROR HANDLING

- **DB/Auth errors**: `throw error` — caller handles
- **External API errors**: `try-catch` → return empty array `[]` or fallback data
- **Competitor ownership**: `getMonitoringData` verifies competitor belongs to user before querying

## ADDING A NEW ACTION

1. Create `src/app/actions/{name}.ts` with `"use server"` at top
2. Import `createClient` from `@/utils/supabase/server`
3. Start every function with auth check (copy pattern above)
4. Use `revalidatePath()` after mutations
5. For external APIs: wrap in try-catch, return fallback on failure
