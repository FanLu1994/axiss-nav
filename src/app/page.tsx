"use client"

import { useState, ChangeEvent, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LinkCard } from "@/components/link-card"
import { AddLinkDialog } from "@/components/add-link-dialog"
import { RandomTags } from "@/components/random-tags"
import { RecommendedLinks } from "@/components/recommended-links"
import { Particles } from "@/components/particles"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

import { InfiniteVirtualScroll } from "@/components/infinite-virtual-scroll"
import { useResponsiveColumns } from "@/components/use-responsive-columns"
import { useContainerHeight } from "@/components/use-container-height"
import { useRouter } from "next/navigation"
import {toast} from "sonner"

// 用户类型
interface User {
  id: string
  username: string
  email: string
  role: string
}

// 链接类型
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
  tags: Array<{
    id: string
    name: string
    icon?: string
    color?: string
  }>
  user: {
    id: string
    username: string
  }
}

export default function Home() {
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [links, setLinks] = useState<Link[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [tagSeed, setTagSeed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [viewMode, setViewMode] = useState<'normal' | 'compact' | 'table'>('normal')
  const router = useRouter()
  const columns = useResponsiveColumns()
  const containerHeight = useContainerHeight(300)
  const pageSize = 20

  // 初始化视图模式（从本地存储读取）
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode') as 'normal' | 'compact' | 'table' | null
    if (savedViewMode && ['normal', 'compact', 'table'].includes(savedViewMode)) {
      setViewMode(savedViewMode)
    }
  }, [])

  // 检查是否需要初始化
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const res = await fetch('/api/init/check')
        const data = await res.json()
        
        if (data.needsInitialization) {
          // 需要初始化，重定向到初始化页面
          router.push('/init')
          return
        }
        
        // 不需要初始化，继续检查用户登录状态
        const token = localStorage.getItem('token')
        if (token) {
          // 验证token有效性
          fetchUserInfo(token)
        }
      } catch (error) {
        console.error('检查初始化状态失败:', error)
        // 如果检查失败，继续正常流程
        const token = localStorage.getItem('token')
        if (token) {
          fetchUserInfo(token)
        }
      }
    }
    
    checkInitialization()
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
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  // 加载初始数据
  const fetchInitialLinks = useCallback(async (searchQuery = "") => {
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
  }, [pageSize])

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

  const handleAddSuccess = () => {
    fetchInitialLinks(search)
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

  const handleDelete = async (linkId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error("请先登录")
      return
    }

    try {
      const res = await fetch(`/api/links?id=${linkId}`, {
        method: "DELETE",
        headers: {
          "authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast.success("删除成功！")
        // 重新获取数据
        fetchInitialLinks(search)
      } else {
        const data = await res.json()
        toast.error(data.error || "删除失败")
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error("网络错误，请稍后重试")
    }
  }

  const handleViewModeChange = () => {
    const modes: ('normal' | 'compact' | 'table')[] = ['normal', 'compact', 'table']
    
    const currentIndex = modes.indexOf(viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    const newMode = modes[nextIndex]
    
    setViewMode(newMode)
    localStorage.setItem('viewMode', newMode)

  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center px-2 py-12 relative transition-colors duration-200">
      <Particles />
      
      {/* 右上角登录状态 */}
      <div className="absolute top-4 right-4 z-20 group">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {user ? (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400">欢迎，{user.username}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
              >
                退出
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleLogin}
              size="sm"
              variant="ghost"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30 hover:border-gray-300/50 dark:hover:border-gray-500/50 transition-all duration-200"
            >
              登录
            </Button>
          )}
        </div>
      </div>

      {/* 右下角功能按钮 */}
      <div className="fixed bottom-4 right-4 z-20 flex flex-col gap-2">
        <DarkModeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewModeChange}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
          title={
            viewMode === 'normal' ? '切换到简约模式' : 
            viewMode === 'compact' ? '切换到表格模式' : 
            '切换到卡片模式'
          }
        >
          {viewMode === 'normal' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ) : viewMode === 'compact' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 10h18M3 16h18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          )}
        </Button>
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center mb-8 relative z-10">
        <div className="flex w-full max-w-md gap-3 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="搜索网址..."
              value={search}
              onChange={handleInputChange}
              onMouseEnter={() => setIsSearchFocused(true)}
              onMouseLeave={() => setIsSearchFocused(false)}
              className="w-full bg-transparent !border-0 !border-b-2 !border-transparent focus:!ring-0 focus:!ring-offset-0 focus:outline-none !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!shadow-none px-4 py-3 pr-10 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 !rounded-none"
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 rounded-full p-1.5 transition-all duration-200"
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
            <>
              <Button 
                className="rounded-full w-10 h-10 p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300/60 dark:hover:border-gray-500/60 text-lg font-light cursor-pointer" 
                size="sm"
                variant="outline"
                onClick={() => setAddDialogOpen(true)}
              >
                +
              </Button>
              <AddLinkDialog
                isOpen={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={handleAddSuccess}
              />
            </>
          )}
        </div>
        
        {/* 随机标签 */}
        <RandomTags
          onTagClick={handleTagClick}
          onRefresh={handleRefreshTags}
          tagSeed={tagSeed}
        />
      </div>
      
      {/* 推荐网站 */}
      <div className="w-full max-w-7xl relative z-10">
        <RecommendedLinks />
      </div>
      
      <div className="w-full max-w-7xl relative z-10">
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
            itemHeight={
              viewMode === 'compact' ? 80 : 
              viewMode === 'table' ? 32 : 
              90
            }
            containerHeight={containerHeight}
            columns={
              viewMode === 'compact' ? Math.floor(columns * 2) : 
              viewMode === 'table' ? 1 : 
              columns
            }
            loadMore={loadMoreLinks}
            gap={viewMode === 'table' ? 0 : 6}
            className=" backdrop-blur-sm rounded-xl p-3"
            search={search}
            loading={loading}
            hideScrollbar={true}
            renderItem={(link: Link) => (
              <LinkCard
                key={link.id}
                id={link.id}
                title={link.title}
                url={link.url}
                description={link.description}
                icon={link.icon}
                order={link.order}
                isActive={link.isActive}
                clickCount={link.clickCount}
                createdAt={new Date(link.createdAt)}
                updatedAt={new Date(link.updatedAt)}
                tags={link.tags.map(tag => tag.name)}
                onTagClick={handleTagClick}
                onDelete={handleDelete}
                isLoggedIn={!!user}
                mode={viewMode}
              />
            )}
          />
        )}
      </div>
    </main>
  )
}