"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"

interface RecommendedLink {
  id: string
  title: string
  url: string
  icon?: string
  clickCount: number
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function RecommendedLinks() {
  const [links, setLinks] = useState<RecommendedLink[]>([])
  const [loading, setLoading] = useState(true)
  const [randomizing, setRandomizing] = useState(false)

  useEffect(() => {
    fetchRecommendedLinks()
  }, [])

  const fetchRecommendedLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/links/recommend")
      if (response.ok) {
        const data = await response.json()
        setLinks(data.data || [])
      }
    } catch (error) {
      console.error("获取推荐链接错误:", error)
    } finally {
      setLoading(false)
    }
  }

  const openLink = async (linkId: string, url: string) => {
    try {
      await fetch("/api/links/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId })
      })
    } catch (error) {
      console.error("记录点击失败:", error)
    } finally {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const handleRandomVisit = async () => {
    try {
      setRandomizing(true)
      const response = await fetch("/api/links/random")
      if (response.ok) {
        const data = await response.json()
        const randomLink = data.data
        await openLink(randomLink.id, randomLink.url)
      }
    } catch (error) {
      console.error("随机访问错误:", error)
    } finally {
      setRandomizing(false)
    }
  }

  if (loading || links.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">快捷入口</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">基于点击和收藏时间推荐</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRandomVisit} disabled={randomizing}>
          <Shuffle className={`h-4 w-4 ${randomizing ? "animate-spin" : ""}`} />
          随机
        </Button>
      </div>

      <div className="space-y-2">
        {links.slice(0, 6).map(link => (
          <button
            key={link.id}
            type="button"
            onClick={() => openLink(link.id, link.url)}
            className="flex w-full items-center gap-3 rounded-md border border-emerald-950/10 bg-white/42 px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 dark:border-emerald-100/10 dark:bg-emerald-950/22 dark:hover:bg-emerald-950/34"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f5f0df]/70 text-xs font-semibold text-emerald-950 dark:bg-emerald-100/10 dark:text-[#d8cfaa]">
              {link.icon ? (
                <img src={link.icon} alt={`${link.title} 图标`} className="h-5 w-5 object-contain" />
              ) : (
                link.title.charAt(0).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{link.title}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{getDomain(link.url)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
