"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

export interface EditableLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  tags: string[];
  category?: string;
  color?: string;
}

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onLocateExistingLink?: (link: ExistingLink) => void;
  initialUrl?: string;
  mode?: "add" | "edit";
  link?: EditableLink | null;
}

interface AnalysisResult {
  title: string;
  description: string;
  icon: string;
  tags: Array<{ name: string; emoji?: string }>;
  category?: string;
}

interface ExistingLink {
  id: string;
  title: string;
  url: string;
}

const emptyForm = {
  title: "",
  url: "",
  description: "",
  icon: "",
  tagsText: "",
  category: "",
  color: "",
};

type AnalyzeStage = "idle" | "checking" | "fetching" | "tagging" | "ready";

const analyzeStageLabels: Array<{ value: Exclude<AnalyzeStage, "idle">; label: string }> = [
  { value: "checking", label: "检查链接" },
  { value: "fetching", label: "获取网页信息" },
  { value: "tagging", label: "生成标签" },
  { value: "ready", label: "等待确认" },
];

function normalizeUrl(value: string) {
  return value.trim();
}

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AddLinkDialog({
  open,
  onOpenChange,
  onSuccess,
  onLocateExistingLink,
  initialUrl,
  mode = "add",
  link,
}: AddLinkDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [inlineInfo, setInlineInfo] = useState("");
  const [existingLink, setExistingLink] = useState<ExistingLink | null>(null);
  const [analyzeStage, setAnalyzeStage] = useState<AnalyzeStage>("idle");

  const isEdit = mode === "edit";
  const canAnalyze = !isEdit && form.url.trim().length > 0 && !analyzing;
  const parsedTags = useMemo(() => splitTags(form.tagsText), [form.tagsText]);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setInlineError("");
      setInlineInfo("");
      setExistingLink(null);
      setAnalyzeStage("idle");
      return;
    }

    if (isEdit && link) {
      setForm({
        title: link.title || "",
        url: link.url || "",
        description: link.description || "",
        icon: link.icon || "",
        tagsText: link.tags?.join(", ") || "",
        category: link.category || "",
        color: link.color || "",
      });
      return;
    }

    setForm({
      ...emptyForm,
      url: initialUrl || "",
    });
  }, [open, initialUrl, isEdit, link]);

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setInlineError("");
    setExistingLink(null);
  };

  const validateUrl = () => {
    try {
      const url = new URL(normalizeUrl(form.url));
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const applyAnalysis = (result: AnalysisResult) => {
    const tags = result.tags?.map((tag) => tag.name).filter(Boolean) || [];
    setForm((prev) => ({
      ...prev,
      title: result.title || prev.title || getHostname(prev.url),
      description: result.description || prev.description,
      icon: result.icon || prev.icon,
      tagsText: tags.length > 0 ? tags.join(", ") : prev.tagsText,
      category: prev.category || result.category || tags[0] || "",
    }));
  };

  const handleAnalyze = async () => {
    if (!form.url.trim()) {
      setInlineError("请输入链接地址。");
      return;
    }

    if (!validateUrl()) {
      setInlineError("请输入有效的网址，需要包含 http:// 或 https://。");
      return;
    }

    setAnalyzing(true);
    setInlineError("");
    setInlineInfo("正在检查链接并获取网页信息。");
    setExistingLink(null);
    setAnalyzeStage("checking");

    const stageTimers = [
      window.setTimeout(() => setAnalyzeStage("fetching"), 500),
      window.setTimeout(() => setAnalyzeStage("tagging"), 1400),
    ];

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setInlineError("请先登录后再添加链接。");
        return;
      }

      const response = await fetch("/api/links/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: normalizeUrl(form.url) }),
      });

      const result = await response.json();

      if (response.ok) {
        applyAnalysis(result);
        setInlineInfo("分析完成，你可以继续调整标题、描述和标签。");
        setAnalyzeStage("ready");
        return;
      }

      if (result.existingLink) {
        setExistingLink(result.existingLink);
        setInlineError("该链接已存在。");
      } else {
        setInlineError(result.error || "分析失败。你仍然可以手动填写信息后保存。");
        setForm((prev) => ({
          ...prev,
          title: prev.title || getHostname(prev.url),
          tagsText: prev.tagsText || "链接, 收藏",
          category: prev.category || "链接",
        }));
      }
    } catch (error) {
      console.error("分析链接失败:", error);
      setInlineError("分析失败。你仍然可以手动填写信息后保存。");
      setForm((prev) => ({
        ...prev,
        title: prev.title || getHostname(prev.url),
        tagsText: prev.tagsText || "链接, 收藏",
        category: prev.category || "链接",
      }));
    } finally {
      stageTimers.forEach((timer) => window.clearTimeout(timer));
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setInlineError("标题不能为空。");
      return;
    }

    if (!form.url.trim() || !validateUrl()) {
      setInlineError("请输入有效的网址，需要包含 http:// 或 https://。");
      return;
    }

    setSaving(true);
    setInlineError("");
    setExistingLink(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setInlineError("请先登录。");
        return;
      }

      const response = await fetch("/api/links", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(isEdit && link ? { id: link.id } : {}),
          title: form.title.trim(),
          url: normalizeUrl(form.url),
          description: form.description.trim(),
          icon: form.icon.trim(),
          tags: parsedTags,
          category: form.category.trim(),
          color: form.color.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "链接已更新" : "链接已添加");
        setAnalyzeStage("ready");
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      if (result.existingLink) {
        setExistingLink(result.existingLink);
      }
      setInlineError(result.error || (isEdit ? "更新失败" : "添加失败"));
    } catch (error) {
      console.error(isEdit ? "编辑链接失败:" : "添加链接失败:", error);
      setInlineError(isEdit ? "更新失败，请稍后重试。" : "添加失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="axiss-panel max-h-[90dvh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">
            {isEdit ? "编辑链接" : "收藏链接"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "更新标题、描述、标签和分类。重新分析返回的建议也需要在这里确认后保存。"
              : "粘贴 URL 后可自动分析，也可以直接手动保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <div className="rounded-lg border border-slate-950/10 bg-white/52 p-3 dark:border-white/10 dark:bg-white/7">
              <div className="flex flex-wrap gap-2">
                {analyzeStageLabels.map((stage, index) => {
                  const currentIndex = analyzeStageLabels.findIndex(
                    (item) => item.value === analyzeStage
                  );
                  const isCurrent = analyzeStage === stage.value;
                  const isComplete = currentIndex > index || analyzeStage === "ready";

                  return (
                    <div
                      key={stage.value}
                      className="axiss-surface-row flex min-w-[7rem] flex-1 items-center gap-2 rounded-md px-2 py-2"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isCurrent || isComplete
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {stage.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isCurrent ? "进行中" : isComplete ? "已完成" : "待处理"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inlineError && (
            <Alert variant="destructive">
              <AlertDescription>
                {inlineError}
                {existingLink && (
                  <span className="mt-2 block text-xs">
                    已有链接：{existingLink.title}（{existingLink.url}）
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {existingLink && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                onLocateExistingLink?.(existingLink);
                onOpenChange(false);
              }}
            >
              定位到已有链接
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {existingLink.title}
              </span>
            </Button>
          )}

          {inlineInfo && !inlineError && (
            <Alert>
              <AlertDescription>{inlineInfo}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="link-url">链接地址</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={form.url}
                onChange={(e) => updateField("url", e.target.value)}
                disabled={saving || analyzing}
                className="h-10 bg-white/66 dark:bg-white/7"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  分析
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link-title">标题</Label>
            <Input
              id="link-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="链接标题"
              disabled={saving}
              className="h-10 bg-white/66 dark:bg-white/7"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link-description">描述</Label>
            <Textarea
              id="link-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="简短说明这个链接的用途"
              rows={3}
              disabled={saving}
              className="bg-white/66 dark:bg-white/7"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="link-category">分类</Label>
              <Input
                id="link-category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="工具"
                disabled={saving}
                className="h-10 bg-white/66 dark:bg-white/7"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-icon">图标地址</Label>
              <Input
                id="link-icon"
                value={form.icon}
                onChange={(e) => updateField("icon", e.target.value)}
                placeholder="https://example.com/favicon.ico"
                disabled={saving}
                className="h-10 bg-white/66 dark:bg-white/7"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link-tags">标签</Label>
            <Input
              id="link-tags"
              value={form.tagsText}
              onChange={(e) => updateField("tagsText", e.target.value)}
              placeholder="AI, 设计, 工具"
              disabled={saving}
              className="h-10 bg-white/66 dark:bg-white/7"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parsedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-md">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving || analyzing}
          >
            取消
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || analyzing}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "保存修改" : "保存链接"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
