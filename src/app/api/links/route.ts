import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { getUserFromToken } from "@/lib/utils";
import { isValidHttpUrl } from "@/lib/link-analysis";

type SortOption = "created_desc" | "created_asc" | "clicks_desc" | "title_asc";
type FilterOption = "all" | "frequent" | "recent" | "uncategorized";

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((tag) => (typeof tag === "string" ? tag : tag?.name))
      .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
  } catch {
    return [];
  }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  const tagNames = new Set<string>();
  for (const tag of tags) {
    const name = (typeof tag === "string" ? tag : tag?.name)?.trim();
    if (name) {
      tagNames.add(name);
    }
  }

  return Array.from(tagNames);
}

function buildOrderBy(sort: SortOption) {
  if (sort === "created_asc") return [{ createdAt: "asc" as const }, { id: "asc" as const }];
  if (sort === "clicks_desc")
    return [
      { clickCount: "desc" as const },
      { createdAt: "desc" as const },
      { id: "asc" as const },
    ];
  if (sort === "title_asc") return [{ title: "asc" as const }, { id: "asc" as const }];
  return [{ createdAt: "desc" as const }, { id: "asc" as const }];
}

// 获取链接 - 支持分页和搜索 - 优化版本
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100); // 限制最大页面大小
    const search = searchParams.get("search")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const filter = (searchParams.get("filter") || "all") as FilterOption;
    const sort = (searchParams.get("sort") || "created_desc") as SortOption;
    const includeTotal = searchParams.get("includeTotal") === "true";

    const whereCondition = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { url: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
          { tags: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(tag && { tags: { contains: tag, mode: "insensitive" as const } }),
      ...(category && { category: { equals: category, mode: "insensitive" as const } }),
      ...(filter === "frequent" && { clickCount: { gt: 0 } }),
      ...(filter === "uncategorized" && { category: null }),
    };

    const skip = (page - 1) * pageSize;

    const [total, linksResult] = await Promise.all([
      includeTotal ? prisma.link.count({ where: whereCondition }) : Promise.resolve(null),
      prisma.link.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          icon: true,
          order: true,
          isActive: true,
          clickCount: true,
          createdAt: true,
          updatedAt: true,
          tags: true,
          category: true,
          color: true,
          analysisStatus: true,
          lastAnalyzedAt: true,
          lastCheckedAt: true,
          isAvailable: true,
        },
        orderBy:
          filter === "recent"
            ? [{ createdAt: "desc" as const }, { id: "asc" as const }]
            : buildOrderBy(sort),
        skip,
        take: pageSize + 1,
      }),
    ]);

    const hasMore = linksResult.length > pageSize;
    const links = linksResult.slice(0, pageSize);
    const totalPages = total === null ? null : Math.ceil(total / pageSize);

    // 处理tags字段，将JSON字符串转换为数组
    const processedLinks = links.map((link) => ({
      ...link,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
      lastAnalyzedAt: link.lastAnalyzedAt?.toISOString() || null,
      lastCheckedAt: link.lastCheckedAt?.toISOString() || null,
      tags: parseTags(link.tags),
    }));

    const response = NextResponse.json({
      data: processedLinks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore,
      },
    });

    // 添加缓存头，提高性能
    response.headers.set("Cache-Control", "public, max-age=30, s-maxage=60");

    return response;
  } catch (error) {
    console.error("获取链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 新增链接 - 需要登录
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = getUserFromToken(authHeader);
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, description, icon, tags, category, color } = body;

    // 验证必填字段
    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "标题和URL不能为空" }, { status: 400 });
    }

    // 验证URL格式
    if (!isValidHttpUrl(url)) {
      return NextResponse.json({ error: "URL格式不正确" }, { status: 400 });
    }

    const existingLink = await prisma.link.findFirst({
      where: {
        url: url.trim(),
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
      );
    }

    // 处理标签数据
    const processedTags = normalizeTags(tags);
    const finalTags = processedTags.length > 0 ? processedTags : ["链接", "收藏"];
    const hasMetadata =
      Boolean(description?.trim()) ||
      Boolean(icon?.trim()) ||
      finalTags.length > 0 ||
      Boolean(category?.trim());
    const now = new Date();

    const link = await prisma.link.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        description,
        icon: icon || "",
        tags: JSON.stringify(finalTags),
        category: category || finalTags[0] || null,
        color: color || null,
        analysisStatus: hasMetadata ? "COMPLETED" : "PENDING",
        lastAnalyzedAt: hasMetadata ? now : null,
        lastCheckedAt: now,
        isAvailable: true,
      },
    });

    cache.clear();

    return NextResponse.json({
      ...link,
      tags: finalTags,
    });
  } catch (error) {
    console.error("添加链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 编辑链接 - 需要登录
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = getUserFromToken(authHeader);
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, url, description, icon, tags, category, color } = body;

    if (!id) {
      return NextResponse.json({ error: "链接ID不能为空" }, { status: 400 });
    }

    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "标题和URL不能为空" }, { status: 400 });
    }

    if (!isValidHttpUrl(url)) {
      return NextResponse.json({ error: "URL格式不正确" }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: "链接不存在" }, { status: 404 });
    }

    const duplicate = await prisma.link.findFirst({
      where: {
        url: url.trim(),
        isActive: true,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: "该网址已经存在",
          existingLink: {
            id: duplicate.id,
            title: duplicate.title,
            url: duplicate.url,
          },
        },
        { status: 409 }
      );
    }

    const processedTags = normalizeTags(tags);
    const now = new Date();

    const updatedLink = await prisma.link.update({
      where: { id },
      data: {
        title: title.trim(),
        url: url.trim(),
        description: description || null,
        icon: icon || "",
        tags: JSON.stringify(processedTags),
        category: category || null,
        color: color || null,
        analysisStatus: "COMPLETED",
        lastAnalyzedAt: now,
        lastCheckedAt: now,
        isAvailable: true,
      },
    });

    cache.clear();

    return NextResponse.json({
      ...updatedLink,
      tags: processedTags,
    });
  } catch (error) {
    console.error("编辑链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 删除链接 - 需要登录
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = getUserFromToken(authHeader);
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("id");

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

    // 删除链接（软删除）
    await prisma.link.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    cache.clear();

    return NextResponse.json({ message: "链接已删除" });
  } catch (error) {
    console.error("删除链接错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
