"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAd(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
