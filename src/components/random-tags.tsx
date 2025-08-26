"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Tag {
  name: string
  count: number
  icon?: string
  color?: string
}

export function RandomTags({ onTagClick }: { onTagClick?: (tag: string) => void }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // 添加时间戳防止缓存，刷新时使用随机emoji
      const params = new URLSearchParams()
      if (forceRefresh) {
        params.set('t', Date.now().toString())
        params.set('randomEmoji', 'true') // 刷新时使用随机emoji
      }
      const queryString = params.toString()
      const url = `/api/tags${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        // 直接使用API返回的数据，包含emoji
        setTags(data.data || [])
      } else {
        console.error('获取标签失败')
      }
    } catch (error) {
      console.error('获取标签错误:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchTags(true)
  }

  const handleTagClick = (tagName: string) => {
    onTagClick?.(tagName)
  }

  if (loading) {
    return null // 直接返回null，让skeleton组件显示
  }

  if (tags.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-4 py-2">
      <div className="flex items-center justify-center mb-3">
        <h3 className="text-sm font-medium text-gray-700 mr-2">热门标签</h3>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs bg-white/60 backdrop-blur-sm border-gray-200/40 hover:bg-blue-50/60 hover:border-blue-200/60 cursor-pointer"
        >
          {refreshing ? (
            <span className="animate-spin">🔄</span>
          ) : (
            <span>🎲</span>
          )}
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-1">
        {tags.slice(0, 7).map((tag, index) => (
          <button
            key={`${tag.name}-${index}`}
            onClick={() => handleTagClick(tag.name)}
            className="px-2 py-1 text-xs font-medium text-gray-600 rounded-full border border-gray-200/40 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200/60 transition-all duration-200 cursor-pointer whitespace-nowrap bg-white/60 backdrop-blur-sm shadow-sm flex items-center gap-1"
          >
            <span className="text-xs">{tag.icon}</span>
            <span>{tag.name}</span>
            <span className="ml-1 text-xs opacity-50">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  )
} 