import { NextRequest, NextResponse } from "next/server";
import { analyzeInstagramAccount } from "@/app/actions/instagram";

export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account");

  if (!account) {
    return NextResponse.json({ error: "account parameter required" }, { status: 400 });
  }

  try {
    const result = await analyzeInstagramAccount(account);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
