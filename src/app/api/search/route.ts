import { NextRequest, NextResponse } from "next/server";
import { searchAds } from "@/app/actions/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const mode = (request.nextUrl.searchParams.get("mode") || "similarity") as "similarity" | "copywrite";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchAds(query, mode);
  return NextResponse.json({ results });
}
