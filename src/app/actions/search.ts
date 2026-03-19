"use server";

import { createClient } from "@/utils/supabase/server";

interface SearchResult {
  id: string;
  imageUrl: string;
  imageUrls: string[];
  brandName: string;
  platform: "meta" | "instagram" | "google" | "tiktok";
  mediaType: "photo" | "video" | "reels" | "carousel";
  status: "active" | "inactive";
  publishedAt: string;
  durationDays: number;
  isSponsored: boolean;
  copyText: string;
  fullCopyText: string;
  landingUrl: string | null;
  ctaText: string | null;
}

interface ScrapedAdRow {
  external_id: string | null;
  brand_name: string | null;
  copy_text: string | null;
  full_copy_text: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  landing_url: string | null;
  cta_text: string | null;
  platform: string | null;
  media_type: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_days: number | null;
  is_sponsored: boolean | null;
  scraped_at: string | null;
}

function formatDateString(dateValue: string | null): string {
  if (!dateValue) return "1970.01.01";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "1970.01.01";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function getDurationDays(start: string | null, end: string | null, status: "active" | "inactive"): number {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : status === "active" ? new Date() : null;
  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 1;
  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.ceil(diffMs / 86_400_000));
}

function normalizePlatform(platform: string | null): "meta" | "instagram" | "google" | "tiktok" {
  const normalized = (platform ?? "").toLowerCase();
  if (normalized.includes("instagram") || normalized.includes("insta")) return "instagram";
  if (normalized.includes("google")) return "google";
  if (normalized.includes("tiktok") || normalized.includes("tik_tok")) return "tiktok";
  return "meta";
}

function normalizeMediaType(mediaType: string | null): "photo" | "video" | "reels" | "carousel" {
  const normalized = (mediaType ?? "").toLowerCase();
  if (normalized.includes("video")) return "video";
  if (normalized.includes("reels") || normalized.includes("reel")) return "reels";
  if (normalized.includes("carousel")) return "carousel";
  return "photo";
}

function buildFallbackImage(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `https://picsum.photos/seed/meta-${safeId}/400/500`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function sanitizeTsToken(token: string): string {
  return token.replace(/[':|&!()<>]/g, "").trim();
}

function buildTsQuery(value: string): string {
  const tokens = value
    .split(/\s+/)
    .map(sanitizeTsToken)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) return "";
  return tokens.join(" & ");
}

function mapRowsToSearchResults(rows: ScrapedAdRow[]): SearchResult[] {
  return rows.map((row, index) => {
    const id = row.external_id ?? `scraped-${index}`;
    const status: "active" | "inactive" = (row.status ?? "").toLowerCase() === "inactive" ? "inactive" : "active";
    const publishedAt = formatDateString(row.started_at ?? row.scraped_at);

    const imageUrls = (row.image_urls ?? []).filter(Boolean);
    const imageUrl = imageUrls[0] ?? row.image_url ?? buildFallbackImage(id);

    return {
      id,
      imageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : (row.image_url ? [row.image_url] : []),
      brandName: row.brand_name?.trim() || "Meta Advertiser",
      platform: normalizePlatform(row.platform),
      mediaType: normalizeMediaType(row.media_type),
      status,
      publishedAt,
      durationDays: row.duration_days ?? getDurationDays(row.started_at, row.ended_at, status),
      isSponsored: row.is_sponsored ?? true,
      copyText: row.copy_text?.trim() || "광고 문구를 불러오지 못했습니다.",
      fullCopyText: row.full_copy_text?.trim() || row.copy_text?.trim() || "",
      landingUrl: row.landing_url?.trim() || null,
      ctaText: row.cta_text?.trim() || null,
    };
  });
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getFeaturedAds(limit = 20): Promise<SearchResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 40));

  try {
    const supabase = await createClient();
    const selectColumns =
      "external_id, brand_name, copy_text, full_copy_text, image_url, image_urls, landing_url, cta_text, platform, media_type, status, started_at, ended_at, duration_days, is_sponsored, scraped_at";

    const { data, error } = await supabase
      .from("scraped_ads")
      .select(selectColumns)
      .eq("country", "KR")
      .order("scraped_at", { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) return [];

    return shuffleArray(mapRowsToSearchResults(data as ScrapedAdRow[])).slice(0, safeLimit);
  } catch {
    return [];
  }
}

export interface SearchOptions {
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  brandName?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

async function searchScrapedAds(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
  const { category, sort = "scraped_at", page = 1, limit = 24, brandName } = options;
  const trimmedQuery = query.trim();
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  const selectColumns =
    "external_id, brand_name, copy_text, full_copy_text, image_url, image_urls, landing_url, cta_text, platform, media_type, status, started_at, ended_at, duration_days, is_sponsored, scraped_at";

  let dbQuery = supabase
    .from("scraped_ads")
    .select(selectColumns, { count: "exact" })
    .eq("country", "KR");

  if (trimmedQuery) {
    const tsQuery = buildTsQuery(trimmedQuery);
    const ftsExpression = "to_tsvector('simple', coalesce(brand_name,'') || ' ' || coalesce(copy_text,''))";
    
    if (tsQuery) {
      dbQuery = dbQuery.filter(ftsExpression, "@@", `to_tsquery('simple', '${tsQuery}')`);
    } else {
      const ilikeQuery = escapeLike(trimmedQuery);
      dbQuery = dbQuery.or(`brand_name.ilike.%${ilikeQuery}%,copy_text.ilike.%${ilikeQuery}%`);
    }
  }

  if (category && category !== "전체") {
    dbQuery = dbQuery.contains("categories", [category]);
  }

  if (brandName) {
    dbQuery = dbQuery.eq("brand_name", brandName);
  }

  if (sort === "duration_days") {
    dbQuery = dbQuery.order("duration_days", { ascending: false, nullsFirst: false });
  } else if (sort === "brand_name") {
    dbQuery = dbQuery.order("brand_name", { ascending: true });
  } else {
    dbQuery = dbQuery.order("scraped_at", { ascending: false });
  }

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

  if (error || !data) return { results: [], totalCount: 0 };
  return { results: mapRowsToSearchResults(data as ScrapedAdRow[]), totalCount: count ?? 0 };
}



export async function searchAds(query: string, mode: "similarity" | "copywrite" = "similarity", options: SearchOptions = {}): Promise<SearchResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && query.trim()) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        query,
        mode,
      });
    }
  } catch {
    // Supabase not configured — skip history tracking
  }

  try {
    return await searchScrapedAds(query, options);
  } catch {
    return { results: [], totalCount: 0 };
  }
}

