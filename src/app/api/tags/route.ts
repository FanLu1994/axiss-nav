import { NextRequest, NextResponse } from "next/server";
import { getRandomTags } from "@/lib/home-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "7");
    const randomEmoji = searchParams.get("randomEmoji") === "true";
    const tags = await getRandomTags(limit, randomEmoji);
    const response = NextResponse.json({ data: tags });

    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");

    return response;
  } catch (error) {
    console.error("获取随机标签错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
