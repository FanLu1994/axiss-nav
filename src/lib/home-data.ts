import "server-only";

import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";
import { getRandomTagEmoji, matchTagEmoji } from "@/lib/emoji-matcher";
import type { HomePageData, LinkItem, RecommendedLinkItem, TagItem } from "@/lib/home-types";

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

const emptyHomePageData: HomePageData = {
  links: [],
  recommendedLinks: [],
  randomTags: [],
  hasMore: false,
};

function getStableScoreSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000;
  }

  return hash / 50;
}

function shuffleLinks<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function parseTagsWithIcons(
  tagsString: string,
  useRandomEmoji = false
): Array<{ name: string; icon: string }> {
  try {
    const parsed = JSON.parse(tagsString);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((tag) => {
        if (typeof tag === "string") {
          return {
            name: tag,
            icon: useRandomEmoji ? getRandomTagEmoji(tag) : matchTagEmoji(tag),
          };
        }

        if (tag && typeof tag === "object" && tag.name) {
          return {
            name: tag.name,
            icon:
              tag.emoji ||
              tag.icon ||
              (useRandomEmoji ? getRandomTagEmoji(tag.name) : matchTagEmoji(tag.name)),
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{ name: string; icon: string }>;
  } catch {
    return [];
  }
}

export async function getInitialLinks(
  pageSize = 20
): Promise<{ links: LinkItem[]; hasMore: boolean }> {
  const links = await prisma.link.findMany({
    where: { isActive: true },
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
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: pageSize + 1,
  });

  const visibleLinks = links.slice(0, pageSize);

  return {
    links: visibleLinks.map((link) => ({
      ...link,
      description: link.description ?? undefined,
      icon: link.icon ?? undefined,
      category: link.category ?? undefined,
      color: link.color ?? undefined,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
      lastAnalyzedAt: link.lastAnalyzedAt?.toISOString() ?? null,
      lastCheckedAt: link.lastCheckedAt?.toISOString() ?? null,
      tags: parseTags(link.tags),
    })),
    hasMore: links.length > pageSize,
  };
}

export async function getRecommendedLinks(limit = 7): Promise<RecommendedLinkItem[]> {
  const loadRecommendedLinks = async () => {
    const links = await prisma.link.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        url: true,
        icon: true,
        clickCount: true,
        createdAt: true,
      },
      orderBy: [{ clickCount: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: Math.max(limit * 8, 56),
    });

    if (links.length === 0) {
      return [];
    }

    const now = Date.now();

    return links
      .map((link) => {
        const createdTime = new Date(link.createdAt).getTime();
        const daysSinceCreated = (now - createdTime) / (1000 * 60 * 60 * 24);
        const clickScore = Math.max(0, 100 - link.clickCount * 5);
        const ageScore = Math.min(50, daysSinceCreated * 2);
        const stableScore = getStableScoreSeed(link.id);

        return {
          id: link.id,
          title: link.title,
          url: link.url,
          icon: link.icon ?? undefined,
          clickCount: link.clickCount,
          score: clickScore + ageScore + stableScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        clickCount: link.clickCount,
      }));
  };

  return withCache(`home:recommended:${limit}`, loadRecommendedLinks, 5 * 60 * 1000);
}

export async function getFreshRecommendedLinks(limit = 7): Promise<RecommendedLinkItem[]> {
  const links = await prisma.link.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      url: true,
      icon: true,
      clickCount: true,
    },
    orderBy: [{ clickCount: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    take: Math.max(limit * 8, 56),
  });

  return shuffleLinks(links)
    .slice(0, limit)
    .map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon ?? undefined,
      clickCount: link.clickCount,
    }));
}

export async function getRandomTags(limit = 7, useRandomEmoji = false): Promise<TagItem[]> {
  return withCache(
    `home:tags:${limit}:${useRandomEmoji ? "random" : "stable"}`,
    async () => {
      const links = await prisma.link.findMany({
        where: {
          isActive: true,
          tags: { not: null },
        },
        select: {
          tags: true,
          category: true,
          color: true,
        },
      });

      const tagCounts = new Map<string, { count: number; color?: string | null; icon: string }>();

      for (const link of links) {
        if (link.tags) {
          const parsedTags = parseTagsWithIcons(link.tags, useRandomEmoji);

          for (const tagInfo of parsedTags) {
            const existingTag = tagCounts.get(tagInfo.name);
            tagCounts.set(tagInfo.name, {
              count: (existingTag?.count || 0) + 1,
              color: link.color || existingTag?.color,
              icon: useRandomEmoji
                ? getRandomTagEmoji(tagInfo.name)
                : tagInfo.icon || existingTag?.icon || matchTagEmoji(tagInfo.name),
            });
          }
        }

        if (link.category) {
          const existingCategory = tagCounts.get(link.category);
          tagCounts.set(link.category, {
            count: (existingCategory?.count || 0) + 1,
            color: link.color || existingCategory?.color,
            icon: useRandomEmoji
              ? getRandomTagEmoji(link.category)
              : existingCategory?.icon || matchTagEmoji(link.category),
          });
        }
      }

      const tags = Array.from(tagCounts.entries())
        .map(([name, info]) => ({
          id: name,
          name,
          color: info.color ?? undefined,
          icon: info.icon,
          count: info.count,
        }))
        .sort((a, b) => b.count - a.count);

      if (tags.length <= limit) {
        return tags;
      }

      if (!useRandomEmoji) {
        return tags.slice(0, limit);
      }

      return [...tags].sort(() => 0.5 - Math.random()).slice(0, limit);
    },
    useRandomEmoji ? 30 * 1000 : 5 * 60 * 1000
  );
}

export async function getHomePageData(): Promise<HomePageData> {
  try {
    const [{ links, hasMore }, recommendedLinks, randomTags] = await Promise.all([
      getInitialLinks(),
      getRecommendedLinks(),
      getRandomTags(),
    ]);

    return {
      links,
      recommendedLinks,
      randomTags,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to load home page data:", error);
    return emptyHomePageData;
  }
}
