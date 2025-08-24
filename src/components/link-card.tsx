"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface LinkCardProps {
  id: string
  title: string
  url: string
  description?: string
  icon?: string
  tags?: string[] // 现在是字符串数组
  onTagClick?: (tag: string) => void
  onDelete?: (id: string) => void
  isLoggedIn?: boolean
  onContextMenu?: (e: React.MouseEvent, linkId: string) => void
  children?: React.ReactNode
}

export function LinkCard({ 
  id, 
  title, 
  url, 
  description, 
  icon, 
  tags, 
  onTagClick, 
  onDelete, 
  isLoggedIn, 
  onContextMenu, 
  children 
}: LinkCardProps) {
  const [isReanalyzing, setIsReanalyzing] = useState(false)

  const handleClick = async () => {
    try {
      // 记录点击
      await fetch('/api/links/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId: id })
      })
      
      // 打开链接
      window.open(url, '_blank')
    } catch (error) {
      console.error('记录点击失败:', error)
      // 即使记录失败也打开链接
      window.open(url, '_blank')
    }
  }

  const handleReanalyze = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isLoggedIn) {
      toast.error('请先登录')
      return
    }

    setIsReanalyzing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/links/reanalyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkId: id })
      })

      if (response.ok) {
        toast.success('重新分析完成')
        // 可以在这里刷新页面或更新数据
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || '重新分析失败')
      }
    } catch (error) {
      console.error('重新分析失败:', error)
      toast.error('重新分析失败')
    } finally {
      setIsReanalyzing(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isLoggedIn) {
      toast.error('请先登录')
      return
    }

    if (!confirm('确定要删除这个链接吗？')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/links?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('删除成功')
        onDelete?.(id)
      } else {
        const error = await response.json()
        toast.error(error.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer w-80 h-36">
      <CardContent className="p-4 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex items-start gap-3 flex-1 min-w-0" onClick={handleClick}>
            {/* 左侧大图标 */}
            <div className="flex-shrink-0">
              {icon ? (
                <img 
                  src={icon} 
                  alt="网站图标" 
                  className="w-12 h-12 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <img 
                    src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`}
                    alt="网站图标" 
                    className="w-8 h-8"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors mb-1">
                  {title}
                </h3>
                
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {description || url}
                </p>
              </div>

              {/* 底部标签和操作按钮 */}
              <div className="flex items-center justify-between">
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                    {tags.slice(0, 4).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTagClick?.(tag)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                {isLoggedIn && (
                  <div className="flex items-center gap-1 ml-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReanalyze}
                            disabled={isReanalyzing}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RefreshCw className={`w-3 h-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>重新分析</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除链接</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  )
}
