/**
 * Extract thumbnails for saved_ads with missing image_url
 *
 * Uses Puppeteer connected to user's Chrome for Instagram/Facebook pages.
 * YouTube uses hardcoded thumbnail API (no browser needed).
 *
 * Usage:
 *   # 1. Launch Chrome with debugging (separate terminal):
 *   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9333 --user-data-dir="C:/Users/LGS_002/chrome-scraper" --no-first-run "about:blank"
 *
 *   # 2. Run this script:
 *   node scripts/extract-thumbnails.mjs
 *   node scripts/extract-thumbnails.mjs --port=9333
 *   node scripts/extract-thumbnails.mjs --limit=10
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BUCKET = "ad-uploads";
const AVIF_QUALITY = 50;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;

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
    console.log("[env] Loaded .env.local");
  } catch {
    console.log("[env] .env.local not found");
  }
}

// --- CLI ---
function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 0;
  let port = 9333;
  for (const a of args) {
    if (a.startsWith("--limit=")) limit = parseInt(a.split("=")[1], 10) || 0;
    if (a.startsWith("--port=")) port = parseInt(a.split("=")[1], 10) || 9333;
  }
  return { limit, port };
}

// --- YouTube ---
function extractYoutubeId(url) {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1].split("?")[0];
  return null;
}

// --- Instagram Capture ---
async function captureInstagram(page, url) {
  console.log(`  [IG] Navigating: ${url.substring(0, 60)}...`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  // Try to extract image from the page
  const imageBuffer = await page.evaluate(async () => {
    // 1. Look for video poster or main image in article
    const video = document.querySelector("article video");
    if (video && video.poster) {
      try {
        const res = await fetch(video.poster);
        const blob = await res.blob();
        const reader = new FileReader();
        return await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });
      } catch { /* continue */ }
    }

    // 2. Look for main content image
    const imgs = Array.from(document.querySelectorAll("article img, [role='presentation'] img, main img"));
    const sorted = imgs
      .filter((i) => i.naturalWidth > 200 && i.src && !i.src.includes("profile") && !i.src.includes("avatar") && !i.src.includes("s150x150"))
      .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

    if (sorted.length === 0) return null;

    const target = sorted[0];
    const canvas = document.createElement("canvas");
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(target, 0, 0);
    try {
      return canvas.toDataURL("image/png").split(",")[1];
    } catch {
      return null;
    }
  });

  if (imageBuffer) {
    return Buffer.from(imageBuffer, "base64");
  }

  // Fallback: take a screenshot of the page
  console.log("  [IG] Canvas failed, taking screenshot...");
  const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 600, height: 600 } });
  if (screenshot.length > 10000) return screenshot;
  return null;
}

// --- Facebook Ads Library Capture ---
async function captureMetaAd(page, url) {
  console.log(`  [META] Navigating: ${url.substring(0, 60)}...`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 4000));

  const imageBuffer = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    const sorted = imgs
      .filter((i) => i.naturalWidth > 150 && i.src && i.src.includes("scontent"))
      .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

    if (sorted.length === 0) return null;

    const target = sorted[0];
    const canvas = document.createElement("canvas");
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(target, 0, 0);
    try {
      return canvas.toDataURL("image/png").split(",")[1];
    } catch { return null; }
  });

  if (imageBuffer) {
    return Buffer.from(imageBuffer, "base64");
  }

  // Fallback screenshot
  console.log("  [META] Canvas failed, taking screenshot...");
  const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 800, height: 600 } });
  if (screenshot.length > 10000) return screenshot;
  return null;
}

// --- Image Processing ---
async function convertToWebp(inputBuffer) {
  const result = await sharp(inputBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: result.data, info: result.info };
}

async function uploadToStorage(supabase, fileName, buffer) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return urlData.publicUrl;
}

