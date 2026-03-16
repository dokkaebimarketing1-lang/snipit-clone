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

type JsonRecord = Record<string, unknown>;

interface MetaScrapeContext {
  lsd: string;
  spinRev: string;
  spinT: string;
  spinB: string;
  hsi: string;
  dyn: string;
  csr: string;
  hs: string;
  docId: string;
}

const META_AD_LIBRARY_ENABLED =
  process.env.META_AD_LIBRARY_ENABLED === "1" ||
  process.env.META_AD_LIBRARY_ENABLED?.toLowerCase() === "true";

const META_DOC_ID_FALLBACK = "25464068859919530";
const META_REV_FALLBACK = "1033837939";
const META_DYN_FALLBACK =
  "7xeUmwlECdwn8K2Wmh0no6u5U4e1Fx-ewSAwHwNw9G2S2q0_EtxG4o0B-qbwgE1EEb87C1xwEwgo9oO0n24oaEd86a3a1YwBgao6C0Mo6i588Etw8WfK1LwPxe2GewbCXwJwmE2eUlwhE2Lw6OyES0gq0K-1LwqobU3Cwr86C1nwf6Eb87u1rwGwto461ww";
const META_CSR_FALLBACK =
  "gjSxK8GXhkbjAmy4j8gBkiHG8FVCIJBHjpXUrByK5HxuquEyUK5Emz8Oaw9G3S5UoyUK588E4a2W0C8eEcE4S2m12wg8O1fwau1IwiEow9qE5S3KUK320g-1fDw49w2v80PS07XU0ptw2Ao05Ey02zC0aFw0hIQ00BPo06XK6k00CSo072W09xw4jw";
const META_CACHE_TTL_MS = 5 * 60 * 1000;
const META_RATE_LIMIT_INTERVAL_MS = 1250;
const META_BACKOFF_MS = 60 * 1000;
const META_RESULT_LIMIT = 20;
const META_SNAPSHOT_IMAGE_LOOKUPS = 6;

const metaSearchCache = new Map<string, { expiresAt: number; results: SearchResult[] }>();

