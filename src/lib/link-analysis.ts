import { analyzeUrl, isAIServiceAvailable } from "@/lib/ai";

export interface LinkAnalysisSuggestion {
  title: string;
  description: string;
  icon: string;
  tags: Array<{ name: string; emoji?: string }>;
  category: string;
  isAvailable: boolean;
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveUrl(candidate: string, baseUrl: string) {
  if (candidate.startsWith("//")) {
    return new URL(baseUrl).protocol + candidate;
  }

  return new URL(candidate, baseUrl).href;
}

function getAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() || "";
}

function collectIconCandidates(html: string, url: string) {
  const candidates: string[] = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel").toLowerCase();
    const href = getAttribute(tag, "href");

    if (!href || !/(^|\s)(apple-touch-icon|icon|mask-icon)(\s|$)/.test(rel)) {
      continue;
    }

    try {
      candidates.push(resolveUrl(href, url));
    } catch {
      // 忽略无法解析的图标地址
    }
  }

  const origin = new URL(url).origin;
  candidates.push(
    new URL("/favicon.ico", origin).href,
    new URL("/favicon.svg", origin).href,
    new URL("/favicon.png", origin).href,
    new URL("/apple-touch-icon.png", origin).href,
    `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
  );

  return Array.from(new Set(candidates));
}

async function canFetchIcon(url: string) {
  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    if (headResponse.ok) return true;
  } catch {
    // 有些站点不支持 HEAD，继续用 GET 小范围探测
  }

  try {
    const getResponse = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      signal: AbortSignal.timeout(5000),
    });

    return getResponse.ok;
  } catch {
    return false;
  }
}

async function findIcon(html: string, url: string) {
  const candidates = collectIconCandidates(html, url);

  for (const candidate of candidates) {
    if (candidate.includes("google.com/s2/favicons")) {
      return candidate;
    }

    if (await canFetchIcon(candidate)) {
      return candidate;
    }
  }

  return "";
}

export async function fetchWebsiteInfo(url: string): Promise<{
  title: string;
  icon: string;
  isAvailable: boolean;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
    title = title.replace(/\s+/g, " ").substring(0, 100);

    const icon = await findIcon(html, url);

    return { title, icon, isAvailable: true };
  } catch (error) {
    console.error("获取网站信息失败:", error);
    return {
      title: new URL(url).hostname,
      icon: "",
      isAvailable: false,
    };
  }
}

export async function analyzeLinkUrl(url: string): Promise<LinkAnalysisSuggestion> {
  const websiteInfo = await fetchWebsiteInfo(url);
  const defaultTags = [
    { name: "链接", emoji: "🔗" },
    { name: "收藏", emoji: "⭐" },
  ];

  let title = websiteInfo.title;
  let description = websiteInfo.isAvailable ? "暂无描述" : "链接暂时无法访问";
  let tags = defaultTags;

  if (websiteInfo.isAvailable && isAIServiceAvailable()) {
    try {
      const aiAnalysis = await analyzeUrl(url);
      title = aiAnalysis.title || title;
      description = aiAnalysis.description || description;
      if (aiAnalysis.tags?.length) {
        tags = aiAnalysis.tags.map((tag) => ({
          name: tag.name,
          emoji: tag.emoji || "🏷️",
        }));
      }
    } catch (error) {
      console.error("AI分析失败，回退到基础网页信息:", error);
    }
  }

  const category = tags[0]?.name || "链接";

  return {
    title,
    description,
    icon: websiteInfo.icon,
    tags,
    category,
    isAvailable: websiteInfo.isAvailable,
  };
}
