const SUPA = 'https://hofitquynnpzvolrmumf.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZml0cXV5bm5wenZvbHJtdW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYzODA3NiwiZXhwIjoyMDg5MjE0MDc2fQ.wtxcKd6N6SRFsRMSm0HSE7sipWegvhxcCnt96oySIzc';
const H = { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json' };

function extractYoutubeId(url) {
  // youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  return null;
}

function getYoutubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function getInstagramThumbnail(url) {
  try {
    const cleanUrl = url.split('?')[0];
    const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.thumbnail_url || null;
    }
  } catch { /* ignore */ }
  return null;
}

async function getFacebookAdThumbnail(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
    if (ogImage) return ogImage[1];
  } catch { /* ignore */ }
  return null;
}

async function main() {
  // Get all saved_ads with null image_url
  const r = await fetch(`${SUPA}/rest/v1/saved_ads?select=id,external_id,platform&image_url=is.null`, { headers: H });
  const ads = await r.json();
  console.log(`Found ${ads.length} ads without thumbnails`);

  let updated = 0;
  let failed = 0;

  for (const ad of ads) {
    const url = ad.external_id;
    if (!url) { failed++; continue; }

    let thumbnailUrl = null;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYoutubeId(url);
      if (videoId) {
        thumbnailUrl = getYoutubeThumbnail(videoId);
      }
    } else if (url.includes('instagram.com')) {
      thumbnailUrl = await getInstagramThumbnail(url);
    } else if (url.includes('facebook.com/ads/library')) {
      thumbnailUrl = await getFacebookAdThumbnail(url);
    }

    if (thumbnailUrl) {
      const res = await fetch(`${SUPA}/rest/v1/saved_ads?id=eq.${ad.id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ image_url: thumbnailUrl }),
      });
      if (res.ok) {
        updated++;
        console.log(`✅ ${ad.platform}: ${thumbnailUrl.substring(0, 60)}...`);
      } else {
        failed++;
        console.log(`❌ ${ad.id}: patch failed`);
      }
    } else {
      failed++;
      console.log(`⏭️ ${ad.platform}: no thumbnail for ${url.substring(0, 50)}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed/Skipped: ${failed}`);
}

main().catch(console.error);