let lastMetaRequestAt = 0;
let metaBackoffUntil = 0;
let metaRequestCounter = 0;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asRecordArray(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map(asRecord).filter((item): item is JsonRecord => item !== null);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function decodeFacebookEscapes(value: string): string {
  return value
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\u0025/g, "%")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
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

function resolvePlatform(publisherPlatforms: string[]): "meta" | "instagram" | "google" | "tiktok" {
  const normalized = publisherPlatforms.map((item) => item.toUpperCase());
  if (normalized.some((item) => item.includes("INSTAGRAM"))) return "instagram";
  if (normalized.some((item) => item.includes("FACEBOOK") || item.includes("MESSENGER") || item.includes("AUDIENCE_NETWORK"))) {
    return "meta";
  }
  if (normalized.some((item) => item.includes("GOOGLE"))) return "google";
  if (normalized.some((item) => item.includes("TIKTOK"))) return "tiktok";
  return "meta";
}

function resolveMediaType(ad: JsonRecord): "photo" | "video" | "reels" | "carousel" {
  const hasVideos = asRecordArray(ad.videos).length > 0 || asRecordArray(ad.video_data).length > 0;
  const imageCount = asRecordArray(ad.images).length;
  const cardCount = asRecordArray(ad.cards).length;
  const adText = `${asString(ad.ad_creative_link_title) ?? ""} ${asString(ad.caption) ?? ""}`.toLowerCase();
  if (cardCount > 1 || imageCount > 1) return "carousel";
  if (adText.includes("reels")) return "reels";
  if (hasVideos) return "video";
  return "photo";
}

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function buildFallbackImage(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `https://picsum.photos/seed/meta-${safeId}/400/500`;
}

function extractImageCandidate(ad: JsonRecord): string | null {
  const directKeys = ["image_url", "imageUrl", "thumbnail_url", "thumbnailUrl"];
  for (const key of directKeys) {
    const value = asString(ad[key]);
    if (value) return decodeFacebookEscapes(value);
  }

  const fromNested = ["images", "videos", "cards", "carousel_cards"];
  for (const key of fromNested) {
    for (const item of asRecordArray(ad[key])) {
      const nested = ["resized_image_url", "original_image_url", "image_url", "thumbnail_image_url", "url", "uri"];
      for (const nestedKey of nested) {
        const value = asString(item[nestedKey]);
        if (value) return decodeFacebookEscapes(value);
      }
    }
  }

  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithMetaRateLimit(input: string, init: RequestInit): Promise<Response> {
  const now = Date.now();
  if (metaBackoffUntil > now) {
    throw new Error("META_AD_LIBRARY_BACKOFF");
  }

  const waitMs = META_RATE_LIMIT_INTERVAL_MS - (now - lastMetaRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastMetaRequestAt = Date.now();
  const response = await fetch(input, init);
  if (response.status === 403 || response.status === 429) {
    metaBackoffUntil = Date.now() + META_BACKOFF_MS;
  }
  return response;
}

function extractFirstMatch(source: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractMetaScrapeContext(html: string): MetaScrapeContext {
  const lsd = extractFirstMatch(html, [
    /"LSD",\[\],\{"token":"([^"]+)"\}/,
    /\["LSD",\[\],\{"token":"([^"]+)"/,
    /"lsd":"([^"]+)"/,
    /name="lsd" value="([^"]+)"/,
  ]) ?? "";

  const docId =
    extractFirstMatch(html, [
      /"(?:name|operationName)"\s*:\s*"AdLibrarySearchPaginationQuery"[^}]{0,220}"(?:queryID|id|doc_id)"\s*:\s*"(\d{10,20})"/,
      /__d\("AdLibrarySearchPaginationQuery[^\"]*"[^)]*\).*?["'](\d{10,20})["']/,
      /"AdLibrarySearchPaginationQuery"[^\n]{0,600}"(\d{10,20})"/,
    ]) ?? META_DOC_ID_FALLBACK;

  const spinRev = extractFirstMatch(html, [
    /"__spin_r":(\d+)/,
    /"server_revision":(\d+)/,
    /"revision":(\d+)/,
  ]) ?? META_REV_FALLBACK;

  const spinT = extractFirstMatch(html, [/"__spin_t":(\d+)/]) ?? String(Math.floor(Date.now() / 1000));
  const spinB = extractFirstMatch(html, [/"__spin_b":"([^"]+)"/]) ?? "trunk";
  const hsi = extractFirstMatch(html, [/"__hsi":"(\d+)"/, /"hsi":"(\d+)"/]) ?? String(Date.now());
  const dyn = extractFirstMatch(html, [/"__dyn":"([^"]+)"/]) ?? META_DYN_FALLBACK;
  const csr = extractFirstMatch(html, [/"__csr":"([^"]+)"/]) ?? META_CSR_FALLBACK;
  const hs = extractFirstMatch(html, [/"__hs":"([^"]+)"/]) ?? "20476.HYP:comet_plat_default_pkg.2.1...0";

  return { lsd, spinRev, spinT, spinB, hsi, dyn, csr, hs, docId };
}

function encodeRequestCounter(counter: number): string {
  if (counter < 10) return String(counter);
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let value = counter;
  let result = "";
  while (value > 0) {
    result = `${chars[value % 36]}${result}`;
    value = Math.floor(value / 36);
  }
  return result;
}

function calculateJazoest(lsd: string): string {
  if (!lsd) return "2893";
  const total = lsd.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return String(total + 2);
}

function parseGraphQlAds(responseJson: unknown): JsonRecord[] {
  const root = asRecord(responseJson);
  if (!root) return [];

  const data = asRecord(root.data);
  if (!data) return [];

  const adLibraryMain = asRecord(data.ad_library_main) ?? asRecord(data.adLibraryMain) ?? data;
  const connection =
    asRecord(adLibraryMain.search_results_connection) ??
    asRecord(adLibraryMain.searchResultsConnection) ??
    adLibraryMain;

  const edges = asRecordArray(connection.edges);
  const ads: JsonRecord[] = [];

  for (const edge of edges) {
    const node = asRecord(edge.node) ?? edge;
    const collated = asRecordArray(node.collated_results);
    if (collated.length > 0) {
      for (const item of collated) {
        const snapshot = asRecord(item.snapshot);
        if (snapshot) {
          ads.push({ ...snapshot, ...item });
        } else {
          ads.push(item);
        }
      }
      continue;
    }
    ads.push(node);
  }

  return ads;
}

