import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://hofitquynnpzvolrmumf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZml0cXV5bm5wenZvbHJtdW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYzODA3NiwiZXhwIjoyMDg5MjE0MDc2fQ.wtxcKd6N6SRFsRMSm0HSE7sipWegvhxcCnt96oySIzc';
const USER_ID = '73e36032-c92f-48ce-9e9c-429194bc543c'; // rudtn466@gmail.com

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if (ch === '\n' && !inQuotes) {
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = '';
    } else if (ch !== '\r') {
      current += ch;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'meta';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('google.com')) return 'google';
  return 'meta';
}

function detectMediaType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('/reels/') || lower.includes('/reel/') || lower.includes('/shorts/')) return 'reels';
  if (lower.includes('video') || lower.includes('watch')) return 'video';
  return 'photo';
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data', 'ad-references.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(raw);

  // CSV columns: [0]:empty, [1]:작성일, [2]:형태, [3]:참고 브랜드, [4]:썸네일, [5]:내용, [6]:영상 url, [7]:폴더 url, [8]:비고, [9]:광고ID, [10]:페이지명

  const ads = [];
  let lastDate = null;
  let lastBrand = null;

  for (let i = 2; i < rows.length; i++) { // skip header rows
    const row = rows[i];
    if (!row || row.length < 7) continue;

    const date = row[1] || null;
    const format = row[2] || null;
    const brand = row[3] || null;
    const content = row[5] || null;
    const url = row[6] || null;
    const note = row[8] || null;
    const adId = row[9] || null;
    const pageName = row[10] || null;

    if (date) lastDate = date;
    if (brand) lastBrand = brand;

    // Skip rows without URLs
    if (!url || !url.startsWith('http')) continue;

    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);
    const mediaType = detectMediaType(cleanUrl);

    ads.push({
      user_id: USER_ID,
      platform,
      external_id: cleanUrl,
      brand_name: pageName || lastBrand || brand || 'Unknown',
      copy_text: content || null,
      media_type: mediaType,
      status: 'active',
      memo: note || null,
      is_uploaded: false,
      metadata: JSON.stringify({
        source: 'csv_import',
        date: lastDate,
        format: format,
        ad_id: adId,
      }),
    });
  }

  console.log(`Parsed ${ads.length} ads from CSV`);

  // Insert in batches of 10
  let success = 0;
  let failed = 0;

  for (let i = 0; i < ads.length; i += 10) {
    const batch = ads.slice(i, i + 10);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/saved_ads`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      success += batch.length;
      console.log(`Batch ${Math.floor(i/10)+1}: ${batch.length} inserted`);
    } else {
      const err = await res.text();
      console.error(`Batch ${Math.floor(i/10)+1} failed:`, err);
      failed += batch.length;
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
