"use client"

import { useState, useEffect } from "react"
import { Tags } from "lucide-react"

interface Tag {
  name: string
  count: number
  icon?: string
  color?: string
}

export function RandomTags({ onTagClick }: { onTagClick?: (tag: string) => void }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.data || [])
      } else {
        console.error('获取标签失败')
      }
    } catch (error) {
      console.error('获取标签错误:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="flex flex-wrap justify-center gap-1">
        {tags.slice(0, 15).map((tag, index) => (
          <button
            key={index}
            onClick={() => handleTagClick(tag.name)}
            className="px-2 py-1 text-xs font-medium text-gray-600 rounded-full border border-gray-200/40 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200/60 transition-all duration-200 cursor-pointer whitespace-nowrap bg-white/60 backdrop-blur-sm shadow-sm"
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-50">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  )
} 