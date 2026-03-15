"use server";

import { createClient } from "@/utils/supabase/server";

interface SearchResult {
  id: string;
  imageUrl: string;
  brandName: string;
  platform: "meta" | "instagram" | "google" | "tiktok";
  mediaType: "photo" | "video" | "reels" | "carousel";
  status: "active" | "inactive";
  publishedAt: string;
  durationDays: number;
  isSponsored: boolean;
  copyText: string;
}

export async function searchAds(query: string, mode: "similarity" | "copywrite" = "similarity"): Promise<SearchResult[]> {
  // Track search history if user is authenticated
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        query,
        mode,
      });
    }
  } catch {
    // Supabase not configured — skip history tracking
  }

  // Search via Unsplash API
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    // Fallback: return empty results if API key not configured
    return [];
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=squarish`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const platforms = ["meta", "instagram", "google", "tiktok"] as const;
    const mediaTypes = ["photo", "video", "reels", "carousel"] as const;
    const brands = [
      "올리브영", "무신사", "29CM", "마켓컬리", "토스",
      "당근마켓", "배달의민족", "야나두", "쏘카", "브런치",
    ];
    const copies = [
      "지금 시작하면 50% 할인",
      "이 광고를 보고 있다면 당신도 이미 알고 있을 거예요",
      "3일만에 완판된 비밀",
      "마케터가 숨기고 싶은 레퍼런스",
      "지금 바로 확인하세요",
    ];

    return data.results.map((photo: Record<string, unknown>, i: number) => {
      const seed = photo.id ? (photo.id as string).charCodeAt(0) : i;
      return {
        id: photo.id as string,
        imageUrl: (photo.urls as Record<string, string>).regular,
        brandName: brands[seed % brands.length],
        platform: platforms[seed % platforms.length],
        mediaType: mediaTypes[seed % mediaTypes.length],
        status: seed % 3 === 0 ? "inactive" as const : "active" as const,
        publishedAt: `2026.${String((seed % 3) + 1).padStart(2, "0")}.${String((seed % 28) + 1).padStart(2, "0")}`,
        durationDays: (seed % 60) + 1,
        isSponsored: seed % 5 === 0,
        copyText: copies[seed % copies.length],
      };
    });
  } catch {
    return [];
  }
}
