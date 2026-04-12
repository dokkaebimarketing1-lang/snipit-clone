import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { urls: string[]; boardId?: string; mediaTag?: string; hashtags?: string[]; memo?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { urls, boardId, mediaTag, hashtags, memo, category } = body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
  }

  if (urls.length > 20) {
    return NextResponse.json({ error: "Maximum 20 URLs per request" }, { status: 400 });
  }

  const results: { url: string; id: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of urls) {
    try {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;
      if (!isAllowedUrl(trimmedUrl)) {
        errors.push({ url: trimmedUrl, error: "Invalid or blocked URL" });
        continue;
      }

      // Detect platform from URL
      const platform = detectPlatform(trimmedUrl);
      const brandName = extractBrandFromUrl(trimmedUrl);

      // Try to fetch OG metadata
      let ogData: { title?: string; image?: string; description?: string } = {};
      try {
        const res = await fetch(trimmedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SnipitBot/1.0)" },
          signal: AbortSignal.timeout(5000),
        });
        const html = await res.text();
        ogData = extractOgMetadata(html);
      } catch {
        // Failed to fetch - continue with URL info only
      }

      const { data, error: insertError } = await supabase
        .from("saved_ads")
        .insert({
          user_id: user.id,
          board_id: boardId || null,
          platform,
          external_id: trimmedUrl,
          image_url: ogData.image || null,
          brand_name: ogData.title || brandName,
          copy_text: ogData.description || null,
          media_type: "photo",
          status: "active",
          media_tag: mediaTag || null,
          hashtags: hashtags || [],
          memo: memo || null,
          category: category || null,
          is_uploaded: false,
        })
        .select("id")
        .single();

      if (insertError || !data) {
        errors.push({ url: trimmedUrl, error: insertError?.message || "Insert returned no data" });
        continue;
      }

      results.push({ url: trimmedUrl, id: data.id });
    } catch (err) {
      errors.push({ url, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return NextResponse.json({
    saved: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new globalThis.URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') || host.includes('169.254')) return false;
    return true;
  } catch {
    return false;
  }
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("facebook.com") || lower.includes("fb.com") || lower.includes("meta.com")) return "meta";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("google.com")) return "google";
  return "meta";
}

function extractBrandFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.split(".")[0];
  } catch {
    return "Unknown";
  }
}

function extractOgMetadata(html: string): { title?: string; image?: string; description?: string } {
  const result: { title?: string; image?: string; description?: string } = {};

  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i)
    || html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim();

  const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
  if (imageMatch) result.image = imageMatch[1].trim();

  const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i)
    || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (descMatch) result.description = descMatch[1].trim();

  return result;
}
