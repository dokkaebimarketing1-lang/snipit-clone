"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAd(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const hashtagsRaw = formData.get("hashtags") as string || "";
  const hashtags = hashtagsRaw ? hashtagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

  const { data, error } = await supabase
    .from("saved_ads")
    .insert({
      user_id: user.id,
      board_id: formData.get("boardId") as string || null,
      platform: formData.get("platform") as string,
      external_id: formData.get("externalId") as string || null,
      image_url: formData.get("imageUrl") as string || null,
      brand_name: formData.get("brandName") as string || null,
      copy_text: formData.get("copyText") as string || null,
      media_type: formData.get("mediaType") as string || null,
      status: formData.get("status") as string || "active",
      is_sponsored: formData.get("isSponsored") === "true",
      sponsor_name: formData.get("sponsorName") as string || null,
      media_tag: formData.get("mediaTag") as string || null,
      hashtags,
      memo: formData.get("memo") as string || null,
      is_uploaded: formData.get("isUploaded") === "true",
      category: formData.get("category") as string || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/board");
  return data;
}

export async function getSavedAds(boardId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("saved_ads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (boardId) {
    query = query.eq("board_id", boardId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function removeSavedAd(adId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("saved_ads")
    .delete()
    .eq("id", adId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}

export async function moveAdToBoard(adId: string, boardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("saved_ads")
    .update({ board_id: boardId })
    .eq("id", adId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}

export async function updateAdTags(adId: string, mediaTag: string | null, hashtags: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("saved_ads")
    .update({ media_tag: mediaTag, hashtags })
    .eq("id", adId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}

export async function importUrls(
  urls: string[],
  options?: { boardId?: string; mediaTag?: string; hashtags?: string[]; memo?: string; category?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const results: { url: string; id: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of urls.slice(0, 20)) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) continue;

    try {
      const parsed = new globalThis.URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push({ url: trimmedUrl, error: "Invalid protocol" });
        continue;
      }

      // Capture ad detail + thumbnail via Puppeteer
      const { captureAdDetail } = await import("@/lib/capture-thumbnail");
      const detail = await captureAdDetail(trimmedUrl);

      // Upload thumbnail if captured
      let imageUrl = detail.imageUrl;
      if (!imageUrl && detail.imageBuffer) {
        try {
          const sharp = (await import("sharp")).default;
          const webpBuffer = await sharp(detail.imageBuffer).resize(600, 600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
          const fileName = `thumbnails/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
          const { createClient: createServiceClient } = await import("@supabase/supabase-js");
          const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
          const { error: uploadErr } = await svc.storage.from("ad-uploads").upload(fileName, webpBuffer, { contentType: "image/webp", upsert: true });
          if (!uploadErr) {
            const { data: urlData } = svc.storage.from("ad-uploads").getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        } catch { /* upload failed */ }
      }

      // Fallback values
      const lower = trimmedUrl.toLowerCase();
      const fallbackPlatform = lower.includes("facebook.com") ? "meta" : lower.includes("instagram.com") ? "instagram" : lower.includes("tiktok.com") ? "tiktok" : lower.includes("youtube.com") || lower.includes("youtu.be") ? "youtube" : "meta";
      const fallbackBrand = parsed.hostname.replace("www.", "").split(".")[0];

      const { data, error: insertError } = await supabase
        .from("saved_ads")
        .insert({
          user_id: user.id,
          board_id: options?.boardId || null,
          platform: detail.platform || fallbackPlatform,
          external_id: trimmedUrl,
          image_url: imageUrl,
          brand_name: detail.brandName || fallbackBrand,
          copy_text: detail.copyText || null,
          media_type: detail.mediaType || "photo",
          status: detail.status || "active",
          published_at: detail.startedAt || null,
          media_tag: options?.mediaTag || null,
          hashtags: options?.hashtags || [],
          memo: options?.memo || null,
          category: options?.category || null,
          is_uploaded: false,
          metadata: JSON.stringify({
            externalId: detail.externalId,
            ctaText: detail.ctaText,
            landingUrl: detail.landingUrl,
          }),
        })
        .select("id")
        .single();

      if (insertError || !data) {
        errors.push({ url: trimmedUrl, error: insertError?.message || "Insert failed" });
        continue;
      }
      results.push({ url: trimmedUrl, id: data.id });
    } catch (err) {
      errors.push({ url: trimmedUrl, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  revalidatePath("/board");
  return { saved: results.length, failed: errors.length, results, errors: errors.length > 0 ? errors : undefined };
}

export async function updateAdMemo(adId: string, memo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("saved_ads")
    .update({ memo })
    .eq("id", adId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}
