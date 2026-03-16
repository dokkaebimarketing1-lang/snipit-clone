import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const DEFAULT_KEYWORDS = [
  "올리브영",
  "무신사",
  "마켓컬리",
  "배달의민족",
  "토스",
  "당근마켓",
  "화장품",
  "패션",
  "맛집",
  "여행",
  "카카오",
  "네이버",
  "쿠팡",
  "삼성",
  "LG",
];

const COUNTRY = "KR";
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;
const MAX_SCROLL_ROUNDS = Number(process.env.META_SCRAPER_SCROLL_ROUNDS ?? 8);
const MAX_ADS_PER_KEYWORD = Number(process.env.META_SCRAPER_MAX_ADS_PER_KEYWORD ?? 40);
const UPSERT_BATCH_SIZE = 100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function randomDelay(min = MIN_DELAY_MS, max = MAX_DELAY_MS) {
  await sleep(randomInt(min, max));
}

function parseDotenv(contents) {
  const parsed = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }
  return parsed;
}

async function loadEnvFromFile() {
  const envLocalPath = path.join(projectRoot, ".env.local");
  try {
    const envText = await fs.readFile(envLocalPath, "utf8");
    const parsed = parseDotenv(envText);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
    console.log(`[env] Loaded .env.local from ${envLocalPath}`);
  } catch (error) {
    console.log(`[env] .env.local not found or unreadable: ${error.message}`);
  }
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function parseDateText(rawText) {
  if (!rawText) return null;

  const text = rawText.replace(/\s+/g, " ").trim();
  const ymd = text.match(/(\d{4})[./-]\s*(\d{1,2})[./-]\s*(\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }

  const monthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDay) {
    const now = new Date();
    const [, m, d] = monthDay;
    const dt = new Date(Date.UTC(now.getUTCFullYear(), Number(m) - 1, Number(d)));
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }

  const englishDate = text.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (englishDate) {
    const [, monthWord, day, year] = englishDate;
    const dt = new Date(`${monthWord} ${day}, ${year} UTC`);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }

  return null;
}

function deriveDurationDays(startedAt, endedAt, status) {
  if (!startedAt) return 1;
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : status === "active" ? new Date() : null;
  if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffMs / 86_400_000));
}

function normalizePlatform(platformText) {
  const normalized = (platformText ?? "").toLowerCase();

  if (normalized.includes("instagram") || normalized.includes("인스타")) return "instagram";
  if (normalized.includes("facebook") || normalized.includes("페이스북")) return "facebook";
  if (normalized.includes("messenger") || normalized.includes("audience network")) return "facebook";
  return "facebook";
}

function normalizeMediaType(mediaHint) {
  const normalized = (mediaHint ?? "").toLowerCase();
  if (normalized.includes("video") || normalized.includes("동영상")) return "video";
  if (normalized.includes("carousel") || normalized.includes("슬라이드")) return "carousel";
  if (normalized.includes("reel") || normalized.includes("릴스")) return "reels";
  return "photo";
}

