"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BookmarkPlus,
  Compass,
  Folder,
  Github,
  Grid3X3,
  ListFilter,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkCard } from "@/components/link-card";
import { LinkCardSkeleton } from "@/components/link-card-skeleton";
import type { EditableLink } from "@/components/add-link-dialog";
import { RandomTags } from "@/components/random-tags";
import { RecommendedLinks } from "@/components/recommended-links";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { VisualBackdrop } from "@/components/visual-backdrop";
import type { LinkItem, RecommendedLinkItem, TagItem } from "@/lib/home-types";

const AddLinkDialog = dynamic(
  () => import("@/components/add-link-dialog").then((mod) => mod.AddLinkDialog),
  { ssr: false }
);

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "authUser";
const GITHUB_REPOSITORY_URL = "https://github.com/FanLu1994/axiss-nav";

interface ExistingLinkLocator {
  id: string;
  title: string;
  url: string;
}

type FilterOption = "all" | "frequent" | "recent" | "uncategorized";
type SortOption = "created_desc" | "created_asc" | "clicks_desc" | "title_asc";

const filterOptions: Array<{ value: FilterOption; label: string; shortLabel: string }> = [
  { value: "all", label: "全部链接", shortLabel: "全部" },
  { value: "frequent", label: "高频访问", shortLabel: "常用" },
  { value: "recent", label: "最近添加", shortLabel: "最近" },
  { value: "uncategorized", label: "待整理", shortLabel: "待整理" },
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "created_desc", label: "最新添加" },
  { value: "created_asc", label: "最早添加" },
  { value: "clicks_desc", label: "点击最多" },
  { value: "title_asc", label: "标题 A-Z" },
];

function getLinkForEdit(link: LinkItem): EditableLink {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description ?? undefined,
    icon: link.icon ?? undefined,
    tags: link.tags || [],
    category: link.category ?? undefined,
    color: link.color ?? undefined,
  };
}

function getDefaultCategories(links: LinkItem[]) {
  return Array.from(new Set(links.map((link) => link.category).filter(Boolean) as string[])).slice(
    0,
    8
  );
}

