"use server";

import { createClient } from "@/utils/supabase/server";

interface SearchResult {
  id: string;
  imageUrl: string;
  brandName: string;
  platform: "meta" | "instagram" | "google" | "tiktok";
  mediaType: "photo" | "video" | "reels" | "carousel";
  status: "active" | "inactive";
  publishedAt: string;
  durationDays: number;
  isSponsored: boolean;
  copyText: string;
}

interface ScrapedAdRow {
  external_id: string | null;
  brand_name: string | null;
  copy_text: string | null;
  image_url: string | null;
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

    return {
      id,
      imageUrl: row.image_url ?? buildFallbackImage(id),
      brandName: row.brand_name?.trim() || "Meta Advertiser",
      platform: normalizePlatform(row.platform),
      mediaType: normalizeMediaType(row.media_type),
      status,
      publishedAt,
      durationDays: row.duration_days ?? getDurationDays(row.started_at, row.ended_at, status),
      isSponsored: row.is_sponsored ?? true,
      copyText: row.copy_text?.trim() || "광고 문구를 불러오지 못했습니다.",
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
      "external_id, brand_name, copy_text, image_url, platform, media_type, status, started_at, ended_at, duration_days, is_sponsored, scraped_at";

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

async function searchScrapedAds(query: string): Promise<SearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const supabase = await createClient();
  const selectColumns =
    "external_id, brand_name, copy_text, image_url, platform, media_type, status, started_at, ended_at, duration_days, is_sponsored, scraped_at";

  const tsQuery = buildTsQuery(trimmedQuery);
  const ftsExpression = "to_tsvector('simple', coalesce(brand_name,'') || ' ' || coalesce(copy_text,''))";

  if (tsQuery) {
    const { data, error } = await supabase
      .from("scraped_ads")
      .select(selectColumns)
      .eq("country", "KR")
      .filter(ftsExpression, "@@", `to_tsquery('simple', '${tsQuery}')`)
      .order("scraped_at", { ascending: false })
      .limit(40);

    if (!error && data && data.length > 0) {
      return mapRowsToSearchResults(data as ScrapedAdRow[]);
    }
  }

  const ilikeQuery = escapeLike(trimmedQuery);
  const { data, error } = await supabase
    .from("scraped_ads")
    .select(selectColumns)
    .eq("country", "KR")
    .or(`brand_name.ilike.%${ilikeQuery}%,copy_text.ilike.%${ilikeQuery}%`)
    .order("scraped_at", { ascending: false })
    .limit(40);

  if (error || !data || data.length === 0) return [];
  return mapRowsToSearchResults(data as ScrapedAdRow[]);
}

function generateMockResults(query: string): SearchResult[] {
  const platforms = ["meta", "instagram", "google", "tiktok"] as const;
  const mediaTypes = ["photo", "video", "reels", "carousel"] as const;
  const brands = [
    "올리브영", "무신사", "29CM", "마켓컬리", "토스",
    "당근마켓", "배달의민족", "야놀자", "카카오", "네이버",
    "쿠팡", "Snipit", "뷔 fwee", "번개장터", "크림",
    "오늘의집", "에이블리", "지그재그", "W컨셉", "SSG",
  ];
  const copies = [
    "지금 시작하면 50% 할인",
    "이 광고를 보고 있다면 당신도 이미 알고 있을 거예요",
    "3일만에 완판된 비밀",
    "마케터가 숨기고 싶은 레퍼런스",
    "지금 바로 확인하세요",
    "한정 수량 특별 프로모션",
    "당신만을 위한 맞춤 추천",
    "올 시즌 가장 핫한 아이템",
    "무료배송 + 추가 할인 쿠폰",
    "인플루언서들이 먼저 찾는 이유",
  ];

  const seed = query.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 20;
  const results: SearchResult[] = [];

  for (let i = 0; i < count; i++) {
    const s = seed + i;
    const picId = (s * 7 + 10) % 200 + 10;
    results.push({
      id: `mock-search-${s}-${i}`,
      imageUrl: `https://picsum.photos/id/${picId}/400/500`,
      brandName: brands[s % brands.length],
      platform: platforms[s % platforms.length],
      mediaType: mediaTypes[s % mediaTypes.length],
      status: s % 3 === 0 ? "inactive" : "active",
      publishedAt: `2026.${String((s % 3) + 1).padStart(2, "0")}.${String((s % 28) + 1).padStart(2, "0")}`,
      durationDays: (s % 60) + 1,
      isSponsored: s % 5 === 0,
      copyText: copies[s % copies.length],
    });
  }
  return results;
}

export async function searchAds(query: string, mode: "similarity" | "copywrite" = "similarity"): Promise<SearchResult[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
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
    const dbResults = await searchScrapedAds(query);
    if (dbResults.length > 0) return dbResults;
  } catch {
    // Ignore DB search failures and use final mock fallback.
  }

  return generateMockResults(query);
}
