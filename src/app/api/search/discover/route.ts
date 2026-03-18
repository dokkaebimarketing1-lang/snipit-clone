import { NextResponse } from "next/server";
import { getDiscoverySections } from "@/app/actions/search";

export async function GET() {
  try {
    const data = await getDiscoverySections();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching discovery sections:", error);
    return NextResponse.json({ error: "Failed to fetch discovery sections" }, { status: 500 });
  }
}