function uniqueLinksById(links: LinkItem[]) {
  const uniqueLinks = new Map<string, LinkItem>();

  for (const link of links) {
    uniqueLinks.set(link.id, link);
  }

  return Array.from(uniqueLinks.values());
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

interface LinksApiResponse {
  data?: LinkItem[];
  error?: string;
  pagination?: {
    hasMore?: boolean;
  };
}

interface HomePageClientProps {
  initialLinks: LinkItem[];
  initialHasMore: boolean;
  initialRecommendedLinks: RecommendedLinkItem[];
  initialTags: TagItem[];
}

export function HomePageClient({
  initialLinks,
  initialHasMore,
  initialRecommendedLinks,
  initialTags,
}: HomePageClientProps) {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("created_desc");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<EditableLink | null>(null);
  const [links, setLinks] = useState<LinkItem[]>(() => uniqueLinksById(initialLinks));
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialUrl, setInitialUrl] = useState("");
  const [highlightedLinkId, setHighlightedLinkId] = useState("");
  const [bulkAction, setBulkAction] = useState<"refresh" | "untidy" | null>(null);
  const didHydrateInitialLinks = useRef(false);
  const router = useRouter();

  const categories = useMemo(() => getDefaultCategories(links), [links]);
  const dashboardStats = useMemo(
    () => [
      {
        label: "当前结果",
        value: links.length,
        hint: hasMore ? "下滑继续加载" : "结果已完整",
        icon: Grid3X3,
      },
      {
        label: "高频链接",
        value: links.filter((link) => link.clickCount > 0).length,
        hint: "有访问记录",
        icon: Compass,
      },
      {
        label: "待整理",
        value: links.filter((link) => !link.category || link.tags.length === 0).length,
        hint: "缺分类或标签",
        icon: Folder,
      },
    ],
    [hasMore, links]
  );
  const activeFilterLabel = filterOptions.find((option) => option.value === filter)?.label;
  const activeSortLabel = sortOptions.find((option) => option.value === sort)?.label;

  const buildParams = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        pageSize: "20",
        filter,
        sort,
      });

      if (searchQuery) params.set("search", searchQuery);
      if (activeTag) params.set("tag", activeTag);
      if (activeCategory) params.set("category", activeCategory);

      return params;
    },
    [activeCategory, activeTag, filter, searchQuery, sort]
  );

  const isValidUrl = useCallback((text: string): boolean => {
    try {
      const url = new URL(text.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  const readClipboardAndValidate = useCallback(async (): Promise<string> => {
    try {
      const text = await navigator.clipboard.readText();
      return isValidUrl(text.trim()) ? text.trim() : "";
    } catch {
      return "";
    }
  }, [isValidUrl]);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);

    try {
      const response = await fetch(`/api/links?${buildParams(1)}`);
      const result = await readJsonResponse<LinksApiResponse>(response);

      if (response.ok && Array.isArray(result?.data)) {
        setLinks(uniqueLinksById(result.data));
        setHasMore(result?.pagination?.hasMore || false);
      } else {
        setLinks([]);
        setHasMore(false);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.error("获取链接失败，请稍后重试");
        }
      }
    } catch (error) {
      console.error("获取链接失败:", error);
      setLinks([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMoreLinks = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/links?${buildParams(nextPage)}`);
      const result = await readJsonResponse<LinksApiResponse>(response);

      const nextLinks = result?.data;

      if (response.ok && Array.isArray(nextLinks)) {
        setLinks((prev) => uniqueLinksById([...prev, ...nextLinks]));
        setPage(nextPage);
        setHasMore(result?.pagination?.hasMore || false);
      } else {
        setHasMore(false);
        if (result?.error) {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("加载更多链接失败:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
          return;
        }

        const savedUser = localStorage.getItem(AUTH_USER_KEY);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser) as User);
            setUserLoading(false);
          } catch {
            localStorage.removeItem(AUTH_USER_KEY);
          }
        }

        const response = await fetch("/api/auth/me", {
          headers: { authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
          return;
        }

        const userInfo = await response.json();
        setUser(userInfo);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo));
      } catch (error) {
        console.error("获取用户信息失败:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!didHydrateInitialLinks.current) {
      didHydrateInitialLinks.current = true;
      return;
    }

    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 160) {
        loadMoreLinks();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreLinks]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleAddClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setInitialUrl(await readClipboardAndValidate());
    setAddDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setInitialUrl("");
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
  };

  const handleEdit = (id: string) => {
    const link = links.find((item) => item.id === id);
    if (link) {
      setEditingLink(getLinkForEdit(link));
    }
  };

  const handleLocateExistingLink = (link: ExistingLinkLocator) => {
    setSearch(link.url);
    setSearchQuery(link.url);
    setActiveTag("");
    setActiveCategory("");
    setFilter("all");
    setSort("created_desc");
    setHighlightedLinkId(link.id);
    toast.message("已切换到已有链接结果");
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    toast.success("已退出登录");
  };

  const handleDelete = async (linkId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      toast.error("请先登录");
      return;
    }

    try {
      const response = await fetch(`/api/links?id=${linkId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("链接已删除");
        fetchLinks();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("网络错误，请稍后重试");
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  const redirectToLogin = (message = "登录已失效，请重新登录") => {
    clearAuthState();
    toast.error(message);
    router.push("/login");
  };

  const handleReanalyze = async (linkId: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      redirectToLogin();
      return;
    }

    try {
      const response = await fetch("/api/links/reanalyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ linkId }),
      });
      const result = await response.json();

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.ok && result.suggestion) {
        setEditingLink(result.suggestion);
        toast.success("已生成建议，确认后保存才会覆盖原内容");
        fetchLinks();
      } else {
        toast.error(result.error || "重新分析失败");
      }
    } catch (error) {
      console.error("重新分析请求失败:", error);
      toast.error("重新分析请求失败");
    }
  };

  const handleBulkAnalyze = async (action: "refresh" | "untidy") => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      redirectToLogin();
      return;
    }

    setBulkAction(action);
    try {
      const response = await fetch("/api/links/bulk-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        toast.error(result.error || "批量操作失败");
        return;
      }

      toast.success(`处理完成：成功 ${result.succeeded} 个，失败 ${result.failed} 个`);
      fetchLinks();
    } catch (error) {
      console.error("批量操作失败:", error);
      toast.error("批量操作失败，请稍后重试");
    } finally {
      setBulkAction(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSearchQuery("");
    setActiveTag("");
    setActiveCategory("");
    setFilter("all");
    setSort("created_desc");
  };

  const hasActiveFilters =
    searchQuery || activeTag || activeCategory || filter !== "all" || sort !== "created_desc";

  useEffect(() => {
    if (!highlightedLinkId) return;

    const timer = window.setTimeout(() => setHighlightedLinkId(""), 2600);
    return () => window.clearTimeout(timer);
  }, [highlightedLinkId]);

  return (
    <main className="axiss-motion-shell relative min-h-[100dvh] overflow-hidden text-slate-950 transition-colors duration-200 dark:text-slate-100">
      <VisualBackdrop />

      <header className="axiss-motion-header sticky top-0 z-30 border-b border-slate-950/8 bg-[#f4f7f7]/82 backdrop-blur-2xl dark:border-white/8 dark:bg-[#091015]/84">
        <div className="relative mx-auto max-w-[1400px] px-4 py-3 lg:px-6">
          <div className="grid gap-3 lg:grid-cols-[17rem_minmax(0,1fr)_auto] lg:items-center">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="axiss-brand-mark h-10 w-10 rounded-lg text-[13px] font-semibold tracking-tight">
                  <Image
                    src="/favicon.ico"
                    alt="Axiss Nav"
                    width={28}
                    height={28}
                    priority
                    unoptimized
                    className="h-7 w-7 rounded-sm object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight">Axiss Nav</h1>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                    私有链接指挥台
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <DarkModeToggle />
                <Button variant="outline" size="icon" className="axiss-action-lift" asChild>
                  <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    <span className="sr-only">GitHub 仓库</span>
                  </a>
                </Button>
                {user ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="axiss-action-lift"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">退出</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="axiss-action-lift"
                    onClick={() => router.push("/login")}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="sr-only">登录</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <Input
                value={search}
                onChange={handleSearchChange}
                placeholder="搜索标题、网址、描述或标签"
                className="h-11 rounded-lg border-slate-950/10 bg-white/72 pl-10 pr-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur transition-all duration-200 focus-visible:shadow-[0_0_0_3px_rgba(59,130,124,0.14),inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-white/7"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="axiss-focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="清除搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="outline" size="icon" className="axiss-action-lift" asChild>
                <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub 仓库</span>
                </a>
              </Button>
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="axiss-action-lift"
                    onClick={() => handleBulkAnalyze("refresh")}
                    disabled={bulkAction !== null}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${bulkAction === "refresh" ? "animate-spin" : ""}`}
                    />
                    刷新网站信息
                  </Button>
                  <Button
                    variant="outline"
                    className="axiss-action-lift"
                    onClick={() => handleBulkAnalyze("untidy")}
                    disabled={bulkAction !== null}
                  >
                    <Sparkles
                      className={`h-4 w-4 ${bulkAction === "untidy" ? "animate-spin" : ""}`}
                    />
                    分析待整理
                  </Button>
                  <Button className="axiss-action-lift" onClick={handleAddClick}>
                    <BookmarkPlus className="h-4 w-4" />
                    收藏链接
                  </Button>
                </>
              ) : (
                <Button className="axiss-action-lift" onClick={() => router.push("/login")}>
                  <LogIn className="h-4 w-4" />
                  登录管理
                </Button>
              )}
              <DarkModeToggle />
              {user && (
                <Button variant="outline" className="axiss-action-lift" onClick={handleLogout}>
                  <UserRound className="h-4 w-4" />
                  {user.username}
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value)}
                  className="axiss-action-lift shrink-0"
                >
                  <ListFilter className="h-4 w-4" />
                  <span className="sm:hidden">{option.shortLabel}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                  <SelectTrigger
                    size="sm"
                    className="border-slate-950/10 bg-white/52 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] backdrop-blur dark:border-white/10 dark:bg-white/7 dark:text-slate-200"
                    aria-label="排序方式"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="axiss-action-lift"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  清除条件
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1400px] gap-6 px-4 py-6 pb-24 lg:grid-cols-[minmax(0,1fr)_21rem] lg:px-6 lg:pb-10">
        <section className="min-w-0 space-y-5">
          <section className="axiss-motion-fade-up axiss-shimmer-edge overflow-hidden rounded-lg border border-slate-950/8 bg-white/42 backdrop-blur dark:border-white/8 dark:bg-white/5">
            <div className="grid gap-px bg-slate-950/8 sm:grid-cols-3 dark:bg-white/8">
              {dashboardStats.map((item, index) => (
                <div
                  key={item.label}
                  className="axiss-motion-stat bg-white/54 p-4 dark:bg-[#101a20]/72 sm:min-h-[7.25rem]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {item.label}
                    </p>
                    <item.icon className="axiss-icon-drift h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="font-mono text-4xl font-semibold tracking-tight text-slate-950 transition-colors duration-200 dark:text-slate-100">
                      {item.value}
                    </span>
                    <span className="rounded-md bg-slate-950/5 px-2 py-1 text-xs text-slate-500 dark:bg-white/7 dark:text-slate-400">
                      {item.hint}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {(activeTag || searchQuery || activeCategory) && (
            <div className="axiss-motion-fade-up flex flex-wrap items-center gap-2">
              {activeTag && (
                <Badge variant="secondary" className="axiss-action-lift gap-1.5">
                  标签 {activeTag}
                  <button type="button" onClick={() => setActiveTag("")} aria-label="清除标签">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="outline" className="axiss-action-lift">
                  搜索 {searchQuery}
                </Badge>
              )}
              {activeCategory && (
                <Badge variant="outline" className="axiss-action-lift gap-1.5">
                  分类 {activeCategory}
                  <button type="button" onClick={() => setActiveCategory("")} aria-label="清除分类">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {userLoading || loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <LinkCardSkeleton key={index} />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="axiss-motion-fade-up axiss-panel flex min-h-[22rem] flex-col items-center justify-center rounded-lg border-dashed px-6 py-12 text-center">
              <div className="axiss-brand-mark mb-5 h-12 w-12 rounded-lg text-sm font-semibold">
                AX
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                没有匹配的链接
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                调整搜索词或清除筛选条件。已登录时也可以直接收藏一个新链接。
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" className="axiss-action-lift" onClick={clearFilters}>
                    清除条件
                  </Button>
                )}
                {user && (
                  <Button className="axiss-action-lift" onClick={handleAddClick}>
                    <Plus className="h-4 w-4" />
                    收藏链接
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {links.map((link, index) => (
                  <LinkCard
                    key={link.id}
                    id={link.id}
                    title={link.title}
                    url={link.url}
                    description={link.description ?? undefined}
                    icon={link.icon ?? undefined}
                    tags={link.tags}
                    category={link.category ?? undefined}
                    analysisStatus={link.analysisStatus}
                    isAvailable={link.isAvailable}
                    clickCount={link.clickCount}
                    onTagClick={handleTagClick}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReanalyze={handleReanalyze}
                    isLoggedIn={!!user}
                    isHighlighted={highlightedLinkId === link.id}
                    motionDelay={Math.min(index, 12) * 45}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LinkCardSkeleton key={`more-${index}`} />
                  ))}
                </div>
              )}

              {!hasMore && (
                <div className="axiss-motion-fade-up py-6 text-center text-sm text-slate-400">
                  已加载全部内容
                </div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[8.5rem] lg:self-start">
          <section className="axiss-motion-side axiss-panel axiss-shimmer-edge space-y-4 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  工作台摘要
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  当前视图、权限和整理状态。
                </p>
              </div>
              <div className="rounded-md bg-primary px-2 py-1 font-mono text-xs text-primary-foreground">
                {links.length}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="axiss-surface-row flex items-center justify-between rounded-md px-3 py-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">视图</span>
                <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {activeFilterLabel}
                </span>
              </div>
              <div className="axiss-surface-row flex items-center justify-between rounded-md px-3 py-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">排序</span>
                <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {activeSortLabel}
                </span>
              </div>
              <div className="axiss-surface-row flex items-center justify-between rounded-md px-3 py-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">权限</span>
                <span className="text-sm font-medium text-slate-950 dark:text-slate-100">
                  {user ? "可管理" : "只读"}
                </span>
              </div>
            </div>

            {!user && !userLoading && (
              <Button
                variant="outline"
                className="axiss-action-lift w-full justify-between"
                onClick={() => router.push("/login")}
              >
                登录后管理链接
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </section>

          <div className="axiss-motion-side axiss-panel rounded-lg p-4 [animation-delay:90ms]">
            <RecommendedLinks initialLinks={initialRecommendedLinks} />
          </div>
          <div className="axiss-motion-side axiss-panel rounded-lg p-4 [animation-delay:160ms]">
            <RandomTags initialTags={initialTags} onTagClick={handleTagClick} />
          </div>
          {categories.length > 0 && (
            <section className="axiss-motion-side axiss-panel space-y-3 rounded-lg p-4 [animation-delay:230ms]">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  当前分类
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">来自当前结果</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    className="axiss-action-lift cursor-pointer"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className="axiss-motion-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-950/10 bg-[#f4f7f7]/88 px-4 py-3 backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-[#091015]/88">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="axiss-action-lift"
            onClick={() =>
              document.querySelector<HTMLInputElement>("input[placeholder^='搜索']")?.focus()
            }
          >
            <Search className="h-4 w-4" />
            搜索
          </Button>
          <Button size="sm" className="axiss-action-lift" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            收藏
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="axiss-action-lift"
            onClick={() => setFilter(filter === "all" ? "frequent" : "all")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            筛选
          </Button>
        </div>
      </div>

      <AddLinkDialog
        open={addDialogOpen}
        onOpenChange={handleDialogOpenChange}
        initialUrl={initialUrl}
        onSuccess={fetchLinks}
        onLocateExistingLink={handleLocateExistingLink}
      />

      <AddLinkDialog
        open={!!editingLink}
        onOpenChange={(open) => {
          if (!open) setEditingLink(null);
        }}
        mode="edit"
        link={editingLink}
        onSuccess={fetchLinks}
        onLocateExistingLink={handleLocateExistingLink}
      />
    </main>
  );
}