// --- Main ---
async function main() {
  await loadEnv();
  const { limit, port } = parseArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE env vars");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Get ads with missing thumbnails
  let query = supabase
    .from("saved_ads")
    .select("id, external_id, platform, brand_name")
    .is("image_url", null)
    .order("created_at", { ascending: false });

  if (limit > 0) query = query.limit(limit);
  const { data: ads, error } = await query;
  if (error) { console.error("DB error:", error.message); process.exit(1); }

  console.log(`\nFound ${ads.length} ads without thumbnails\n`);
  if (ads.length === 0) { console.log("Nothing to do!"); return; }

  // Separate YouTube (no browser needed) from others
  const youtubeAds = ads.filter((a) => a.platform === "youtube");
  const browserAds = ads.filter((a) => a.platform !== "youtube");

  let updated = 0;
  let failed = 0;

  // 2. Process YouTube (no browser needed)
  for (const ad of youtubeAds) {
    const videoId = extractYoutubeId(ad.external_id || "");
    if (!videoId) { failed++; continue; }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const { error: updateError } = await supabase
      .from("saved_ads")
      .update({ image_url: thumbnailUrl })
      .eq("id", ad.id);

    if (updateError) { failed++; console.log(`  ❌ YT ${videoId}: ${updateError.message}`); }
    else { updated++; console.log(`  ✅ YT ${ad.brand_name}: ${thumbnailUrl}`); }
  }

  // 3. Process Instagram/Meta (browser needed)
  if (browserAds.length > 0) {
    let browser;
    try {
      console.log(`\nConnecting to Chrome on port ${port}...`);
      browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: { width: 1280, height: 900 } });
      console.log("Connected to Chrome!\n");
    } catch (err) {
      console.error(`\n❌ Chrome not found on port ${port}.`);
      console.error(`Run this first:\n  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${port} --user-data-dir="C:/Users/LGS_002/chrome-scraper" --no-first-run "about:blank"\n`);
      failed += browserAds.length;
      console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
      return;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    for (const ad of browserAds) {
      const url = ad.external_id;
      if (!url) { failed++; continue; }

      try {
        let rawBuffer = null;

        if (ad.platform === "instagram") {
          rawBuffer = await captureInstagram(page, url);
        } else if (ad.platform === "meta") {
          rawBuffer = await captureMetaAd(page, url);
        } else {
          // Generic: try screenshot
          await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
          await new Promise((r) => setTimeout(r, 2000));
          rawBuffer = await page.screenshot({ type: "png" });
        }

        if (!rawBuffer || rawBuffer.length < 5000) {
          console.log(`  ⏭️ ${ad.platform} ${ad.brand_name}: capture too small, skipping`);
          failed++;
          continue;
        }

        // Convert to AVIF
        const { buffer: avifBuffer, info } = await convertToWebp(rawBuffer);
        const savedPct = Math.round((1 - avifBuffer.length / rawBuffer.length) * 100);

        // Upload to Supabase Storage
        const fileName = `thumbnails/${ad.id}.webp`;
        const publicUrl = await uploadToStorage(supabase, fileName, avifBuffer);

        // Update DB
        const { error: updateError } = await supabase
          .from("saved_ads")
          .update({ image_url: publicUrl })
          .eq("id", ad.id);

        if (updateError) throw new Error(`DB update: ${updateError.message}`);

        updated++;
        console.log(`  ✅ ${ad.platform} ${ad.brand_name} | ${(rawBuffer.length / 1024).toFixed(0)}KB → ${(avifBuffer.length / 1024).toFixed(0)}KB (-${savedPct}%) | ${info.width}x${info.height}`);

        // Small delay between requests
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        failed++;
        console.log(`  ❌ ${ad.platform} ${ad.brand_name}: ${err.message}`);
      }
    }

    await page.close();
    browser.disconnect();
  }

  console.log(`\n=============================`);
  console.log(`Done! Updated: ${updated}, Failed: ${failed}`);
  console.log(`=============================\n`);
}

main().catch(console.error);
