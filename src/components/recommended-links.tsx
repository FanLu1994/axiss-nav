"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import type { RecommendedLinkItem } from "@/lib/home-types";

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function RecommendedLinks({ initialLinks = [] }: { initialLinks?: RecommendedLinkItem[] }) {
  const [links, setLinks] = useState<RecommendedLinkItem[]>(initialLinks);
  const [loading, setLoading] = useState(initialLinks.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialLinks.length > 0) {
      return;
    }

    fetchRecommendedLinks({ showInitialLoading: true });
  }, [initialLinks.length]);

  const fetchRecommendedLinks = async ({ showInitialLoading = false } = {}) => {
    try {
      if (showInitialLoading) {
        setLoading(true);
      }
      setRefreshing(true);
      const response = await fetch("/api/links/recommend");
      if (response.ok) {
        const data = await response.json();
        setLinks(data.data || []);
      }
    } catch (error) {
      console.error("获取推荐链接错误:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const recordClick = (linkId: string) => {
    const body = JSON.stringify({ linkId });

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/links/click",
        new Blob([body], { type: "application/json" })
      );

      if (sent) return;
    }

    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch((error) => {
      console.error("记录点击失败:", error);
    });
  };

  const openLink = (linkId: string, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    recordClick(linkId);
  };

  if (loading || links.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">快捷入口</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">基于点击和收藏时间推荐</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="axiss-action-lift"
          onClick={() => fetchRecommendedLinks()}
          disabled={refreshing}
          aria-label="刷新快捷入口"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {links.slice(0, 6).map((link, index) => (
          <button
            key={link.id}
            type="button"
            onClick={() => openLink(link.id, link.url)}
            className="axiss-motion-fade-up axiss-surface-row group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 dark:hover:bg-white/8"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/70 text-xs font-semibold text-slate-800 ring-1 ring-slate-950/8 dark:bg-white/8 dark:text-[#b7e4dc] dark:ring-white/10">
              {link.icon ? (
                <img
                  src={link.icon}
                  alt={`${link.title} 图标`}
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 object-contain"
                />
              ) : (
                link.title.charAt(0).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {link.title}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {getDomain(link.url)}
              </span>
            </span>
            <ArrowUpRight className="axiss-icon-drift h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-800 dark:text-slate-600 dark:group-hover:text-[#b7e4dc]" />
          </button>
        ))}
      </div>
    </section>
  );
}
