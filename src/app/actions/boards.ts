"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBoards() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("boards")
    .select("*, folders(name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBoard(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const folderId = formData.get("folderId") as string | null;

  const { data, error } = await supabase
    .from("boards")
    .insert({
      user_id: user.id,
      name,
      folder_id: folderId || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/board");
  return data;
}

export async function updateBoard(boardId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const folderId = formData.get("folderId") as string | null;

  const { error } = await supabase
    .from("boards")
    .update({
      name,
      folder_id: folderId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", boardId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/board");
}
