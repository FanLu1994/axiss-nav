"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LinkCard } from "@/components/link-card"
import { AddLinkDialog } from "@/components/add-link-dialog"
import { RandomTags } from "@/components/random-tags"
import { Particles } from "@/components/particles"

import { InfiniteVirtualScroll } from "@/components/infinite-virtual-scroll"
import { useResponsiveColumns } from "@/components/use-responsive-columns"
import { useContainerHeight } from "@/components/use-container-height"
import { useRouter } from "next/navigation"
import {toast} from "sonner"

export default function Home() {
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [tagSeed, setTagSeed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [viewMode, setViewMode] = useState<'normal' | 'compact' | 'table'>('normal')
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
    } catch {
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-2 py-12 relative">
      <Particles />
      
      {/* 右上角登录状态和视图切换 */}
      <div className="absolute top-4 right-4 z-20 group">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* 视图模式切换 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const modes: ('normal' | 'compact' | 'table')[] = ['normal', 'compact', 'table']
              const currentIndex = modes.indexOf(viewMode)
              const nextIndex = (currentIndex + 1) % modes.length
              setViewMode(modes[nextIndex])
            }}
            className="bg-white/60 backdrop-blur-sm border-gray-200/50 text-gray-600 hover:bg-white/80 hover:text-gray-700"
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
          
          {user ? (
            <>
              <span className="text-sm text-gray-500">欢迎，{user.username}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/60 backdrop-blur-sm border-gray-200/50 text-gray-600 hover:bg-white/80 hover:text-gray-700"
              >
                退出
              </Button>
            </>
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
              onMouseEnter={() => setIsSearchFocused(true)}
              onMouseLeave={() => setIsSearchFocused(false)}
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
            <>
              <Button 
                className="rounded-full w-10 h-10 p-0 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60 text-lg font-light cursor-pointer" 
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
                user={user}
              />
            </>
          )}
        </div>
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
            pageSize={pageSize}
            loadMore={loadMoreLinks}
            gap={viewMode === 'table' ? 0 : 6}
            className=" backdrop-blur-sm rounded-xl p-3"
            search={search}
            loading={loading}
            hideScrollbar={true}
            renderItem={(link: any) => (
              <LinkCard
                key={link.id}
                {...link}
                onTagClick={handleTagClick}
                mode={viewMode}
              />
            )}
          />
        )}
      </div>
    </main>
  )
}