import { NextRequest, NextResponse } from "next/server";
import { searchAds } from "@/app/actions/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const mode = (request.nextUrl.searchParams.get("mode") || "similarity") as "similarity" | "copywrite";
  const category = request.nextUrl.searchParams.get("category") || undefined;
  const sort = request.nextUrl.searchParams.get("sort") || undefined;
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "24", 10);
  const brandName = request.nextUrl.searchParams.get("brandName") || undefined;

  const { results, totalCount } = await searchAds(query, mode, {
    category,
    sort,
    page,
    limit,
    brandName,
  });
  
  return NextResponse.json({ results, totalCount });
}
