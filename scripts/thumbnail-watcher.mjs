/**
 * Thumbnail Watcher - 백그라운드에서 새 광고의 썸네일을 자동 추출
 *
 * DB를 주기적으로 폴링하여 image_url이 없는 saved_ads를 찾고,
 * Puppeteer로 썸네일을 캡처한 뒤 Supabase Storage에 업로드합니다.
 *
 * Usage:
 *   # 1. Chrome 디버깅 모드 실행 (자동으로 실행됨)
 *   # 2. 워처 시작
 *   node scripts/thumbnail-watcher.mjs
 *   node scripts/thumbnail-watcher.mjs --interval=30   # 30초마다 체크 (기본 60초)
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { exec } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BUCKET = "ad-uploads";
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
const CHROME_PORT = 9333;

// --- ENV ---
function parseDotenv(contents) {
  const parsed = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

async function loadEnv() {
  try {
    const text = await fs.readFile(path.join(projectRoot, ".env.local"), "utf8");
    const parsed = parseDotenv(text);
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* no .env.local */ }
}

// --- Chrome Management ---
async function isChromeRunning() {
  try {
    const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

function launchChrome() {
  return new Promise((resolve) => {
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "/usr/bin/google-chrome",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ];

    const chromeArgs = [
      `--remote-debugging-port=${CHROME_PORT}`,
      '--user-data-dir="C:/Users/LGS_002/chrome-scraper"',
      "--no-first-run",
      "--headless=new",
      "about:blank",
    ];

    for (const chromePath of chromePaths) {
      try {
        const child = exec(`"${chromePath}" ${chromeArgs.join(" ")}`, { windowsHide: true });
        child.unref();
        console.log(`[chrome] Launched: ${chromePath}`);
        // Wait for Chrome to start
        setTimeout(() => resolve(true), 3000);
        return;
      } catch { /* try next */ }
    }

    console.log("[chrome] Chrome not found, trying without path...");
    try {
      const child = exec(`chrome ${chromeArgs.join(" ")}`, { windowsHide: true });
      child.unref();
      setTimeout(() => resolve(true), 3000);
    } catch {
      resolve(false);
    }
  });
}

async function ensureChrome() {
  if (await isChromeRunning()) {
    console.log("[chrome] Already running on port", CHROME_PORT);
    return true;
  }
  console.log("[chrome] Not running, launching...");
  await launchChrome();
  // Verify
  for (let i = 0; i < 5; i++) {
    if (await isChromeRunning()) {
      console.log("[chrome] Started successfully");
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error("[chrome] Failed to start");
  return false;
}

// --- YouTube ---
function extractYoutubeId(url) {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/\/shorts\/([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  return m ? m[1].split("?")[0] : null;
}

// --- Capture ---
async function captureWithBrowser(browser, url, platform) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 3000));

    const imageBase64 = await page.evaluate((plat) => {
      const selectors = plat === "instagram"
        ? "article img, [role='presentation'] img, main img"
        : "img";

      const imgs = Array.from(document.querySelectorAll(selectors))
        .filter((i) => {
          if (!(i instanceof HTMLImageElement)) return false;
          if (i.naturalWidth < 150) return false;
          if (!i.src) return false;
          if (plat === "instagram" && (i.src.includes("profile") || i.src.includes("avatar") || i.src.includes("s150x150"))) return false;
          if (plat === "meta" && !i.src.includes("scontent")) return false;
          return true;
        })
        .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

      if (imgs.length === 0) return null;
      const canvas = document.createElement("canvas");
      canvas.width = imgs[0].naturalWidth;
      canvas.height = imgs[0].naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(imgs[0], 0, 0);
      try { return canvas.toDataURL("image/png").split(",")[1]; } catch { return null; }
    }, platform);

    if (imageBase64) {
      return Buffer.from(imageBase64, "base64");
    }

    // Fallback: screenshot
    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 800, height: 600 } });
    return screenshot.length > 10000 ? screenshot : null;
  } finally {
    await page.close();
  }
}

// --- Main Loop ---
async function processNewAds(supabase, browser) {
  const { data: ads, error } = await supabase
    .from("saved_ads")
    .select("id, external_id, platform, brand_name")
    .is("image_url", null)
    .not("external_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !ads || ads.length === 0) return 0;

  console.log(`\n[${new Date().toLocaleTimeString()}] Found ${ads.length} ads without thumbnails`);
  let updated = 0;

  for (const ad of ads) {
    const url = ad.external_id;
    if (!url) continue;

    try {
      let imageUrl = null;

      // YouTube: URL formula
      if (ad.platform === "youtube") {
        const videoId = extractYoutubeId(url);
        if (videoId) imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      // Instagram/Meta: browser capture
      if (!imageUrl && (ad.platform === "instagram" || ad.platform === "meta")) {
        const buffer = await captureWithBrowser(browser, url, ad.platform);
        if (buffer) {
          const webpBuffer = await sharp(buffer)
            .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

          const fileName = `thumbnails/${ad.id}.webp`;
          const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, webpBuffer, { contentType: "image/webp", upsert: true });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        }
      }

      if (imageUrl) {
        await supabase.from("saved_ads").update({ image_url: imageUrl }).eq("id", ad.id);
        updated++;
        console.log(`  ✅ ${ad.platform} ${ad.brand_name}`);
      } else {
        console.log(`  ⏭️ ${ad.platform} ${ad.brand_name}: capture failed`);
      }

      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.log(`  ❌ ${ad.platform} ${ad.brand_name}: ${err.message}`);
    }
  }

  return updated;
}

async function main() {
  await loadEnv();
  const interval = parseInt(process.argv.find((a) => a.startsWith("--interval="))?.split("=")[1] || "60", 10);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE env vars");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Ensure Chrome is running
  const chromeOk = await ensureChrome();
  if (!chromeOk) {
    console.error("Cannot start Chrome. Exiting.");
    process.exit(1);
  }

  // Connect browser
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${CHROME_PORT}`,
    defaultViewport: { width: 1280, height: 900 },
  });

  console.log(`\n🔄 Thumbnail Watcher started (checking every ${interval}s)`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Initial run
  await processNewAds(supabase, browser);

  // Polling loop
  const timer = setInterval(async () => {
    try {
      await processNewAds(supabase, browser);
    } catch (err) {
      console.error("[error]", err.message);
    }
  }, interval * 1000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Watcher stopped");
    clearInterval(timer);
    browser.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
