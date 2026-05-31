"use client"

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LinkCard } from "@/components/link-card"
import { LinkCardSkeleton } from "@/components/link-card-skeleton"
import { AddLinkDialog, EditableLink } from "@/components/add-link-dialog"
import { RandomTags } from "@/components/random-tags"
import { RecommendedLinks } from "@/components/recommended-links"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { VisualBackdrop } from "@/components/visual-backdrop"
import { LogIn, LogOut, Plus, Search, SlidersHorizontal, UserRound, X } from "lucide-react"

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface Link {
  id: string
  title: string
  url: string
  description?: string
  icon?: string
  order: number
  isActive: boolean
  clickCount: number
  createdAt: string
  updatedAt: string
  tags: string[]
  category?: string
  color?: string
}

type FilterOption = "all" | "frequent" | "recent" | "uncategorized"
type SortOption = "created_desc" | "created_asc" | "clicks_desc" | "title_asc"

const filterOptions: Array<{ value: FilterOption; label: string }> = [
  { value: "all", label: "全部" },
  { value: "frequent", label: "常用" },
  { value: "recent", label: "最近添加" },
  { value: "uncategorized", label: "未分类" }
]

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "created_desc", label: "最新添加" },
  { value: "created_asc", label: "最早添加" },
  { value: "clicks_desc", label: "点击最多" },
  { value: "title_asc", label: "标题 A-Z" }
]

function getLinkForEdit(link: Link): EditableLink {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description,
    icon: link.icon,
    tags: link.tags || [],
    category: link.category,
    color: link.color
  }
}

