"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface Tag {
  name: string
  count: number
  icon?: string
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

      const params = new URLSearchParams()
      if (forceRefresh) {
        params.set("t", Date.now().toString())
        params.set("randomEmoji", "true")
      }

      const response = await fetch(`/api/tags${params.toString() ? `?${params}` : ""}`)
      if (response.ok) {
        const data = await response.json()
        setTags(data.data || [])
      }
    } catch (error) {
      console.error("获取标签错误:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading || tags.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">热门标签</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">点击标签筛选链接</p>
        </div>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchTags(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">刷新标签</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 12).map(tag => (
          <button
            key={tag.name}
            type="button"
            onClick={() => onTagClick?.(tag.name)}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-950/10 bg-white/42 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-800/20 hover:bg-white/70 hover:text-emerald-900 dark:border-emerald-100/10 dark:bg-emerald-950/22 dark:text-slate-300 dark:hover:border-emerald-100/20 dark:hover:bg-emerald-950/34 dark:hover:text-[#d8cfaa]"
          >
            <span>{tag.icon}</span>
            <span>{tag.name}</span>
            <span className="tabular-nums text-slate-400">{tag.count}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