function sanitizeText(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

async function dismissCookiePopup(page) {
  const candidates = [
    'button[aria-label="Allow all cookies"]',
    'button[title="Allow all cookies"]',
    'button[aria-label="모든 쿠키 허용"]',
    'button:has-text("Allow all cookies")',
  ];

  for (const selector of candidates) {
    try {
      const found = await page.$(selector);
      if (found) {
        await found.click();
        await sleep(500);
        return;
      }
    } catch {
      // ignore cookie popup issues
    }
  }
}

function extractExternalId(snapshotUrl) {
  if (!snapshotUrl) return null;
  try {
    const url = new URL(snapshotUrl, "https://www.facebook.com");
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}

async function scrapeAdsForKeyword(page, keyword) {
  const url = new URL("https://www.facebook.com/ads/library/");
  url.searchParams.set("active_status", "all");
  url.searchParams.set("ad_type", "all");
  url.searchParams.set("country", COUNTRY);
  url.searchParams.set("q", keyword);
  url.searchParams.set("search_type", "keyword_unordered");

  console.log(`\n[crawl] Keyword: ${keyword}`);
  console.log(`[crawl] Open: ${url.toString()}`);

  await page.goto(url.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await randomDelay();
  await dismissCookiePopup(page);

  const collected = new Map();
  let roundsWithoutNewAds = 0;

  for (let round = 1; round <= MAX_SCROLL_ROUNDS; round += 1) {
    const adsOnPage = await page.evaluate(() => {
      const toAbsolute = (href) => {
        if (!href) return null;
        try {
          return new URL(href, "https://www.facebook.com").toString();
        } catch {
          return null;
        }
      };

      const findSnapshotLink = (root) => {
        const links = Array.from(root.querySelectorAll('a[href*="/ads/library/?id="]'));
        return links.length > 0 ? links[0] : null;
      };

      const cards = Array.from(document.querySelectorAll('div[role="article"], div.xrvj5dj'));
      const output = [];

      for (const card of cards) {
        const snapshotAnchor = findSnapshotLink(card);
        if (!snapshotAnchor) continue;

        const snapshotUrl = toAbsolute(snapshotAnchor.getAttribute("href"));
        if (!snapshotUrl) continue;

        const brandCandidate =
          card.querySelector("h3")?.textContent ||
          card.querySelector('strong[dir="auto"]')?.textContent ||
          card.querySelector('span[dir="auto"]')?.textContent ||
          "";

        const textBlocks = Array.from(card.querySelectorAll('div[dir="auto"], span[dir="auto"]'))
          .map((el) => (el.textContent ?? "").trim())
          .filter(Boolean);

        const cardText = card.textContent ?? "";

        const imageEl = card.querySelector("img");
        const videoEl = card.querySelector("video");

        const hasMultipleImages = card.querySelectorAll("img").length > 1;

        const statusTextMatch = cardText.match(/(활성|비활성|Active|Inactive)/i);
        const startedTextMatch = cardText.match(
          /(시작일|광고 시작일|Started running on|Started)\s*[:：]?\s*([^\n]+)/i,
        );

        output.push({
          snapshotUrl,
          brandName: brandCandidate,
          copyText: textBlocks.slice(0, 10).join(" "),
          imageUrl: imageEl?.src ?? null,
          hasVideo: Boolean(videoEl),
          hasMultipleImages,
          statusText: statusTextMatch?.[0] ?? null,
          startedText: startedTextMatch?.[2] ?? startedTextMatch?.[0] ?? null,
          platformText: cardText,
        });
      }

      return output;
    });

    let newCount = 0;
    for (const ad of adsOnPage) {
      const externalId = extractExternalId(ad.snapshotUrl);
      if (!externalId) continue;
      if (collected.has(externalId)) continue;
      collected.set(externalId, { ...ad, externalId, keyword });
      newCount += 1;
      if (collected.size >= MAX_ADS_PER_KEYWORD) break;
    }

    console.log(`[crawl] ${keyword} | round ${round}/${MAX_SCROLL_ROUNDS} | +${newCount} | total ${collected.size}`);

    if (collected.size >= MAX_ADS_PER_KEYWORD) break;

    if (newCount === 0) {
      roundsWithoutNewAds += 1;
      if (roundsWithoutNewAds >= 2) {
        console.log(`[crawl] ${keyword} | stop scrolling (no new ads)`);
        break;
      }
    } else {
      roundsWithoutNewAds = 0;
    }

    await page.evaluate(() => {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    });
    await randomDelay();
  }

  return Array.from(collected.values());
}

function mapToScrapedAdsRow(rawAd) {
  const status = /inactive|비활성/i.test(rawAd.statusText ?? "") ? "inactive" : "active";
  const startedAt = parseDateText(rawAd.startedText);
  const endedAt = status === "inactive" ? null : null;

  const mediaHint = rawAd.hasVideo ? "video" : rawAd.hasMultipleImages ? "carousel" : "photo";

  return {
    external_id: rawAd.externalId,
    source: "meta_ad_library",
    brand_name: sanitizeText(rawAd.brandName) || "Unknown Advertiser",
    page_id: null,
    copy_text: sanitizeText(rawAd.copyText),
    image_url: rawAd.imageUrl,
    video_url: null,
    snapshot_url: rawAd.snapshotUrl,
    platform: normalizePlatform(rawAd.platformText),
    media_type: normalizeMediaType(mediaHint),
    status,
    country: COUNTRY,
    started_at: startedAt,
    ended_at: endedAt,
    duration_days: deriveDurationDays(startedAt, endedAt, status),
    is_sponsored: true,
    categories: [rawAd.keyword],
    metadata: {
      keyword: rawAd.keyword,
      raw_started_text: rawAd.startedText,
      raw_status_text: rawAd.statusText,
      scraped_with: "puppeteer-extra-stealth",
    },
    scraped_at: new Date().toISOString(),
  };
}

async function upsertAds(supabase, rows) {
  if (rows.length === 0) return 0;

  const batches = chunkArray(rows, UPSERT_BATCH_SIZE);
  let total = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    const { error } = await supabase
      .from("scraped_ads")
      .upsert(batch, { onConflict: "external_id", ignoreDuplicates: false });

    if (error) {
      throw new Error(`Supabase upsert failed at batch ${i + 1}: ${error.message}`);
    }

    total += batch.length;
    console.log(`[db] Upserted batch ${i + 1}/${batches.length} (${batch.length} rows)`);
  }

  return total;
}

function getKeywordsFromArgs() {
  const args = process.argv.slice(2).map((item) => item.trim()).filter(Boolean);
  return args.length > 0 ? args : DEFAULT_KEYWORDS;
}

async function run() {
  console.log("[start] Meta Ad Library crawler");

  await loadEnvFromFile();
  const supabase = createSupabaseAdminClient();
  const keywords = getKeywordsFromArgs();

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 1800 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  );
  await page.setExtraHTTPHeaders({
    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  });

  const allAds = [];

  try {
    for (const keyword of keywords) {
      try {
        const ads = await scrapeAdsForKeyword(page, keyword);
        allAds.push(...ads);
        console.log(`[crawl] ${keyword} done: ${ads.length} ads`);
      } catch (error) {
        console.log(`[crawl] ${keyword} failed: ${error.message}`);
      }
      await randomDelay();
    }
  } finally {
    await browser.close();
  }

  const dedupedRows = [];
  const seen = new Set();

  for (const ad of allAds) {
    if (!ad.externalId || seen.has(ad.externalId)) continue;
    seen.add(ad.externalId);
    dedupedRows.push(mapToScrapedAdsRow(ad));
  }

  console.log(`[result] crawled=${allAds.length}, unique=${dedupedRows.length}`);

  if (dedupedRows.length === 0) {
    console.log("[result] No ads found, nothing to upsert.");
    return;
  }

  const upsertedCount = await upsertAds(supabase, dedupedRows);
  console.log(`[done] Upsert complete: ${upsertedCount} rows processed`);
}

run().catch((error) => {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
});
