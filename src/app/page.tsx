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

import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [contextMenuLinkId, setContextMenuLinkId] = useState<string | null>(null)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const router = useRouter()

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
          await fetchUserInfo(token)
        } else {
          setUserLoading(false)
        }
      } catch (error) {
        console.error('检查初始化状态失败:', error)
        // 如果检查失败，继续正常流程
        const token = localStorage.getItem('token')
        if (token) {
          await fetchUserInfo(token)
        } else {
          setUserLoading(false)
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
        console.log('用户信息获取成功:', userData)
        setUser(userData)
      } else {
        console.log('用户信息获取失败，清除token')
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      console.log('用户信息获取异常:', error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setUserLoading(false)
    }
  }

  // 加载初始数据
  const fetchLinks = useCallback(async (searchQuery = "") => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '20',
        ...(searchQuery && { search: searchQuery })
      })
      
      const res = await fetch(`/api/links?${params}`)
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        setLinks(response.data)
        setHasMore(response.pagination?.hasMore || false)
      } else {
        setLinks([])
        setHasMore(false)
        if (response.error) {
          console.error('获取链接失败:', response.error)
        }
      }
    } catch (error) {
      console.error('获取链接失败:', error)
      setLinks([])
      setHasMore(false)
    }
    setLoading(false)
  }, [])

  // 加载更多数据
  const loadMoreLinks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        page: nextPage.toString(),
        pageSize: '20',
        ...(search && { search: search })
      })
      
      const res = await fetch(`/api/links?${params}`)
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        setLinks(prev => [...prev, ...response.data])
        setPage(nextPage)
        setHasMore(response.pagination?.hasMore || false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('加载更多链接失败:', error)
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [page, hasMore, loadingMore, search])

  // 等待用户状态加载完成后再加载链接数据
  useEffect(() => {
    if (!userLoading) {
      fetchLinks()
    }
  }, [userLoading, fetchLinks])

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // 当滚动到距离底部100px时触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMoreLinks()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreLinks])

  // 当搜索条件改变时重新获取数据
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchLinks(search)
    }, 300) // 防抖处理

    return () => clearTimeout(delayedSearch)
  }, [search, fetchLinks])

  const handleAddSuccess = () => {
    fetchLinks(search)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleTagClick = (tag: string) => {
    setSearch(tag)
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
        fetchLinks(search)
      } else {
        const data = await res.json()
        toast.error(data.error || "删除失败")
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error("网络错误，请稍后重试")
    }
  }

  // 右键菜单处理函数
  const handleContextMenu = (e: React.MouseEvent, linkId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // 如果菜单已经显示，只更新位置和链接ID
    if (showContextMenu) {
      setContextMenuPosition({ x: e.screenX, y: e.screenY })
      setContextMenuLinkId(linkId)
    } else {
      // 如果菜单未显示，显示菜单并设置位置
      setContextMenuPosition({ x: e.screenX, y: e.screenY })
      setContextMenuLinkId(linkId)
      setShowContextMenu(true)
    }
  }

  // 重新分析链接
  const handleReanalyze = async (linkId: string) => {
    setIsReanalyzing(true)
    setShowContextMenu(false)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('未找到认证令牌')
        return
      }

      const response = await fetch('/api/links/reanalyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkId })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('重新分析成功:', result)
        toast.success('重新分析成功')
        // 重新获取数据
        fetchLinks(search)
      } else {
        const error = await response.json()
        console.error('重新分析失败:', error)
        toast.error('重新分析失败: ' + (error.error || '未知错误'))
      }
    } catch (error) {
      console.error('重新分析请求失败:', error)
      toast.error('重新分析请求失败')
    } finally {
      setIsReanalyzing(false)
    }
  }

  // 全局点击事件监听器来关闭右键菜单
  useEffect(() => {
    let contextMenuElement: Element | null = null

    const handleGlobalClick = (e: MouseEvent) => {
      // 检查点击是否在右键菜单外部
      if (contextMenuElement && !contextMenuElement.contains(e.target as Node)) {
        setShowContextMenu(false)
      }
    }

    const handleGlobalContextMenu = (e: MouseEvent) => {
      // 检查是否点击在右键菜单内部
      if (contextMenuElement && contextMenuElement.contains(e.target as Node)) {
        return // 如果点击在菜单内部，不关闭菜单
      }
      
      // 检查是否点击在 link-card 上
      const linkCard = (e.target as Element)?.closest('[data-link-card]')
      if (linkCard) {
        return // 如果点击在 link-card 上，不关闭菜单，让 link-card 自己的处理函数处理
      }
      
      // 在其他地方右键点击时关闭菜单
      setShowContextMenu(false)
    }

    if (showContextMenu) {
      // 缓存 DOM 元素引用，避免重复查询
      contextMenuElement = document.querySelector('[data-context-menu]')
      document.addEventListener('click', handleGlobalClick)
      document.addEventListener('contextmenu', handleGlobalContextMenu)
      return () => {
        document.removeEventListener('click', handleGlobalClick)
        document.removeEventListener('contextmenu', handleGlobalContextMenu)
      }
    }
  }, [showContextMenu])

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center px-2 py-12 relative transition-colors duration-200">
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
          onRefresh={() => {}}
          tagSeed={0}
        />
      </div>
      
      {/* 推荐网站 */}
      <div className="w-full max-w-7xl relative z-10">
        <RecommendedLinks />
      </div>
      
      <div className="w-full max-w-7xl relative z-10">
        {userLoading ? (
          <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            加载用户信息中...
          </div>
        ) : loading ? (
          <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            加载中...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            暂无收藏网址
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 p-3 backdrop-blur-sm rounded-xl justify-center">
                             {links.map((link: Link) => {
                 return (
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
                     onContextMenu={handleContextMenu}
                   />
                )
              })}
            </div>
            {loadingMore && (
              <div className="text-center text-gray-400 py-8 text-lg">
                加载更多中...
              </div>
            )}
            {!hasMore && links.length > 0 && (
              <div className="text-center text-gray-400 py-8 text-lg">
                已加载全部内容
              </div>
            )}
          </>
                 )}
       </div>

               {/* 自定义右键菜单 */}
        {showContextMenu && user && contextMenuLinkId && (
          <div
            data-context-menu
            className="fixed z-[9999] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/60 dark:border-gray-600/60 rounded-xl shadow-2xl py-2 min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-100"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              transform: 'translateY(-100%)'
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleReanalyze(contextMenuLinkId)
              }}
              disabled={isReanalyzing}
              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-150 group"
            >
              <span className="text-blue-500 group-hover:text-blue-600 dark:text-blue-400 dark:group-hover:text-blue-300">
                {isReanalyzing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </span>
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                {isReanalyzing ? '分析中...' : '重新分析'}
              </span>
            </button>
            <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-1" />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowContextMenu(false)
                handleDelete(contextMenuLinkId)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors duration-150 group"
            >
              <span className="text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                删除收藏
              </span>
            </button>
          </div>
        )}
     </main>
   )
 }