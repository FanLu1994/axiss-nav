"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LinkCard } from "@/components/link-card"
import { RandomTags } from "@/components/random-tags"
import { Particles } from "@/components/particles"
import { Toaster } from "@/components/ui/sonner"
import { InfiniteVirtualScroll } from "@/components/infinite-virtual-scroll"
import { useResponsiveColumns } from "@/components/use-responsive-columns"
import { useContainerHeight } from "@/components/use-container-height"
import { useRouter } from "next/navigation"
import {toast} from "sonner"

export default function Home() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [form, setForm] = useState({ url: "" })
  const [tagSeed, setTagSeed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()
  const columns = useResponsiveColumns()
  const containerHeight = useContainerHeight(300)
  const pageSize = 20

  // 检查用户登录状态
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token有效性
      fetchUserInfo(token)
    }
  }, [])

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  // 加载初始数据
  const fetchInitialLinks = async (searchQuery = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: pageSize.toString(),
        ...(searchQuery && { search: searchQuery })
      })
      
      const res = await fetch(`/api/links?${params}`)
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        setLinks(response.data)
        setTotalCount(response.pagination.total)
      } else {
        setLinks([])
        setTotalCount(0)
        if (response.error) {
          console.error('获取链接失败:', response.error)
        }
      }
    } catch (error) {
      console.error('获取链接失败:', error)
      setLinks([])
      setTotalCount(0)
    }
    setLoading(false)
  }

  // 加载更多数据
  const loadMoreLinks = async (page: number, searchQuery?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchQuery && { search: searchQuery })
      })
      
      const res = await fetch(`/api/links?${params}`)
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          hasMore: response.pagination.hasMore
        }
      } else {
        return { data: [], hasMore: false }
      }
    } catch (error) {
      console.error('加载更多链接失败:', error)
      return { data: [], hasMore: false }
    }
  }

  useEffect(() => {
    fetchInitialLinks()
  }, [])

  // 当搜索条件改变时重新获取数据
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchInitialLinks(search)
    }, 300) // 防抖处理

    return () => clearTimeout(delayedSearch)
  }, [search])

  // 添加新链接
  const handleAdd = async () => {
    if (!user) {
      setOpen(false)
      return
    }
    
    if (!form.url.trim()) {
      toast.error("网址不能为空")
      return
    }
    
    // 简单的URL格式验证
    if (!form.url.startsWith('http://') && !form.url.startsWith('https://')) {
      toast.error("请输入完整的网址（需要包含 http:// 或 https://）")
      return
    }
    
    const token = localStorage.getItem('token')
    setAddingLink(true)
    
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          url: form.url.trim()
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success("添加成功！正在获取网站信息...")
        setForm({ url: "" })
        setOpen(false)
        // 刷新数据
        fetchInitialLinks(search)
      } else if (res.status === 409) {
        // 处理URL重复的情况
        toast.error(`该网址已存在：${data.existingLink?.title || data.existingLink?.url || ''}`)
      } else if (res.status === 401) {
        toast.error("登录已过期，请重新登录")
        localStorage.removeItem('token')
        setUser(null)
        setOpen(false)
      } else {
        toast.error(data.error || "添加失败，请稍后重试")
      }
    } catch (error) {
      console.error('添加链接失败:', error)
      toast.error("网络错误，请检查网络连接后重试")
    } finally {
      setAddingLink(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleTagClick = (tag: string) => {
    setSearch(tag)
  }

  const handleRefreshTags = () => {
    setTagSeed(prev => prev + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success("已退出登录")
  }

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12 relative">
      <Particles />
      
      {/* 右上角登录状态 */}
      <div className="absolute top-4 right-4 z-20 group">
        {user ? (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-sm text-gray-500">欢迎，{user.username}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="bg-white/60 backdrop-blur-sm border-gray-200/50 text-gray-600 hover:bg-white/80 hover:text-gray-700"
            >
              退出
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleLogin}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-gray-600 hover:bg-white/30 backdrop-blur-sm border border-gray-200/30 hover:border-gray-300/50 transition-all duration-200"
          >
            登录
          </Button>
        )}
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center mb-8 relative z-10">
        {/* 随机标签 */}
        <RandomTags
          onTagClick={handleTagClick}
          onRefresh={handleRefreshTags}
          tagSeed={tagSeed}
        />
        
        <div className="flex w-full max-w-md gap-3 mb-8">
          <div className="relative flex-1">
            <Input
              placeholder="搜索网址..."
              value={search}
              onChange={handleInputChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent !border-0 !border-b-2 !border-transparent focus:!ring-0 focus:!ring-offset-0 focus:outline-none !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!shadow-none px-4 py-3 pr-10 text-gray-700 placeholder:text-gray-400 transition-all duration-300 !rounded-none"
            />
            {/* 虚线动画效果 */}
            <div className="absolute bottom-0 left-0 w-full h-px">
              <div 
                className={`h-full transition-all ${
                  isSearchFocused 
                    ? 'w-full duration-500 ease-out' 
                    : 'w-0 duration-300 ease-in'
                }`}
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, #9ca3af 3px, #9ca3af 6px)',
                  backgroundSize: '6px 1px',
                  transformOrigin: 'left'
                }}
              ></div>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-full p-1.5 transition-all duration-200"
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="rounded-full w-10 h-10 p-0 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60 text-lg font-light cursor-pointer" 
                  size="sm"
                  variant="outline"
                >
                  +
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm w-full">
                <DialogHeader>
                  <DialogTitle>添加网址</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="网址（https://...）"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    disabled={addingLink}
                  />
                  <div className="text-sm text-gray-500">
                    只需输入网址，系统会自动获取标题和图标
                  </div>
                  <Button 
                    className="w-full mt-2" 
                    onClick={handleAdd} 
                    size="lg"
                    disabled={addingLink}
                  >
                    {addingLink ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        添加中...
                      </div>
                    ) : (
                      "保存"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="w-full max-w-6xl relative z-10">
        {loading ? (
          <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            加载中...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            暂无收藏网址
          </div>
        ) : (
          <InfiniteVirtualScroll
            initialItems={links}
            totalCount={totalCount}
            itemHeight={90}
            containerHeight={containerHeight}
            columns={columns}
            pageSize={pageSize}
            loadMore={loadMoreLinks}
            gap={6}
            className=" backdrop-blur-sm rounded-xl p-4"
            search={search}
            loading={loading}
            hideScrollbar={true}
            renderItem={(link: any) => (
              <LinkCard
                key={link.id}
                {...link}
                onTagClick={handleTagClick}
              />
            )}
          />
        )}
      </div>
    </main>
  )
}