export interface DiscoverySection {
  title: string;
  emoji: string;
  category: string;
  ads: SearchResult[];
}

export interface DiscoveryData {
  trending: SearchResult[];
  sections: DiscoverySection[];
  recent: SearchResult[];
}

export async function getDiscoverySections(): Promise<DiscoveryData> {
  const categories = [
    { title: "뷰티 베스트", emoji: "💄", category: "뷰티" },
    { title: "건강식품 베스트", emoji: "💊", category: "건강식품" },
    { title: "패션 베스트", emoji: "👗", category: "패션" },
    { title: "테크/앱 베스트", emoji: "📱", category: "테크/앱" },
    { title: "헬스/운동 베스트", emoji: "💪", category: "헬스/운동" },
  ];

  try {
    const supabase = await createClient();
    const selectColumns =
      "external_id, brand_name, copy_text, full_copy_text, image_url, image_urls, landing_url, cta_text, platform, media_type, status, started_at, ended_at, duration_days, is_sponsored, scraped_at";

    // 1. Trending
    const { data: trendingData } = await supabase
      .from("scraped_ads")
      .select(selectColumns)
      .eq("country", "KR")
      .order("duration_days", { ascending: false, nullsFirst: false })
      .limit(10);

    // 2. Recent
    const { data: recentData } = await supabase
      .from("scraped_ads")
      .select(selectColumns)
      .eq("country", "KR")
      .order("scraped_at", { ascending: false })
      .limit(6);

    // 3. Categories
    const sections: DiscoverySection[] = [];
    for (const cat of categories) {
      const { data: catData } = await supabase
        .from("scraped_ads")
        .select(selectColumns)
        .eq("country", "KR")
        .contains("categories", [cat.category])
        .order("duration_days", { ascending: false, nullsFirst: false })
        .limit(8);

      sections.push({
        title: cat.title,
        emoji: cat.emoji,
        category: cat.category,
        ads: catData ? mapRowsToSearchResults(catData as ScrapedAdRow[]) : [],
      });
    }

    return {
      trending: trendingData ? mapRowsToSearchResults(trendingData as ScrapedAdRow[]) : [],
      sections,
      recent: recentData ? mapRowsToSearchResults(recentData as ScrapedAdRow[]) : [],
    };
  } catch {
    return {
      trending: [],
      sections: categories.map((cat) => ({
        title: cat.title,
        emoji: cat.emoji,
        category: cat.category,
        ads: [],
      })),
      recent: [],
    };
  }
}
