import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
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

function isFacebookCdnImageUrl(url) {
  if (!url) return false;
  return /https?:\/\/scontent[^/]*\.fbcdn\.net\//i.test(url)
    || (url.includes("scontent") && url.includes("fbcdn.net"));
}

function normalizeImageCacheKey(rawUrl) {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete("stp");
    return parsed.toString();
  } catch {
    return rawUrl.replace(/([?&])stp=[^&]*/g, "$1").replace(/[?&]$/, "");
  }
}

function storeCapturedImage(cache, url, buffer) {
  if (!url || !buffer) return;
  cache.set(url, buffer);

  const normalized = normalizeImageCacheKey(url);
  if (normalized) cache.set(normalized, buffer);
}

function getCapturedImageBuffer(cache, url) {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url);

  const normalized = normalizeImageCacheKey(url);
  if (normalized && cache.has(normalized)) return cache.get(normalized);

  return null;
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const size = Math.max(1, limit);
  const runners = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function scrapeAdsForKeyword(page, keyword, supabase) {
  const url = new URL("https://www.facebook.com/ads/library/");
  url.searchParams.set("active_status", "all");
  url.searchParams.set("ad_type", "all");
  url.searchParams.set("country", COUNTRY);
  url.searchParams.set("q", keyword);
  url.searchParams.set("search_type", "keyword_unordered");

  const cdp = await page.target().createCDPSession();
  const imageCacheByUrl = new Map();
  const interceptedImageUrls = new Set();
  const imageRequestUrlByRequestId = new Map();
  const pendingImageBodyTasks = new Set();

  await cdp.send("Network.enable");
  await cdp.send("Fetch.enable", {
    patterns: [
      {
        urlPattern: "*://scontent*.fbcdn.net/*",
        resourceType: "Image",
      },
    ],
  });

  cdp.on("Fetch.requestPaused", async ({ requestId }) => {
    try {
      await cdp.send("Fetch.continueRequest", { requestId });
    } catch {
      // ignore paused request continuation issues
    }
  });

  cdp.on("Network.responseReceived", ({ requestId, response }) => {
    if (!response || !isFacebookCdnImageUrl(response.url)) return;
    imageRequestUrlByRequestId.set(requestId, response.url);
  });

  cdp.on("Network.loadingFinished", ({ requestId }) => {
    const responseUrl = imageRequestUrlByRequestId.get(requestId);
    if (!responseUrl) return;

    const captureTask = (async () => {
      try {
        const body = await cdp.send("Network.getResponseBody", { requestId });
        if (!body || !body.body) return;
        const buffer = body.base64Encoded
          ? Buffer.from(body.body, "base64")
          : Buffer.from(body.body);
        if (buffer.length > 0) {
          interceptedImageUrls.add(responseUrl);
          storeCapturedImage(imageCacheByUrl, responseUrl, buffer);
        }
      } catch {
        // ignore image body capture issues
      } finally {
        imageRequestUrlByRequestId.delete(requestId);
      }
    })();

    pendingImageBodyTasks.add(captureTask);
    captureTask.finally(() => pendingImageBodyTasks.delete(captureTask));
  });

  cdp.on("Network.loadingFailed", ({ requestId }) => {
    imageRequestUrlByRequestId.delete(requestId);
  });

  console.log(`\n[crawl] Keyword: ${keyword}`);
  console.log(`[crawl] Open: ${url.toString()}`);

  try {
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
        const ctaCandidates = [
          "자세히 알아보기",
          "지금 구매하기",
          "더 알아보기",
          "신청하기",
          "가입하기",
          "다운로드",
          "설치",
          "연락하기",
          "예약하기",
          "문의하기",
        ];

        function normalizeImageUrl(rawUrl) {
          if (!rawUrl) return null;
          return rawUrl.replace(/stp=dst-jpg_s\d+x\d+[^&]*/g, "stp=dst-jpg_s600x600");
        }

        function isExternalLandingHref(href) {
          if (!href) return false;
          if (href.startsWith("#") || href.startsWith("javascript:")) return false;

          try {
            const parsed = new URL(href, window.location.href);
            const host = parsed.hostname.toLowerCase();
            return !host.endsWith("facebook.com")
              && !host.endsWith("fb.com")
              && !host.endsWith("messenger.com")
              && !host.endsWith("instagram.com");
          } catch {
            return false;
          }
        }

        function extractLandingUrl(container) {
          const anchors = Array.from(container.querySelectorAll("a[href]"));
          for (const anchor of anchors) {
            const href = anchor.getAttribute("href") || "";
            if (!href) continue;

            let parsed;
            try {
              parsed = new URL(href, window.location.href);
            } catch {
              continue;
            }

            const host = parsed.hostname.toLowerCase();
            if (host.endsWith("facebook.com") || host.endsWith("fb.com")) {
              const redirectUrl = parsed.searchParams.get("u");
              if (redirectUrl && isExternalLandingHref(redirectUrl)) {
                try {
                  return new URL(redirectUrl).toString();
                } catch {
                  // ignore malformed redirect URL
                }
              }
              continue;
            }

            if (isExternalLandingHref(parsed.toString())) {
              return parsed.toString();
            }
          }

          return null;
        }

        function findAdContainer(startNode) {
          let current = startNode;
          while (current && current !== document.body) {
            if (current.nodeType !== Node.ELEMENT_NODE) {
              current = current.parentElement;
              continue;
            }

            const rect = current.getBoundingClientRect();
            const height = rect ? rect.height : 0;
            const text = current.innerText || "";
            if (height >= 200 && height <= 1200 && /라이브러리 ID:\s*\d+/.test(text)) {
              return current;
            }

            current = current.parentElement;
          }

          return startNode.parentElement || startNode;
        }

        const idElements = Array.from(document.querySelectorAll("*"))
          .filter((el) => /라이브러리 ID:\s*\d+/.test(el.textContent || ""));

        if (idElements.length === 0) return [];

        const seenExternalIds = new Set();
        const output = [];

        for (const idElement of idElements) {
          const ownText = idElement.textContent || "";
          const ownIdMatch = ownText.match(/라이브러리 ID:\s*(\d+)/);
          if (!ownIdMatch) continue;

          const externalId = ownIdMatch[1];
          if (seenExternalIds.has(externalId)) continue;

          const container = findAdContainer(idElement);
          if (!container) continue;

          const containerText = container.innerText || "";
          if (!containerText.includes(`라이브러리 ID: ${externalId}`)) continue;

          const imageUrls = Array.from(container.querySelectorAll("img"))
            .filter((img) => {
              if (!img || !img.src) return false;
              if (!img.src.includes("scontent")) return false;
              return img.naturalWidth > 100 && img.naturalHeight > 100;
            })
            .map((img) => normalizeImageUrl(img.src))
            .filter(Boolean)
            .filter((url, idx, arr) => arr.indexOf(url) === idx);

          const lines = containerText
            .split("\n")
            .map((line) => line.replace(/\s+/g, " ").trim())
            .filter(Boolean);

          const contentLines = lines.filter((line) => {
            if (/^라이브러리 ID\s*:/i.test(line)) return false;
            if (/^플랫폼\s*:/i.test(line)) return false;
            if (/^게재 시작\s*:/i.test(line)) return false;
            return true;
          });

          const fullCopyText = contentLines.join(" ");
          const textLines = contentLines.filter((line) => line.length > 20);
          const copyText = textLines.slice(0, 3).join(" ");

          const ctaText = ctaCandidates.find((cta) => lines.some((line) => line.includes(cta))) || null;
          const landingUrl = extractLandingUrl(container);

          const dateMatch = containerText.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
          const startedText = dateMatch ? dateMatch[0] : null;
          const isActive = /활성|Active/i.test(containerText) && !/비활성|Inactive/i.test(containerText);

          let brandName = "";
          const afterDetail = containerText.split(/광고 상세 정보 보기/);
          if (afterDetail.length > 1) {
            const detailLines = afterDetail[1].split("\n").map((line) => line.trim()).filter(Boolean);
            brandName = detailLines[0] || "";
          }
          if (!brandName) {
            const brandCandidates = lines.filter((line) => {
              if (line.length <= 1 || line.length >= 40) return false;
              if (line.includes("라이브러리")) return false;
              if (line.includes("플랫폼")) return false;
              if (line.includes("게재")) return false;
              return true;
            });
            brandName = brandCandidates[0] || "";
          }

          const hasVideo = /동영상|video/i.test(containerText);
          const hasMultipleImages = imageUrls.length > 1 || /슬라이드|carousel/i.test(containerText);

          output.push({
            snapshotUrl: `https://www.facebook.com/ads/library/?id=${externalId}`,
            brandName,
            copyText,
            fullCopyText,
            imageUrls,
            imageUrl: imageUrls[0] || null,
            landingUrl,
            ctaText,
            hasVideo,
            hasMultipleImages,
            statusText: isActive ? "Active" : "Inactive",
            startedText,
            platformText: containerText,
            externalId,
          });

          seenExternalIds.add(externalId);
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

    await Promise.allSettled(Array.from(pendingImageBodyTasks));
    console.log(`[images] Intercepted ${interceptedImageUrls.size} images from network`);

    const ads = Array.from(collected.values());
    const imageCandidates = ads.filter((ad) => {
      if (!ad.externalId) return false;
      if (Array.isArray(ad.imageUrls) && ad.imageUrls.length > 0) return true;
      return Boolean(ad.imageUrl);
    });
    console.log(`[images] Processing ${imageCandidates.length} ad image sets...`);

    await runWithConcurrency(imageCandidates, 3, async (ad) => {
      const sourceImageUrls = Array.isArray(ad.imageUrls) && ad.imageUrls.length > 0
        ? ad.imageUrls
        : ad.imageUrl
          ? [ad.imageUrl]
          : [];

      if (sourceImageUrls.length === 0) return;

      const permanentImageUrls = [];

      for (let index = 0; index < sourceImageUrls.length; index += 1) {
        const sourceImageUrl = sourceImageUrls[index];
        let sourceBuffer = getCapturedImageBuffer(imageCacheByUrl, sourceImageUrl);
        if (!sourceBuffer) continue;

        try {
          const meta = await sharp(sourceBuffer).metadata();
          if (meta.width < 150 || meta.height < 150) {
            let foundLarger = false;

            for (const candidateUrl of sourceImageUrls) {
              const candidateBuffer = getCapturedImageBuffer(imageCacheByUrl, candidateUrl);
              if (!candidateBuffer || candidateBuffer === sourceBuffer) continue;
              const candidateMeta = await sharp(candidateBuffer).metadata();
              if (candidateMeta.width >= 150 && candidateMeta.height >= 150) {
                sourceBuffer = candidateBuffer;
                foundLarger = true;
                break;
              }
            }

            if (!foundLarger) {
              for (const [, cachedBuf] of imageCacheByUrl.entries()) {
                if (cachedBuf === sourceBuffer) continue;
                const cachedMeta = await sharp(cachedBuf).metadata();
                if (cachedMeta.width >= 150 && cachedMeta.height >= 150) {
                  sourceBuffer = cachedBuf;
                  foundLarger = true;
                  break;
                }
              }
            }

            if (!foundLarger) {
              continue;
            }
          }
        } catch {
          continue;
        }

        try {
          const avifBuffer = await sharp(sourceBuffer)
            .resize(600, 600, { fit: "inside", withoutEnlargement: true })
            .avif({ quality: 50 })
            .toBuffer();

          const targetPath = `${ad.externalId}_${index}.avif`;
          const { error: uploadError } = await supabase.storage
            .from("ad-images")
            .upload(targetPath, avifBuffer, {
              contentType: "image/avif",
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("ad-images").getPublicUrl(targetPath);

          if (!publicUrl) {
            throw new Error("public URL generation failed");
          }

          permanentImageUrls.push(publicUrl);

          const sourceKb = sourceBuffer.length / 1024;
          const avifKb = avifBuffer.length / 1024;
          const savedPercent = sourceBuffer.length > 0
            ? Math.max(0, 100 - (avifBuffer.length / sourceBuffer.length) * 100)
            : 0;

          console.log(
            `[images]   ✓ ${ad.externalId}_${index} | ${sourceKb.toFixed(0)}KB -> ${avifKb.toFixed(0)}KB AVIF (-${savedPercent.toFixed(0)}%)`,
          );
        } catch (error) {
          console.log(`[images]   x ${ad.externalId}_${index} | ${error.message}`);
        }
      }

      ad.permanentImageUrls = permanentImageUrls;
      if (permanentImageUrls.length > 0) {
        ad.imageUrls = permanentImageUrls;
        ad.permanentImageUrl = permanentImageUrls[0];
        ad.imageUrl = permanentImageUrls[0];
      } else {
        ad.imageUrls = sourceImageUrls;
      }
    });

    return ads;
  } finally {
    cdp.removeAllListeners();
    try {
      await cdp.detach();
    } catch {
      // ignore CDP cleanup issues
    }
  }
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
    image_url: rawAd.permanentImageUrl ?? rawAd.imageUrl,
    image_urls: rawAd.permanentImageUrls ?? rawAd.imageUrls ?? [],
    landing_url: sanitizeText(rawAd.landingUrl) || null,
    cta_text: sanitizeText(rawAd.ctaText) || null,
    full_copy_text: sanitizeText(rawAd.fullCopyText) || null,
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
        const ads = await scrapeAdsForKeyword(page, keyword, supabase);
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
