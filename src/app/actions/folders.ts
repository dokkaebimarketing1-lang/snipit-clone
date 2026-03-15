"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFolders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("folders")
    .select("*, boards(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFolder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;

  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/board");
  return data;
}

export async function updateFolder(folderId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("folders")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}
