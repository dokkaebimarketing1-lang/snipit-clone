import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ContributedAd = {
  external_id?: string;
  brand_name?: string;
  copy_text?: string | null;
  image_url?: string | null;
  platform?: string;
  status?: string;
  country?: string;
  started_at?: string | null;
  source?: string;
};

export async function POST(request: NextRequest) {
  let payload: { ads?: ContributedAd[] };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const ads = payload.ads;
  if (!Array.isArray(ads) || ads.length === 0) {
    return NextResponse.json({ error: "No ads provided" }, { status: 400 });
  }

  const batch = ads.slice(0, 50).filter((ad) => typeof ad.external_id === "string" && ad.external_id.trim().length > 0);
  if (batch.length === 0) {
    return NextResponse.json({ error: "No valid ads provided" }, { status: 400 });
  }

  const supabase = await createClient();

  const rows = batch.map((ad) => {
    const externalId = ad.external_id?.trim() || "";

    return {
      external_id: externalId,
      brand_name: ad.brand_name || "Unknown",
      copy_text: ad.copy_text || null,
      image_url: ad.image_url || null,
      platform: ad.platform || "meta",
      media_type: "photo",
      status: ad.status || "active",
      country: ad.country || "KR",
      source: ad.source || "extension",
      snapshot_url: `https://www.facebook.com/ads/library/?id=${externalId}`,
      started_at: ad.started_at || null,
      scraped_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from("scraped_ads")
    .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: rows.length });
}
