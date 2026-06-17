"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  AlertTriangle,
  Check,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LinkCardProps {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  tags?: string[];
  category?: string;
  analysisStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  isAvailable?: boolean | null;
  clickCount?: number;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onReanalyze?: (id: string) => Promise<void> | void;
  isLoggedIn?: boolean;
  isHighlighted?: boolean;
  motionDelay?: number;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || "A";
}

function getAnalysisLabel(
  analysisStatus: LinkCardProps["analysisStatus"],
  isAvailable: LinkCardProps["isAvailable"]
) {
  if (isAvailable === false) return "链接异常";
  if (analysisStatus === "PROCESSING") return "分析中";
  if (analysisStatus === "COMPLETED") return "已分析";
  if (analysisStatus === "FAILED") return "分析失败";
  return "待分析";
}

function getStatusTone(
  analysisStatus: LinkCardProps["analysisStatus"],
  isAvailable: LinkCardProps["isAvailable"]
) {
  if (isAvailable === false || analysisStatus === "FAILED") {
    return {
      className:
        "border-red-500/18 bg-red-50 text-red-700 dark:border-red-400/16 dark:bg-red-950/22 dark:text-red-300",
      icon: AlertTriangle,
    };
  }

  if (analysisStatus === "COMPLETED") {
    return {
      className:
        "border-teal-800/14 bg-teal-50/70 text-teal-800 dark:border-teal-100/12 dark:bg-teal-950/18 dark:text-teal-200",
      icon: Check,
    };
  }

  return {
    className:
      "border-slate-500/14 bg-white/48 text-slate-600 dark:border-slate-300/12 dark:bg-slate-950/18 dark:text-slate-300",
    icon: Activity,
  };
}

export function LinkCard({
  id,
  title,
  url,
  description,
  icon,
  tags,
  category,
  analysisStatus,
  isAvailable,
  clickCount = 0,
  onTagClick,
  onDelete,
  onEdit,
  onReanalyze,
  isLoggedIn,
  isHighlighted = false,
  motionDelay = 0,
}: LinkCardProps) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const domain = getDomain(url);
  const visibleTags = tags?.slice(0, 3) || [];
  const statusTone = getStatusTone(analysisStatus, isAvailable);
  const StatusIcon = statusTone.icon;

  const recordClick = () => {
    const body = JSON.stringify({ linkId: id });

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/links/click",
        new Blob([body], { type: "application/json" })
      );

      if (sent) return;
    }

    fetch("/api/links/click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    }).catch((error) => {
      console.error("记录点击失败:", error);
    });
  };

  const openLink = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    recordClick();
  };

  const handleReanalyze = async () => {
    if (!isLoggedIn) {
      toast.error("请先登录");
      return;
    }

    setIsReanalyzing(true);
    try {
      await onReanalyze?.(id);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDelete = () => {
    if (!isLoggedIn) {
      toast.error("请先登录");
      return;
    }

    if (confirm("确定要删除这个链接吗？")) {
      onDelete?.(id);
    }
  };

  return (
    <article
      className={`axiss-motion-card axiss-shimmer-edge axiss-panel group flex min-h-[11rem] flex-col rounded-lg p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-950/14 hover:shadow-[0_20px_52px_rgba(31,43,50,0.1)] dark:hover:border-white/14 dark:hover:shadow-[0_22px_58px_rgba(0,0,0,0.3)] ${
        isHighlighted
          ? "axiss-highlight-pulse ring-2 ring-teal-700/32 shadow-[0_0_0_1px_rgba(45,111,104,0.12),0_20px_54px_rgba(31,43,50,0.12)] dark:ring-[#b7e4dc]/38"
          : ""
      }`}
      style={{ animationDelay: `${motionDelay}ms` }}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={openLink}
          className="axiss-focus-ring axiss-action-lift flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-950/10 bg-white/72 text-sm font-semibold text-slate-800 shadow-inner transition-colors hover:bg-teal-50/80 dark:border-white/10 dark:bg-white/7 dark:text-[#b7e4dc] dark:hover:bg-white/10"
          aria-label={`打开 ${title}`}
        >
          {icon ? (
            <img
              src={icon}
              alt={`${title} 图标`}
              width={28}
              height={28}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-7 w-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
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
            className="axiss-focus-ring block max-w-full rounded-sm text-left text-sm font-semibold text-slate-950 transition-colors duration-200 hover:text-teal-800 dark:text-slate-100 dark:hover:text-[#b7e4dc]"
          >
            {title}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{domain}</span>
            {category && (
              <>
                <span className="text-slate-900/18 dark:text-white/18">/</span>
                <span className="truncate">{category}</span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="axiss-action-lift h-8 w-8 shrink-0">
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
        className="axiss-focus-ring mt-3 line-clamp-2 min-h-10 rounded-sm text-left text-sm leading-5 text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
      >
        {description || url}
      </button>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`axiss-status-breathe inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${statusTone.className}`}
        >
          <StatusIcon className="h-3 w-3" />
          {getAnalysisLabel(analysisStatus, isAvailable)}
        </span>
        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
          {clickCount} 次访问
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="axiss-action-lift cursor-pointer px-2 py-0.5 text-xs font-medium hover:bg-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
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
        <button
          type="button"
          onClick={openLink}
          className="axiss-focus-ring axiss-action-lift -m-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-teal-50/80 hover:text-teal-800 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-[#b7e4dc]"
          aria-label={`打开 ${title}`}
        >
          <ExternalLink className="axiss-icon-drift h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
