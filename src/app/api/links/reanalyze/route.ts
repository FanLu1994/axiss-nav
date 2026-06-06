import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { getUserFromToken } from "@/lib/utils";
import { analyzeLinkUrl } from "@/lib/link-analysis";

// 重新分析链接 - 需要登录
export async function POST(request: NextRequest) {
  let linkId = "";

  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = getUserFromToken(authHeader);
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    linkId = body.linkId;

    if (!linkId) {
      return NextResponse.json({ error: "链接ID不能为空" }, { status: 400 });
    }

    // 查找链接
    const link = await prisma.link.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      return NextResponse.json({ error: "链接不存在" }, { status: 404 });
    }

    await prisma.link.update({
      where: { id: linkId },
      data: {
        analysisStatus: "PROCESSING",
        lastCheckedAt: new Date(),
      },
    });

    const suggestion = await analyzeLinkUrl(link.url);
    const now = new Date();

    await prisma.link.update({
      where: { id: linkId },
      data: {
        analysisStatus: suggestion.isAvailable ? "COMPLETED" : "FAILED",
        lastAnalyzedAt: now,
        lastCheckedAt: now,
        isAvailable: suggestion.isAvailable,
      },
    });

    cache.clear();

    return NextResponse.json({
      success: true,
      message: "已生成更新建议，请确认后保存",
      suggestion: {
        id: link.id,
        title: suggestion.title || link.title,
        url: link.url,
        description: suggestion.description || link.description || "",
        icon: suggestion.icon || link.icon || "",
        tags: suggestion.tags.map((tag) => tag.name),
        category: suggestion.category || link.category || "",
        color: link.color || "",
      },
    });
  } catch (error) {
    console.error("重新分析链接错误:", error);
    if (linkId) {
      await prisma.link
        .update({
          where: { id: linkId },
          data: {
            analysisStatus: "FAILED",
            lastCheckedAt: new Date(),
          },
        })
        .catch(() => null);
    }
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
