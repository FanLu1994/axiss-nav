"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface ClipboardDetectorOptions {
  autoDetect?: boolean; // 是否自动检测
  showToast?: boolean; // 是否显示提示
  minUrlLength?: number; // URL最小长度
  excludedDomains?: string[]; // 排除的域名
  onUrlDetected?: (url: string) => void; // URL检测回调
  enableVisibilityDetection?: boolean; // 是否启用页面可见性检测
}

interface ClipboardContent {
  text: string;
  timestamp: number;
  isUrl: boolean;
  domain?: string;
}

export function useClipboardDetector(options: ClipboardDetectorOptions = {}) {
  const {
    autoDetect = true,
    showToast = true,
    minUrlLength = 10,
    excludedDomains = ["localhost", "127.0.0.1"],
    onUrlDetected,
    enableVisibilityDetection = true,
  } = options;

  const [clipboardContent, setClipboardContent] = useState<ClipboardContent | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastProcessedUrl, setLastProcessedUrl] = useState<string>("");
  const [isPageVisible, setIsPageVisible] = useState(true);

  // 验证URL格式
  const isValidUrl = useCallback((text: string): boolean => {
    try {
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  // 提取域名
  const extractDomain = useCallback((url: string): string | undefined => {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  }, []);

  // 检查是否为排除的域名
  const isExcludedDomain = useCallback(
    (domain: string): boolean => {
      return excludedDomains.some(
        (excluded) => domain.includes(excluded) || excluded.includes(domain)
      );
    },
    [excludedDomains]
  );

  // 分析剪贴板内容
  const analyzeClipboardContent = useCallback(
    (text: string): ClipboardContent | null => {
      console.log("🔍 分析剪贴板内容:", text.substring(0, 100));
      const trimmedText = text.trim();

      if (trimmedText.length < minUrlLength) {
        console.log(`❌ 文本长度不足 (${trimmedText.length} < ${minUrlLength})`);
        return null;
      }

      const isUrl = isValidUrl(trimmedText);
      if (!isUrl) {
        console.log("❌ 不是有效的URL格式");
        return null;
      }

      const domain = extractDomain(trimmedText);
      if (!domain) {
        console.log("❌ 无法提取域名");
        return null;
      }

      if (isExcludedDomain(domain)) {
        console.log("❌ 域名被排除:", domain);
        return null;
      }

      console.log("✅ 分析成功，域名:", domain);
      return {
        text: trimmedText,
        timestamp: Date.now(),
        isUrl: true,
        domain,
      };
    },
    [minUrlLength, isValidUrl, extractDomain, isExcludedDomain]
  );

  // 读取剪贴板内容
  const readClipboard = useCallback(async (): Promise<string> => {
    console.log("🔍 开始读取剪贴板...");
    try {
      // 检查页面是否获得焦点
      if (!document.hasFocus()) {
        console.log("❌ 页面未获得焦点，跳过剪贴板读取");
        return "";
      }

      console.log("✅ 页面已获得焦点，尝试读取剪贴板");
      const text = await navigator.clipboard.readText();
      console.log(
        "📋 剪贴板内容:",
        text ? `"${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"` : "(空)"
      );
      return text;
    } catch (error) {
      console.warn("❌ 无法读取剪贴板:", error);
      return "";
    }
  }, []);

  // 检测剪贴板内容
  const detectClipboard = useCallback(async () => {
    console.log("🚀 开始检测剪贴板...");

    if (isDetecting) {
      console.log("⏳ 正在检测中，跳过重复检测");
      return;
    }

    // 检查页面是否获得焦点
    if (!document.hasFocus()) {
      console.log("❌ 页面未获得焦点，跳过剪贴板检测");
      return;
    }

    console.log("✅ 页面已获得焦点，开始检测");
    setIsDetecting(true);

    try {
      const text = await readClipboard();
      if (!text) {
        console.log("📭 剪贴板为空，结束检测");
        setIsDetecting(false);
        return;
      }

      console.log("🔍 分析剪贴板内容...");
      const content = analyzeClipboardContent(text);
      if (!content) {
        console.log("❌ 剪贴板内容不是有效URL，结束检测");
        setIsDetecting(false);
        return;
      }

      console.log("✅ 检测到有效URL:", content.domain);

      // 避免重复处理同一个URL
      if (content.text === lastProcessedUrl) {
        console.log("🔄 检测到重复URL，跳过处理:", content.text);
        setIsDetecting(false);
        return;
      }

      console.log("💾 保存检测结果:", content);
      setClipboardContent(content);
      setLastProcessedUrl(content.text);

      if (showToast) {
        console.log("🔔 显示Toast提示");
        toast.info(`检测到链接: ${content.domain}`, {
          description: "点击添加到收藏",
          action: {
            label: "添加",
            onClick: () => {
              onUrlDetected?.(content.text);
            },
          },
          duration: 5000,
        });
      }

      console.log("📞 调用URL检测回调");
      onUrlDetected?.(content.text);
    } catch (error) {
      console.error("❌ 检测剪贴板失败:", error);
    } finally {
      console.log("🏁 检测完成");
      setIsDetecting(false);
    }
  }, [
    isDetecting,
    readClipboard,
    analyzeClipboardContent,
    lastProcessedUrl,
    showToast,
    onUrlDetected,
  ]);

  // 手动检测
  const manualDetect = useCallback(() => {
    console.log("👆 手动检测触发");
    detectClipboard();
  }, [detectClipboard]);

  // 清除检测结果
  const clearDetection = useCallback(() => {
    setClipboardContent(null);
    setLastProcessedUrl("");
  }, []);

  // 页面可见性变化处理
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    console.log("👁️ 页面可见性变化:", isVisible ? "可见" : "隐藏");

    if (isVisible && !isPageVisible) {
      // 页面从隐藏变为可见时
      console.log("🎯 页签回到当前页签，触发剪贴板检测");
      setIsPageVisible(true);

      // 延迟检测，确保页面完全加载并获得焦点
      setTimeout(() => {
        if (document.hasFocus() && autoDetect) {
          console.log("✅ 页面可见且获得焦点，开始检测剪贴板");
          detectClipboard();
        } else {
          console.log("❌ 页面可见但未获得焦点，跳过检测");
        }
      }, 500);
    } else {
      setIsPageVisible(isVisible);
    }
  }, [isPageVisible, autoDetect, detectClipboard]);

  // 监听剪贴板变化
  useEffect(() => {
    if (!autoDetect) {
      console.log("🚫 自动检测已禁用");
      return;
    }

    console.log("🎧 开始监听剪贴板变化事件");

    const handleClipboardChange = () => {
      console.log("📋 剪贴板变化事件触发");
      // 延迟检测，避免频繁触发
      setTimeout(() => {
        detectClipboard();
      }, 100);
    };

    // 监听剪贴板变化事件
    document.addEventListener("copy", handleClipboardChange);
    document.addEventListener("paste", handleClipboardChange);

    // 监听焦点变化，当窗口重新获得焦点时检测
    const handleFocus = () => {
      console.log("🎯 窗口焦点事件触发");
      setTimeout(() => {
        detectClipboard();
      }, 200);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      console.log("🧹 清理剪贴板监听事件");
      document.removeEventListener("copy", handleClipboardChange);
      document.removeEventListener("paste", handleClipboardChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [autoDetect, detectClipboard]);

  // 监听页面可见性变化
  useEffect(() => {
    if (!enableVisibilityDetection) {
      console.log("🚫 页面可见性检测已禁用");
      return;
    }

    console.log("👁️ 开始监听页面可见性变化");

    // 设置初始可见性状态
    setIsPageVisible(!document.hidden);

    // 监听页面可见性变化
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("🧹 清理页面可见性监听事件");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enableVisibilityDetection, handleVisibilityChange]);

  return {
    clipboardContent,
    isDetecting,
    manualDetect,
    clearDetection,
    lastProcessedUrl,
    isPageVisible,
  };
}
