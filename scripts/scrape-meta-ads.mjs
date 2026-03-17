import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerVanilla from "puppeteer";

puppeteerExtra.use(StealthPlugin());

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
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Wait for ads to render (Meta Ad Library uses heavy JS rendering)
  await sleep(8000);
  await dismissCookiePopup(page);

  // Debug: check if page has ad content
  const debugCount = await page.evaluate(() => {
    const text = document.body.innerText || "";
    return (text.match(/라이브러리 ID:/g) || []).length;
  });
  console.log(`[crawl] ${keyword} | page loaded, ${debugCount} ads visible in DOM`);

  const collected = new Map();
  let roundsWithoutNewAds = 0;

  for (let round = 1; round <= MAX_SCROLL_ROUNDS; round += 1) {
    const adsOnPage = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Extract all library IDs from page text
      const idMatches = [...bodyText.matchAll(/라이브러리 ID:\s*(\d+)/g)];
      if (idMatches.length === 0) return [];

      // Split body text into ad blocks using library ID as delimiter
      const blocks = bodyText.split(/(?=라이브러리 ID:)/);
      const output = [];

      // Collect all ad images (scontent URLs)
      const adImages = Array.from(document.querySelectorAll('img'))
        .filter(i => i.src && i.src.includes('scontent') && i.naturalWidth > 50)
        .map(i => i.src);

      let imgIndex = 0;

      for (const block of blocks) {
        const idMatch = block.match(/라이브러리 ID:\s*(\d+)/);
        if (!idMatch) continue;

        const externalId = idMatch[1];
        const snapshotUrl = `https://www.facebook.com/ads/library/?id=${externalId}`;

        // Extract date
        const dateMatch = block.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
        const startedText = dateMatch ? dateMatch[0] : null;

        // Extract status
        const isActive = /활성|Active/i.test(block) && !/비활성|Inactive/i.test(block);

        // Extract brand name — look for text after "광고 상세 정보 보기"
        let brandName = "";
        const afterDetail = block.split(/광고 상세 정보 보기/);
        if (afterDetail.length > 1) {
          const lines = afterDetail[1].split('\n').map(l => l.trim()).filter(Boolean);
          brandName = lines[0] || "";
        }
        if (!brandName) {
          // Fallback: find first short line that looks like a brand
          const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 1 && l.length < 40 && !l.includes('라이브러리') && !l.includes('플랫폼') && !l.includes('게재'));
          brandName = lines[0] || "";
        }

        // Extract copy text — look for longer text blocks
        const textLines = block.split('\n').map(l => l.trim()).filter(l => l.length > 20 && !l.includes('라이브러리 ID') && !l.includes('플랫폼') && !l.includes('게재 시작'));
        const copyText = textLines.slice(0, 3).join(' ');

        // Check for video/carousel hints
        const hasVideo = /동영상|video/i.test(block);
        const hasMultipleImages = /슬라이드|carousel/i.test(block);

        // Platform detection
        const platformText = block;

        // Assign image from collected images
        const imageUrl = adImages[imgIndex] || null;
        imgIndex += 1;

        output.push({
          snapshotUrl,
          brandName,
          copyText,
          imageUrl,
          hasVideo,
          hasMultipleImages,
          statusText: isActive ? 'Active' : 'Inactive',
          startedText,
          platformText,
          externalId,
        });
      }

      return output;
    });

    let newCount = 0;
    for (const ad of adsOnPage) {
      const externalId = ad.externalId || extractExternalId(ad.snapshotUrl);
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

function parseCliArgs() {
  const raw = process.argv.slice(2);
  const flags = { connect: false, headful: false, port: 9222 };
  const keywords = [];

  for (const arg of raw) {
    if (arg === "--connect") { flags.connect = true; continue; }
    if (arg === "--headful") { flags.headful = true; continue; }
    if (arg.startsWith("--port=")) { flags.port = Number(arg.split("=")[1]) || 9222; continue; }
    if (arg.trim()) keywords.push(arg.trim());
  }

  return { flags, keywords: keywords.length > 0 ? keywords : DEFAULT_KEYWORDS };
}

async function run() {
  console.log("[start] Meta Ad Library crawler");

  await loadEnvFromFile();
  const supabase = createSupabaseAdminClient();
  const { flags, keywords } = parseCliArgs();

  let browser;
  let isConnected = false;

  if (flags.connect) {
    // Connect to user's real Chrome browser — use vanilla puppeteer (no stealth needed for real Chrome)
    const debugUrl = `http://127.0.0.1:${flags.port}`;
    console.log(`[browser] Connecting to your Chrome at ${debugUrl}...`);
    console.log(`[browser] Make sure Chrome is running with: --remote-debugging-port=${flags.port}`);
    try {
      browser = await puppeteerVanilla.connect({ browserURL: debugUrl, defaultViewport: null });
      isConnected = true;
      console.log("[browser] Connected to your real Chrome! (vanilla puppeteer, no stealth)");
    } catch (err) {
      console.error(`[browser] Could not connect: ${err.message}`);
      console.error(`\n[help] Run this first in a NEW terminal:`);
      console.error(`  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${flags.port}`);
      console.error(`  (or: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${flags.port})\n`);
      process.exitCode = 1;
      return;
    }
  } else {
    // Launch a new browser with stealth (headless by default)
    browser = await puppeteerExtra.launch({
      headless: !flags.headful,
      defaultViewport: { width: 1440, height: 1800 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const page = isConnected
    ? await browser.newPage()
    : await browser.newPage();

  if (!isConnected) {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    );
  }
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
    if (isConnected) {
      // Don't close user's browser — just close the tab we opened
      try { await page.close(); } catch { /* tab may already be closed */ }
      browser.disconnect();
      console.log("[browser] Disconnected from your Chrome (browser stays open)");
    } else {
      await browser.close();
    }
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
