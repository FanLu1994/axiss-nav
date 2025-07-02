"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface AnalysisResult {
  title: string
  description: string
  icon?: string
  tags: Array<{ name: string; emoji?: string }>
}

interface AddLinkDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: any
}

export function AddLinkDialog({ isOpen, onOpenChange, onSuccess, user }: AddLinkDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editedData, setEditedData] = useState<AnalysisResult | null>(null)

  const resetDialog = () => {
    setStep(1)
    setUrl("")
    setAnalyzing(false)
    setSaving(false)

    setEditedData(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetDialog, 200) // 等待动画完成
  }

  // 第一步：AI分析
  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("网址不能为空")
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error("请输入完整的网址（需要包含 http:// 或 https://）")
      return
    }

    const token = localStorage.getItem('token')
    setAnalyzing(true)

    try {
      const res = await fetch("/api/links/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await res.json()

      if (res.ok) {
        setEditedData(data)
        setStep(2)
        toast.success("分析完成！")
      } else if (res.status === 409) {
        toast.error(`该网址已存在：${data.existingLink?.title || data.existingLink?.url || ''}`)
      } else if (res.status === 401) {
        toast.error("登录已过期，请重新登录")
        localStorage.removeItem('token')
        handleClose()
      } else {
        toast.error(data.error || "分析失败，请稍后重试")
      }
    } catch (error) {
      console.error('分析失败:', error)
      toast.error("网络错误，请检查网络连接后重试")
    } finally {
      setAnalyzing(false)
    }
  }

  // 第二步：保存到数据库
  const handleSave = async () => {
    if (!editedData) return

    const token = localStorage.getItem('token')
    setSaving(true)

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url.trim(),
          title: editedData.title,
          description: editedData.description,
          icon: editedData.icon,
          tags: editedData.tags
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("添加成功！")
        handleClose()
        onSuccess()
      } else if (res.status === 401) {
        toast.error("登录已过期，请重新登录")
        localStorage.removeItem('token')
        handleClose()
      } else {
        toast.error(data.error || "保存失败，请稍后重试")
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error("网络错误，请检查网络连接后重试")
    } finally {
      setSaving(false)
    }
  }

  const handleTagChange = (index: number, value: string) => {
    if (!editedData) return
    const newTags = [...editedData.tags]
    newTags[index] = { ...newTags[index], name: value }
    setEditedData({ ...editedData, tags: newTags })
  }

  const addTag = () => {
    if (!editedData) return
    setEditedData({
      ...editedData,
      tags: [...editedData.tags, { name: "", emoji: "🏷️" }]
    })
  }

  const removeTag = (index: number) => {
    if (!editedData) return
    const newTags = editedData.tags.filter((_, i) => i !== index)
    setEditedData({ ...editedData, tags: newTags })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "添加网址 - 步骤 1/2" : "添加网址 - 步骤 2/2"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                网址
              </label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={analyzing}
              />
            </div>
            <div className="text-sm text-gray-500">
              输入网址后，AI 将自动分析网站内容并提取标题、描述和标签
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={analyzing}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-1"
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    AI分析中...
                  </div>
                ) : (
                  "开始分析"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                网站图标
              </label>
              <div className="flex items-center gap-3">
                {editedData?.icon && (
                  <img 
                    src={editedData.icon} 
                    alt="网站图标" 
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <Input
                  placeholder="图标URL（可选）"
                  value={editedData?.icon || ""}
                  onChange={e => editedData && setEditedData({ ...editedData, icon: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                标题
              </label>
              <Input
                placeholder="网站标题"
                value={editedData?.title || ""}
                onChange={e => editedData && setEditedData({ ...editedData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                描述
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                placeholder="网站描述"
                value={editedData?.description || ""}
                onChange={e => editedData && setEditedData({ ...editedData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                标签
              </label>
              <div className="space-y-2">
                {editedData?.tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="标签名称"
                      value={tag.name}
                      onChange={e => handleTagChange(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTag(index)}
                      className="px-2"
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  className="w-full"
                >
                  + 添加标签
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={saving}
                className="flex-1"
              >
                返回
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    保存中...
                  </div>
                ) : (
                  "确认添加"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 