import { NextResponse } from "next/server";
import { getRecommendedLinks } from "@/lib/home-data";

export async function GET() {
  try {
    const recommendedLinks = await getRecommendedLinks();
    const response = NextResponse.json({
      data: recommendedLinks,
      message: recommendedLinks.length > 0 ? "推荐链接获取成功" : "暂无推荐链接",
    });

    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");

    return response;
  } catch (error) {
    console.error("获取推荐链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
