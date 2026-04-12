import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const boardId = formData.get("boardId") as string | null;
  const mediaTag = formData.get("mediaTag") as string | null;
  const hashtagsRaw = formData.get("hashtags") as string || "";
  const hashtags = hashtagsRaw ? hashtagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  const memo = formData.get("memo") as string | null;

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > 20) {
    return NextResponse.json({ error: "Maximum 20 files per upload" }, { status: 400 });
  }

  const results: { id: string; imageUrl: string; fileName: string }[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (const file of files) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("ad-uploads")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      errors.push({ fileName: file.name, error: uploadError.message });
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("ad-uploads")
      .getPublicUrl(filePath);

    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? "video" : "photo";

    const { data: savedAd, error: insertError } = await supabase
      .from("saved_ads")
      .insert({
        user_id: user.id,
        board_id: boardId || null,
        platform: "meta",
        image_url: urlData.publicUrl,
        brand_name: file.name.replace(/\.[^/.]+$/, ""),
        media_type: mediaType,
        status: "active",
        media_tag: mediaTag || null,
        hashtags,
        memo: memo || null,
        is_uploaded: true,
      })
      .select("id")
      .single();

    if (insertError || !savedAd) {
      errors.push({ fileName: file.name, error: insertError?.message || "Insert returned no data" });
      continue;
    }

    results.push({
      id: savedAd.id,
      imageUrl: urlData.publicUrl,
      fileName: file.name,
    });
  }

  return NextResponse.json({
    uploaded: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
