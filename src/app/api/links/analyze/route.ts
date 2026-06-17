import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/utils";
import { analyzeLinkUrl, isValidHttpUrl } from "@/lib/link-analysis";

// AI分析URL - 需要登录
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = getUserFromToken(authHeader);

    if (!user) {
      return NextResponse.json({ error: "无效的认证令牌" }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "网址是必填项" }, { status: 400 });
    }

    // 验证URL格式
    if (!isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: "请输入有效的网址（需要包含 http:// 或 https://）" },
        { status: 400 }
      );
    }

    // 检查URL是否已经存在
    const existingLink = await prisma.link.findFirst({
      where: {
        url: url,
        isActive: true,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        {
          error: "该网址已经存在",
          existingLink: {
            id: existingLink.id,
            title: existingLink.title,
            url: existingLink.url,
          },
        },
        { status: 409 }
      ); // 409 Conflict
    }

    const suggestion = await analyzeLinkUrl(url);

    return NextResponse.json({
      title: suggestion.title,
      description: suggestion.description,
      icon: suggestion.icon,
      tags: suggestion.tags,
      category: suggestion.category,
      isAvailable: suggestion.isAvailable,
    });
  } catch (error) {
    console.error("分析链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
