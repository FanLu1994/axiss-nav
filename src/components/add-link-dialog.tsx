"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface AnalysisResult {
  title: string
  description: string
  icon: string
  tags: Array<{ name: string; emoji?: string }>
}

export function AddLinkDialog({ open, onOpenChange, onSuccess }: AddLinkDialogProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [step, setStep] = useState<'input' | 'analyzing' | 'confirm'>('input')

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error("请输入链接地址")
      return
    }

    // 验证URL格式
    try {
      new URL(url)
    } catch {
      toast.error("请输入有效的链接地址")
      return
    }

    setAnalyzing(true)
    setStep('analyzing')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("请先登录")
        return
      }

      // 调用AI分析API
      const response = await fetch('/api/links/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: url.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult(result)
        setStep('confirm')
      } else {
        const error = await response.json()
        if (error.existingLink) {
          toast.error("该链接已存在")
        } else {
          toast.error(error.error || "分析失败")
        }
        setStep('input')
      }
    } catch (error) {
      console.error('分析链接失败:', error)
      toast.error("分析失败")
      setStep('input')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirm = async () => {
    if (!analysisResult) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("请先登录")
        return
      }

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url.trim(),
          title: analysisResult.title,
          description: analysisResult.description,
          icon: analysisResult.icon,
          tags: analysisResult.tags
        })
      })

      if (response.ok) {
        toast.success("链接添加成功")
        resetForm()
        onOpenChange(false)
        onSuccess?.()
      } else {
        const error = await response.json()
        toast.error(error.error || "添加失败")
      }
    } catch (error) {
      console.error('添加链接失败:', error)
      toast.error("添加失败")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUrl("")
    setAnalysisResult(null)
    setStep('input')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleBack = () => {
    setStep('input')
    setAnalysisResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' && '添加新链接'}
            {step === 'analyzing' && '正在分析链接...'}
            {step === 'confirm' && '确认添加链接'}
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">链接地址 *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={analyzing}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={analyzing}
              >
                取消
              </Button>
              <Button type="submit" disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  '开始分析'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'analyzing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">正在分析链接...</h3>
              <p className="text-sm text-gray-500">
                正在获取网站信息并生成标签，请稍候
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && analysisResult && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                {analysisResult.icon && (
                  <img 
                    src={analysisResult.icon} 
                    alt="网站图标" 
                    className="w-8 h-8 rounded flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1">{analysisResult.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {analysisResult.description}
                  </p>
                  <p className="text-xs text-blue-500 truncate">{url}</p>
                </div>
              </div>

              {analysisResult.tags && analysisResult.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">生成的标签</Label>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                返回修改
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    确认添加
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 