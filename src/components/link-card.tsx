"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ExternalLink, MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface LinkCardProps {
  id: string
  title: string
  url: string
  description?: string
  icon?: string
  tags?: string[]
  category?: string
  clickCount?: number
  onTagClick?: (tag: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  onReanalyze?: (id: string) => Promise<void> | void
  isLoggedIn?: boolean
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function getInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || "A"
}

export function LinkCard({
  id,
  title,
  url,
  description,
  icon,
  tags,
  category,
  clickCount = 0,
  onTagClick,
  onDelete,
  onEdit,
  onReanalyze,
  isLoggedIn
}: LinkCardProps) {
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const domain = getDomain(url)
  const visibleTags = tags?.slice(0, 3) || []

  const openLink = async () => {
    try {
      await fetch("/api/links/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ linkId: id })
      })
    } catch (error) {
      console.error("记录点击失败:", error)
    } finally {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const handleReanalyze = async () => {
    if (!isLoggedIn) {
      toast.error("请先登录")
      return
    }

    setIsReanalyzing(true)
    try {
      await onReanalyze?.(id)
    } finally {
      setIsReanalyzing(false)
    }
  }

  const handleDelete = () => {
    if (!isLoggedIn) {
      toast.error("请先登录")
      return
    }

    if (confirm("确定要删除这个链接吗？")) {
      onDelete?.(id)
    }
  }

  return (
    <article className="axiss-panel group flex min-h-[10.5rem] flex-col rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(20,46,41,0.14)] dark:hover:shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={openLink}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-emerald-950/10 bg-[#f5f0df]/70 text-sm font-semibold text-emerald-950 shadow-inner transition-colors hover:bg-[#efe5c8] dark:border-emerald-100/10 dark:bg-emerald-100/10 dark:text-[#e4d8ac] dark:hover:bg-emerald-100/15"
          aria-label={`打开 ${title}`}
        >
          {icon ? (
            <img
              src={icon}
              alt={`${title} 图标`}
              className="h-7 w-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <span>{getInitial(title)}</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={openLink}
            className="block max-w-full truncate text-left text-sm font-semibold text-slate-950 transition-colors hover:text-emerald-800 dark:text-slate-100 dark:hover:text-[#d8cfaa]"
          >
            {title}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{domain}</span>
            {category && (
              <>
                <span className="text-emerald-900/20 dark:text-emerald-100/20">/</span>
                <span className="truncate">{category}</span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">更多操作</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openLink}>
              <ExternalLink className="h-4 w-4" />
              打开链接
            </DropdownMenuItem>
            {isLoggedIn && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(id)}>
                  <Pencil className="h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReanalyze} disabled={isReanalyzing}>
                  <RefreshCw className={`h-4 w-4 ${isReanalyzing ? "animate-spin" : ""}`} />
                  重新分析
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        type="button"
        onClick={openLink}
        className="mt-3 line-clamp-2 min-h-10 text-left text-sm leading-5 text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
      >
        {description || url}
      </button>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {visibleTags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-md px-2 py-0.5 text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation()
                onTagClick?.(tag)
              }}
            >
              {tag}
            </Badge>
          ))}
          {tags && tags.length > 3 && (
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
          {clickCount} 次
        </span>
      </div>
    </article>
  )
}
