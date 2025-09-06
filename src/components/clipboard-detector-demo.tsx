"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clipboard, Link, Settings, X } from 'lucide-react'
import { useClipboardDetector } from './use-clipboard-detector'
import { AddLinkDialog } from './add-link-dialog'

export function ClipboardDetectorDemo() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [autoDetect, setAutoDetect] = useState(true)
  const [showToast, setShowToast] = useState(true)

  const { 
    clipboardContent, 
    isDetecting, 
    manualDetect, 
    clearDetection,
    lastProcessedUrl 
  } = useClipboardDetector({
    autoDetect,
    showToast,
    minUrlLength: 10,
    excludedDomains: ['localhost', '127.0.0.1', 'example.com'],
    onUrlDetected: () => {
      setShowAddDialog(true)
    }
  })

  const handleAddToFavorites = (url: string) => {
    // 这里可以调用添加收藏的API
    console.log('添加到收藏:', url)
    setShowAddDialog(false)
    clearDetection()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            剪贴板检测器
          </CardTitle>
          <CardDescription>
            自动检测剪贴板中的链接，并提供快速添加到收藏的功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 设置面板 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-detect" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                自动检测
              </Label>
              <Switch
                id="auto-detect"
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-toast" className="flex items-center gap-2">
                显示提示
              </Label>
              <Switch
                id="show-toast"
                checked={showToast}
                onCheckedChange={setShowToast}
              />
            </div>
          </div>

          {/* 手动检测按钮 */}
          <div className="flex gap-2">
            <Button 
              onClick={manualDetect} 
              disabled={isDetecting}
              className="flex-1"
            >
              {isDetecting ? '检测中...' : '手动检测剪贴板'}
            </Button>
            
            {clipboardContent && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={clearDetection}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 检测结果显示 */}
          {clipboardContent && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="text-xs">
                        {clipboardContent.domain}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      {clipboardContent.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      检测时间: {new Date(clipboardContent.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAddToFavorites(clipboardContent.text)}
                  >
                    添加到收藏
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(clipboardContent.text, '_blank')}
                  >
                    打开链接
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 状态信息 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>状态: {isDetecting ? '检测中' : '就绪'}</p>
            {lastProcessedUrl && (
              <p>上次处理: {lastProcessedUrl}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加链接对话框 */}
      <AddLinkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false)
          clearDetection()
        }}
      />
    </div>
  )
}
