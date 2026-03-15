"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCompetitors() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addCompetitor(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("competitors")
    .insert({
      user_id: user.id,
      name: formData.get("name") as string,
      platform: formData.get("platform") as string,
      platform_id: formData.get("platformId") as string || null,
      country: formData.get("country") as string || "KR",
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/monitoring");
  return data;
}

export async function removeCompetitor(competitorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("competitors")
    .update({ is_active: false })
    .eq("id", competitorId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/monitoring");
}
