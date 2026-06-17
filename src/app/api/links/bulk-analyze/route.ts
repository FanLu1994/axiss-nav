import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { getUserFromToken } from "@/lib/utils";
import { analyzeLinkUrl, fetchWebsiteInfo } from "@/lib/link-analysis";

type BulkAction = "refresh" | "untidy";

function getTagNames(tags: Array<{ name: string }>) {
  return tags.map((tag) => tag.name).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = getUserFromToken(authHeader);
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as BulkAction;

    if (action !== "refresh" && action !== "untidy") {
      return NextResponse.json({ error: "操作类型不正确" }, { status: 400 });
    }

    const links = await prisma.link.findMany({
      where: {
        isActive: true,
        ...(action === "untidy" && {
          OR: [
            { category: null },
            { tags: null },
            { tags: "[]" },
            { analysisStatus: "PENDING" as const },
            { analysisStatus: "FAILED" as const },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        category: true,
        tags: true,
      },
    });

    let succeeded = 0;
    let failed = 0;

    for (const link of links) {
      if (action === "untidy") {
        await prisma.link.update({
          where: { id: link.id },
          data: {
            analysisStatus: "PROCESSING",
            lastCheckedAt: new Date(),
          },
        });
      }

      try {
        const now = new Date();

        if (action === "refresh") {
          const websiteInfo = await fetchWebsiteInfo(link.url);

          await prisma.link.update({
            where: { id: link.id },
            data: {
              title: websiteInfo.title || link.title,
              icon: websiteInfo.icon || link.icon || "",
              lastCheckedAt: now,
              isAvailable: websiteInfo.isAvailable,
            },
          });
        } else {
          const suggestion = await analyzeLinkUrl(link.url);
          const tagNames = getTagNames(suggestion.tags);

          await prisma.link.update({
            where: { id: link.id },
            data: {
              title: suggestion.title || link.title,
              description: suggestion.description || link.description || null,
              icon: suggestion.icon || link.icon || "",
              tags: JSON.stringify(tagNames.length > 0 ? tagNames : ["链接", "收藏"]),
              category: suggestion.category || link.category || tagNames[0] || "链接",
              analysisStatus: suggestion.isAvailable ? "COMPLETED" : "FAILED",
              lastAnalyzedAt: now,
              lastCheckedAt: now,
              isAvailable: suggestion.isAvailable,
            },
          });
        }

        succeeded += 1;
      } catch (error) {
        console.error(`批量分析链接失败: ${link.url}`, error);
        failed += 1;
        await prisma.link
          .update({
            where: { id: link.id },
            data: {
              analysisStatus: "FAILED",
              lastCheckedAt: new Date(),
            },
          })
          .catch(() => null);
      }
    }

    cache.clear();

    return NextResponse.json({
      success: true,
      total: links.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("批量分析链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
