"use server";

import { createClient } from "@/utils/supabase/server";

interface MonitoringResult {
  id: string;
  adSnapshotUrl: string | null;
  imageUrl: string | null;
  adText: string | null;
  mediaType: string | null;
  status: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export async function getMonitoringData(competitorId: string): Promise<MonitoringResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify competitor belongs to user
  const { data: competitor } = await supabase
    .from("competitors")
    .select("id, platform_id")
    .eq("id", competitorId)
    .eq("user_id", user.id)
    .single();

  if (!competitor) throw new Error("Competitor not found");

  // Get cached monitoring data from DB
  const { data, error } = await supabase
    .from("monitoring_data")
    .select("*")
    .eq("competitor_id", competitorId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    adSnapshotUrl: d.ad_snapshot_url,
    imageUrl: d.image_url,
    adText: d.ad_text,
    mediaType: d.media_type,
    status: d.status,
    firstSeenAt: d.first_seen_at,
    lastSeenAt: d.last_seen_at,
  }));
}

export async function fetchMetaAdsLibrary(pageNameOrId: string): Promise<MonitoringResult[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return [];
  }

  try {
    const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
    url.searchParams.set("search_terms", pageNameOrId);
    url.searchParams.set("ad_type", "ALL");
    url.searchParams.set("ad_reached_countries", '["KR"]');
    url.searchParams.set("fields", "id,ad_snapshot_url,ad_creative_bodies,page_name,publisher_platforms");
    url.searchParams.set("limit", "25");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const json = await res.json();
    return (json.data || []).map((ad: Record<string, unknown>, i: number) => ({
      id: ad.id as string || `meta-${i}`,
      adSnapshotUrl: ad.ad_snapshot_url as string || null,
      imageUrl: null,
      adText: Array.isArray(ad.ad_creative_bodies) ? (ad.ad_creative_bodies as string[])[0] : null,
      mediaType: "photo",
      status: "active",
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getMonitoringStats(competitorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("monitoring_data")
    .select("status, media_type, created_at")
    .eq("competitor_id", competitorId);

  if (error) throw error;

  const items = data || [];
  const active = items.filter(d => d.status === "active").length;
  const inactive = items.filter(d => d.status === "inactive").length;
  const mediaTypes: Record<string, number> = {};
  items.forEach(d => {
    const mt = d.media_type || "unknown";
    mediaTypes[mt] = (mediaTypes[mt] || 0) + 1;
  });

  return {
    totalAds: items.length,
    activeAds: active,
    inactiveAds: inactive,
    mediaDistribution: mediaTypes,
  };
}