function parseAdsFromHtmlFallback(html: string): JsonRecord[] {
  const ads: JsonRecord[] = [];
  const pattern = /"ad_archive_id":"(\d+)"[\s\S]{0,6000}?"ad_snapshot_url":"([^"]+)"[\s\S]{0,2500}?"page_name":"([^"]+)"/g;
  let match = pattern.exec(html);

  while (match) {
    const adArchiveId = decodeFacebookEscapes(match[1]);
    const adSnapshotUrl = decodeFacebookEscapes(match[2]);
    const pageName = decodeFacebookEscapes(match[3]);

    const snippetStart = Math.max(0, match.index - 200);
    const snippetEnd = Math.min(html.length, match.index + 7000);
    const snippet = html.slice(snippetStart, snippetEnd);

    const bodyMatch = snippet.match(/"ad_creative_bodies":\[(.*?)\]/);
    const startMatch = snippet.match(/"ad_delivery_start_time":(\d+)/);
    const stopMatch = snippet.match(/"ad_delivery_stop_time":(\d+)/);

    const ad: JsonRecord = {
      ad_archive_id: adArchiveId,
      ad_snapshot_url: adSnapshotUrl,
      page_name: pageName,
      ad_creative_bodies: bodyMatch ? [decodeFacebookEscapes(bodyMatch[1].replace(/^"|"$/g, ""))] : [],
      ad_delivery_start_time: startMatch?.[1],
      ad_delivery_stop_time: stopMatch?.[1],
      publisher_platforms: ["FACEBOOK"],
    };

    ads.push(ad);
    match = pattern.exec(html);
  }

  return ads;
}

async function extractImageFromSnapshot(snapshotUrl: string): Promise<string | null> {
  try {
    const res = await fetchWithMetaRateLimit(snapshotUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const ogImage = extractFirstMatch(html, [
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:image"/i,
    ]);
    return ogImage ? decodeFacebookEscapes(ogImage) : null;
  } catch {
    return null;
  }
}

async function mapMetaAdsToSearchResults(metaAds: JsonRecord[]): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  let snapshotLookups = 0;

  for (const ad of metaAds) {
    const idCandidate =
      asString(ad.ad_archive_id) ??
      asString(ad.archive_id) ??
      asString(ad.id) ??
      `meta-${results.length}`;

    const adSnapshotUrl = asString(ad.ad_snapshot_url) ?? asString(ad.snapshot_url);

    const pageName =
      asString(ad.page_name) ??
      asString(ad.pageName) ??
      asString(ad.advertiser_name) ??
      "Meta Advertiser";

    const creativeBodies = pickStringArray(ad.ad_creative_bodies);
    const fallbackBody =
      asString(ad.ad_creative_body) ??
      asString(ad.body) ??
      asString(ad.message) ??
      asString(ad.caption) ??
      "광고 문구를 불러오지 못했습니다.";
    const copyText = decodeFacebookEscapes(creativeBodies[0] ?? fallbackBody);

    const publisherPlatforms = pickStringArray(ad.publisher_platforms);
    const platform = resolvePlatform(publisherPlatforms);
    const mediaType = resolveMediaType(ad);

    const startTimestamp = asNumber(ad.ad_delivery_start_time);
    const stopTimestamp = asNumber(ad.ad_delivery_stop_time);
    const startDateString =
      startTimestamp !== null
        ? new Date(startTimestamp * 1000).toISOString()
        : asString(ad.start_date) ?? asString(ad.startDate) ?? asString(ad.ad_creation_time);
    const stopDateString =
      stopTimestamp !== null
        ? new Date(stopTimestamp * 1000).toISOString()
        : asString(ad.stop_date) ?? asString(ad.stopDate) ?? asString(ad.ad_delivery_end_time);

    const status: "active" | "inactive" = stopDateString ? "inactive" : "active";
    const publishedAt = formatDateString(startDateString);
    const durationDays = getDurationDays(startDateString, stopDateString, status);

    let imageUrl = extractImageCandidate(ad);
    if (!imageUrl && adSnapshotUrl && snapshotLookups < META_SNAPSHOT_IMAGE_LOOKUPS) {
      snapshotLookups += 1;
      imageUrl = await extractImageFromSnapshot(adSnapshotUrl);
    }

    results.push({
      id: idCandidate,
      imageUrl: imageUrl ?? buildFallbackImage(idCandidate),
      brandName: decodeFacebookEscapes(pageName),
      platform,
      mediaType,
      status,
      publishedAt,
      durationDays,
      isSponsored: true,
      copyText,
    });

    if (results.length >= META_RESULT_LIMIT) break;
  }

  return results;
}

async function fetchMetaAdsLibraryResults(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const cacheKey = `kr:${normalizedQuery}`;
  const cacheHit = metaSearchCache.get(cacheKey);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return cacheHit.results;
  }

  const adLibraryUrl = new URL("https://www.facebook.com/ads/library/");
  adLibraryUrl.searchParams.set("active_status", "all");
  adLibraryUrl.searchParams.set("ad_type", "all");
  adLibraryUrl.searchParams.set("country", "KR");
  adLibraryUrl.searchParams.set("q", query);
  adLibraryUrl.searchParams.set("search_type", "keyword_unordered");

  const browserHeaders: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: "https://www.facebook.com/ads/library/",
  };

  const pageResponse = await fetchWithMetaRateLimit(adLibraryUrl.toString(), {
    headers: browserHeaders,
    redirect: "follow",
    next: { revalidate: 300 },
  });

  if (!pageResponse.ok) {
    throw new Error(`META_AD_LIBRARY_PAGE_${pageResponse.status}`);
  }

  const html = await pageResponse.text();
  const context = extractMetaScrapeContext(html);

  let adRecords: JsonRecord[] = [];

  if (context.lsd) {
    metaRequestCounter += 1;

    const variables = {
      activeStatus: "ALL",
      adType: "ALL",
      bylines: [],
      collationToken: `ads-${Date.now()}-${metaRequestCounter.toString(36)}`,
      contentLanguages: [],
      countries: ["KR"],
      excludedIDs: [],
      first: META_RESULT_LIMIT,
      isTargetedCountry: false,
      location: null,
      mediaType: "ALL",
      multiCountryFilterMode: null,
      pageIDs: [],
      potentialReachInput: [],
      publisherPlatforms: [],
      queryString: query,
      regions: [],
      searchType: "KEYWORD_UNORDERED",
      sessionID: `session-${Date.now().toString(36)}`,
      source: null,
      startDate: null,
      viewAllPageID: "0",
    };

    const payload = new URLSearchParams({
      av: "0",
      __aaid: "0",
      __user: "0",
      __a: "1",
      __req: encodeRequestCounter(metaRequestCounter),
      __hs: context.hs,
      dpr: "1",
      __ccg: "GOOD",
      __rev: context.spinRev,
      __s: Date.now().toString(36).slice(-6),
      __hsi: context.hsi,
      __comet_req: "94",
      lsd: context.lsd,
      jazoest: calculateJazoest(context.lsd),
      __spin_r: context.spinRev,
      __spin_b: context.spinB,
      __spin_t: context.spinT,
      __jssesw: "1",
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "AdLibrarySearchPaginationQuery",
      server_timestamps: "true",
      variables: JSON.stringify(variables),
      doc_id: context.docId,
      __dyn: context.dyn,
      __csr: context.csr,
    });

    const graphqlResponse = await fetchWithMetaRateLimit("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        ...browserHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://www.facebook.com",
        Referer: adLibraryUrl.toString(),
        "x-fb-friendly-name": "AdLibrarySearchPaginationQuery",
        "x-fb-lsd": context.lsd,
      },
      body: payload.toString(),
      next: { revalidate: 300 },
    });

    if (graphqlResponse.ok) {
      const graphqlText = await graphqlResponse.text();
      const normalized = graphqlText.startsWith("for (;;);") ? graphqlText.slice(9) : graphqlText;
      try {
        const json = JSON.parse(normalized) as unknown;
        adRecords = parseGraphQlAds(json);
      } catch {
        adRecords = [];
      }
    }
  }

  if (adRecords.length === 0) {
    adRecords = parseAdsFromHtmlFallback(html);
  }

  const results = await mapMetaAdsToSearchResults(adRecords);
  if (results.length > 0) {
    metaSearchCache.set(cacheKey, {
      expiresAt: Date.now() + META_CACHE_TTL_MS,
      results,
    });
  }

  return results;
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
  // Track search history if user is authenticated
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

  if (!META_AD_LIBRARY_ENABLED) {
    return generateMockResults(query);
  }

  try {
    const results = await fetchMetaAdsLibraryResults(query);
    if (results.length > 0) return results;
    return generateMockResults(query);
  } catch {
    return generateMockResults(query);
  }
}