export default function Home() {
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [activeCategory, setActiveCategory] = useState("")
  const [filter, setFilter] = useState<FilterOption>("all")
  const [sort, setSort] = useState<SortOption>("created_desc")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<EditableLink | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialUrl, setInitialUrl] = useState("")
  const router = useRouter()

  const categories = useMemo(() => {
    return Array.from(new Set(links.map(link => link.category).filter(Boolean) as string[])).slice(0, 8)
  }, [links])

  const buildParams = useCallback((targetPage: number) => {
    const params = new URLSearchParams({
      page: targetPage.toString(),
      pageSize: "20",
      filter,
      sort
    })

    if (searchQuery) params.set("search", searchQuery)
    if (activeTag) params.set("tag", activeTag)
    if (activeCategory) params.set("category", activeCategory)

    return params
  }, [activeCategory, activeTag, filter, searchQuery, sort])

  const isValidUrl = useCallback((text: string): boolean => {
    try {
      const url = new URL(text.trim())
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  }, [])

  const readClipboardAndValidate = useCallback(async (): Promise<string> => {
    try {
      const text = await navigator.clipboard.readText()
      return isValidUrl(text.trim()) ? text.trim() : ""
    } catch {
      return ""
    }
  }, [isValidUrl])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    setPage(1)
    setHasMore(true)

    try {
      const response = await fetch(`/api/links?${buildParams(1)}`)
      const result = await response.json()

      if (response.ok && Array.isArray(result.data)) {
        setLinks(result.data)
        setHasMore(result.pagination?.hasMore || false)
      } else {
        setLinks([])
        setHasMore(false)
        if (result.error) {
          toast.error(result.error)
        }
      }
    } catch (error) {
      console.error("获取链接失败:", error)
      setLinks([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const loadMoreLinks = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const response = await fetch(`/api/links?${buildParams(nextPage)}`)
      const result = await response.json()

      if (response.ok && Array.isArray(result.data)) {
        setLinks(prev => [...prev, ...result.data])
        setPage(nextPage)
        setHasMore(result.pagination?.hasMore || false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("加载更多链接失败:", error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [buildParams, hasMore, loading, loadingMore, page])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem("token")
        const [initCheck, userInfo] = await Promise.allSettled([
          fetch("/api/init/check").then(res => res.json()),
          token ? fetch("/api/auth/me", {
            headers: { "authorization": `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : null) : Promise.resolve(null)
        ])

        if (initCheck.status === "fulfilled" && initCheck.value.needsInitialization) {
          router.push("/init")
          return
        }

        if (userInfo.status === "fulfilled" && userInfo.value) {
          setUser(userInfo.value)
        } else if (token) {
          localStorage.removeItem("token")
          setUser(null)
        }
      } catch (error) {
        console.error("应用初始化失败:", error)
        localStorage.removeItem("token")
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    }

    initializeApp()
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(search.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= documentHeight - 160) {
        loadMoreLinks()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadMoreLinks])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleAddClick = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setInitialUrl(await readClipboardAndValidate())
    setAddDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setAddDialogOpen(open)
    if (!open) {
      setInitialUrl("")
    }
  }

  const handleTagClick = (tag: string) => {
    setActiveTag(tag)
  }

  const handleEdit = (id: string) => {
    const link = links.find(item => item.id === id)
    if (link) {
      setEditingLink(getLinkForEdit(link))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast.success("已退出登录")
  }

  const handleDelete = async (linkId: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("请先登录")
      return
    }

    try {
      const response = await fetch(`/api/links?id=${linkId}`, {
        method: "DELETE",
        headers: { "authorization": `Bearer ${token}` }
      })
      const result = await response.json()

      if (response.ok) {
        toast.success("链接已删除")
        fetchLinks()
      } else {
        toast.error(result.error || "删除失败")
      }
    } catch (error) {
      console.error("删除失败:", error)
      toast.error("网络错误，请稍后重试")
    }
  }

  const handleReanalyze = async (linkId: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("请先登录")
      return
    }

    try {
      const response = await fetch("/api/links/reanalyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ linkId })
      })
      const result = await response.json()

      if (response.ok) {
        toast.success("重新分析完成")
        fetchLinks()
      } else {
        toast.error(result.error || "重新分析失败")
      }
    } catch (error) {
      console.error("重新分析请求失败:", error)
      toast.error("重新分析请求失败")
    }
  }

  const clearFilters = () => {
    setSearch("")
    setSearchQuery("")
    setActiveTag("")
    setActiveCategory("")
    setFilter("all")
    setSort("created_desc")
  }

  const hasActiveFilters = searchQuery || activeTag || activeCategory || filter !== "all" || sort !== "created_desc"

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-950 transition-colors duration-200 dark:text-slate-100">
      <VisualBackdrop />
      <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-[#edf1ea]/72 backdrop-blur-xl dark:border-emerald-100/10 dark:bg-[#06100f]/76">
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="hidden h-11 w-11 items-center justify-center rounded-md border border-emerald-950/10 bg-emerald-950 text-sm font-semibold text-[#f5f0df] shadow-sm sm:flex dark:border-emerald-100/10 dark:bg-[#d8cfaa] dark:text-emerald-950">
                  AX
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Axiss Nav</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">个人导航工作台</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <DarkModeToggle />
                {user ? (
                  <Button variant="outline" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">退出</span>
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" onClick={() => router.push("/login")}>
                    <LogIn className="h-4 w-4" />
                    <span className="sr-only">登录</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="搜索标题、网址、描述、标签"
                  className="h-11 border-emerald-950/10 bg-white/70 pl-9 shadow-sm backdrop-blur dark:border-emerald-100/10 dark:bg-emerald-950/30"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="清除搜索"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                {user ? (
                  <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4" />
                    添加链接
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/login")}>
                    <LogIn className="h-4 w-4" />
                    登录
                  </Button>
                )}
                <DarkModeToggle />
                {user && (
                  <Button variant="outline" onClick={handleLogout}>
                    <UserRound className="h-4 w-4" />
                    {user.username}
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value)}
                  className="shrink-0 shadow-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="h-9 rounded-md border border-emerald-950/10 bg-white/70 px-3 text-sm text-slate-700 shadow-sm outline-none backdrop-blur transition-colors focus:border-emerald-800/40 dark:border-emerald-100/10 dark:bg-emerald-950/30 dark:text-slate-200"
                aria-label="排序方式"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  清除筛选
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-6 lg:pb-10">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {activeTag && (
              <Badge variant="secondary" className="rounded-md">
                标签：{activeTag}
                <button type="button" onClick={() => setActiveTag("")} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="rounded-md">
                搜索：{searchQuery}
              </Badge>
            )}
            {activeCategory && (
              <Badge variant="outline" className="rounded-md">
                分类：{activeCategory}
                <button type="button" onClick={() => setActiveCategory("")} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

          {userLoading || loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <LinkCardSkeleton key={index} />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="axiss-panel flex min-h-[20rem] flex-col items-center justify-center rounded-lg border-dashed px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">没有找到链接</h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                可以清除筛选条件，或添加一个新的收藏链接。
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>清除筛选</Button>
                )}
                {user && (
                  <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4" />
                    添加链接
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {links.map(link => (
                  <LinkCard
                    key={link.id}
                    id={link.id}
                    title={link.title}
                    url={link.url}
                    description={link.description}
                    icon={link.icon}
                    tags={link.tags}
                    category={link.category}
                    clickCount={link.clickCount}
                    onTagClick={handleTagClick}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReanalyze={handleReanalyze}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LinkCardSkeleton key={`more-${index}`} />
                  ))}
                </div>
              )}

              {!hasMore && (
                <div className="py-6 text-center text-sm text-slate-400">已加载全部内容</div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
          <div className="axiss-panel rounded-lg p-4">
            <RecommendedLinks />
          </div>
          <div className="axiss-panel rounded-lg p-4">
            <RandomTags onTagClick={handleTagClick} />
          </div>
          {categories.length > 0 && (
            <section className="axiss-panel space-y-3 rounded-lg p-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">当前分类</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">来自当前结果</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    className="cursor-pointer rounded-md"
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-[#eef1ea]/84 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-emerald-100/10 dark:bg-[#06100f]/86">
        <div className="mx-auto flex max-w-md items-center justify-around gap-2">
          <Button variant="ghost" size="sm" onClick={() => document.querySelector<HTMLInputElement>("input[placeholder^='搜索']")?.focus()}>
            <Search className="h-4 w-4" />
            搜索
          </Button>
          <Button size="sm" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            添加
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFilter(filter === "all" ? "frequent" : "all")}>
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
      />

      <AddLinkDialog
        open={!!editingLink}
        onOpenChange={(open) => {
          if (!open) setEditingLink(null)
        }}
        mode="edit"
        link={editingLink}
        onSuccess={fetchLinks}
      />
    </main>
  )
}
