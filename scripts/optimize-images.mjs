/**
 * Download Facebook CDN images → Convert to AVIF → Upload to Supabase Storage → Update DB
 *
 * Usage:
 *   node scripts/optimize-images.mjs              # Process all ads with fbcdn URLs
 *   node scripts/optimize-images.mjs --limit=50   # Process max 50 ads
 *   node scripts/optimize-images.mjs --refresh     # Re-process even already-converted ones
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const BUCKET = "ad-images";
const AVIF_QUALITY = 50; // Good balance of quality vs size
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
const CONCURRENT = 5; // Parallel downloads/uploads
const RETRY_MAX = 2;

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
  let refresh = false;
  let port = 9333;
  for (const a of args) {
    if (a.startsWith("--limit=")) limit = parseInt(a.split("=")[1], 10) || 0;
    if (a === "--refresh") refresh = true;
    if (a.startsWith("--port=")) port = parseInt(a.split("=")[1], 10) || 9333;
  }
  return { limit, refresh, port };
}

// --- IMAGE PROCESSING ---

// Browser page for downloading images (set by main)
let browserPage = null;

async function downloadImage(url) {
  // Navigate browser to the ad snapshot page and screenshot the ad creative
  if (browserPage && url.includes("facebook.com/ads/library")) {
    await browserPage.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Find the main ad image/video element and screenshot it
    const screenshotBuffer = await browserPage.evaluate(async () => {
      // Find the largest image on the snapshot page (the ad creative)
      const imgs = Array.from(document.querySelectorAll("img"));
      const sorted = imgs
        .filter((i) => i.naturalWidth > 100 && i.src && i.src.includes("scontent"))
        .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

      if (sorted.length === 0) return null;

      const target = sorted[0];
      // Create canvas and draw the image (same origin in browser context)
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

    if (screenshotBuffer) {
      return Buffer.from(screenshotBuffer, "base64");
    }

    // Fallback: screenshot the viewport
    const buf = await browserPage.screenshot({ type: "png" });
    if (buf.length > 5000) return buf;
    throw new Error("Screenshot too small");
  }

  // For snapshot URLs: navigate and screenshot the ad creative area
  if (browserPage) {
    const snapshotUrl = url.includes("scontent")
      ? `https://www.facebook.com/ads/library/?id=${url.split("/").pop()?.split("?")[0] || ""}`
      : url;

    await browserPage.goto(snapshotUrl, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    const buf = await browserPage.screenshot({ type: "png" });
    if (buf.length > 5000) return buf;
    throw new Error("Screenshot capture failed");
  }

  throw new Error("No browser available");
}

async function convertToAvif(inputBuffer) {
  const result = await sharp(inputBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
    .avif({ quality: AVIF_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: result.data, info: result.info };
}

async function uploadToStorage(supabase, fileName, buffer) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: "image/avif",
      upsert: true,
      cacheControl: "31536000", // 1 year cache
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  
  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function processOneAd(supabase, ad, stats) {
  const { id, external_id, image_url } = ad;
  const fileName = `${external_id || id}.avif`;

  for (let attempt = 0; attempt <= RETRY_MAX; attempt++) {
    try {
      // 1. Download
      const rawBuffer = await downloadImage(image_url);
      stats.downloaded++;

      // 2. Convert to AVIF
      const { buffer: avifBuffer, info } = await convertToAvif(rawBuffer);
      const savedPct = Math.round((1 - avifBuffer.length / rawBuffer.length) * 100);
      stats.totalOriginalBytes += rawBuffer.length;
      stats.totalAvifBytes += avifBuffer.length;

      // 3. Upload to Supabase Storage
      const publicUrl = await uploadToStorage(supabase, fileName, avifBuffer);
      stats.uploaded++;

      // 4. Update DB
      const { error: updateError } = await supabase
        .from("scraped_ads")
        .update({ image_url: publicUrl })
        .eq("id", id);

      if (updateError) throw new Error(`DB update failed: ${updateError.message}`);
      stats.updated++;

      console.log(
        `  ✓ ${external_id} | ${(rawBuffer.length / 1024).toFixed(0)}KB → ${(avifBuffer.length / 1024).toFixed(0)}KB (-${savedPct}%) | ${info.width}x${info.height}`
      );
      return;
    } catch (err) {
      if (attempt < RETRY_MAX) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      stats.failed++;
      console.log(`  ✗ ${external_id} | ${err.message}`);
    }
  }
}

// --- MAIN ---

async function run() {
  console.log("[start] Image optimizer: Download → AVIF → Supabase Storage");
  await loadEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { limit, refresh, port } = parseArgs();

  // Connect to Chrome browser for downloading Facebook CDN images
  try {
    const pup = await import("puppeteer");
    const browser = await pup.default.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null });
    browserPage = await browser.newPage();
    // Navigate to facebook.com first to set cookies/referrer
    await browserPage.goto("https://www.facebook.com/ads/library/", { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log("[browser] Connected to Chrome for image downloads");
  } catch (err) {
    console.log("[browser] Could not connect to Chrome:", err.message);
    console.log("[browser] Images will be downloaded via direct fetch (may fail for Facebook CDN)");
  }

  // Fetch ads that still have fbcdn URLs (not yet converted)
  let query = supabase
    .from("scraped_ads")
    .select("id, external_id, image_url")
    .not("image_url", "is", null);

  if (!refresh) {
    // Only process ads with Facebook CDN URLs (not already uploaded to Supabase)
    query = query.like("image_url", "%scontent%");
  }

  query = query.order("scraped_at", { ascending: false });
  if (limit > 0) query = query.limit(limit);

  const { data: ads, error } = await query;
  if (error) {
    console.error("[error]", error.message);
    return;
  }

  console.log(`[found] ${ads.length} ads to process`);
  if (ads.length === 0) {
    console.log("[done] No ads need processing");
    return;
  }

  const stats = {
    downloaded: 0,
    uploaded: 0,
    updated: 0,
    failed: 0,
    totalOriginalBytes: 0,
    totalAvifBytes: 0,
  };

  // Process in batches of CONCURRENT
  for (let i = 0; i < ads.length; i += CONCURRENT) {
    const batch = ads.slice(i, i + CONCURRENT);
    const batchNum = Math.floor(i / CONCURRENT) + 1;
    const totalBatches = Math.ceil(ads.length / CONCURRENT);
    console.log(`\n[batch ${batchNum}/${totalBatches}] Processing ${batch.length} images...`);

    await Promise.all(batch.map((ad) => processOneAd(supabase, ad, stats)));
  }

  // Summary
  const savedMB = ((stats.totalOriginalBytes - stats.totalAvifBytes) / 1024 / 1024).toFixed(1);
  const savedPct = stats.totalOriginalBytes > 0
    ? Math.round((1 - stats.totalAvifBytes / stats.totalOriginalBytes) * 100)
    : 0;

  console.log("\n[summary]");
  console.log(`  Downloaded: ${stats.downloaded}`);
  console.log(`  Converted:  ${stats.uploaded}`);
  console.log(`  DB Updated: ${stats.updated}`);
  console.log(`  Failed:     ${stats.failed}`);
  console.log(`  Original:   ${(stats.totalOriginalBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  AVIF:       ${(stats.totalAvifBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Saved:      ${savedMB} MB (-${savedPct}%)`);

  // Cleanup browser page
  if (browserPage) {
    try { await browserPage.close(); } catch { /* ignore */ }
  }
  console.log("[done]");
}

run().catch((err) => {
  console.error("[fatal]", err.message);
  process.exitCode = 1;
});
