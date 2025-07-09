import { ReactNode, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"


interface LinkCardProps {
  id: string
  title: string
  url: string
  description?: string
  icon?: string
  tags?: string[]
  order?: number
  isActive?: boolean
  clickCount?: number
  createdAt?: Date
  updatedAt?: Date
  onTagClick?: (tag: string) => void
  onDelete?: (id: string) => void
  isLoggedIn?: boolean
  children?: ReactNode
  mode?: 'normal' | 'compact' | 'table'
}

export function LinkCard({ id, title, url, description, icon, tags, onTagClick, onDelete, isLoggedIn, children, mode = 'normal' }: LinkCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const faviconUrl = icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`
  const defaultImage = "/globe.svg" // 使用 public 目录中的默认图片

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault()
    e.stopPropagation()
    onTagClick?.(tag)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false)
    onDelete?.(id)
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 立即跳转到目标链接，不等待接口响应
    window.open(url, '_blank', 'noopener,noreferrer')
    
    // 异步记录点击次数，不阻塞跳转
    fetch('/api/links/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkId: id }),
    }).catch(error => {
      console.error('记录点击次数失败:', error)
    })
  }

  // 渲染卡片内容的函数
  const renderCard = (cardContent: React.ReactNode) => {
    if (description) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            className="max-w-[280px] bg-gray-800/95 backdrop-blur-sm text-white border-gray-700/50"
            sideOffset={10}
          >
            {description}
          </TooltipContent>
        </Tooltip>
      )
    }
    return cardContent
  }

  if (mode === 'compact') {
    return (
      <>
        {renderCard(
          <div className="relative group">
            <div
              onClick={handleCardClick}
              className="flex flex-col items-center hover:scale-[1.05] transition-all duration-200 p-2 cursor-pointer w-full"
              title={title}
            >
              <div className="flex-shrink-0 mb-2">
                <img
                  src={imageError ? defaultImage : faviconUrl}
                  alt={title}
                  className="w-8 h-8 rounded group-hover:scale-110 transition-transform duration-200"
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center line-clamp-2 leading-tight max-w-[120px]">
                {title}
              </h3>
              {children}
            </div>
            {isLoggedIn && onDelete && (
              <button
                onClick={handleDelete}
                className="absolute top-1 right-1 w-5 h-5 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
                title="删除收藏"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* 删除确认对话框 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                确定要删除收藏 <span className="font-medium text-gray-900">&ldquo;{title}&rdquo;</span> 吗？
              </p>
              <p className="text-sm text-gray-500 mt-2">
                此操作无法撤销。
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (mode === 'table') {
    return (
      <>
        {renderCard(
          <div className="relative group">
            <div
              onClick={handleCardClick}
              className="flex items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 py-1 px-4 cursor-pointer max-w-2xl mx-auto"
            >
              <div className="flex-shrink-0 mr-2">
                <img
                  src={imageError ? defaultImage : faviconUrl}
                  alt={title}
                  className="w-3 h-3 rounded"
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
              <div className="flex-shrink-0 mr-2 min-w-0 w-32">
                <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                  {title}
                </h3>
              </div>
              <div className="flex-1 min-w-0 max-w-[450px]">
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 truncate">
                  {description || '暂无描述'}
                </p>
              </div>
              {children}
            </div>
            {isLoggedIn && onDelete && (
              <button
                onClick={handleDelete}
                className="absolute top-1 right-4 w-5 h-5 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
                title="删除收藏"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* 删除确认对话框 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                确定要删除收藏 <span className="font-medium text-gray-900">&ldquo;{title}&rdquo;</span> 吗？
              </p>
              <p className="text-sm text-gray-500 mt-2">
                此操作无法撤销。
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {renderCard(
        <div className="relative group">
          <div
            onClick={handleCardClick}
            className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer border border-white/20 dark:border-gray-600/20 hover:border-blue-200/50 dark:hover:border-blue-500/50 hover:scale-[1.02] w-full"
          >
          <div className="flex-shrink-0 mr-3">
            <img
              src={imageError ? defaultImage : faviconUrl}
              alt={title}
              className="w-8 h-8 rounded"
              loading="lazy"
              onError={handleImageError}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1 max-w-[200px]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 mb-1 truncate max-w-[150px]">
                {description}
              </p>
            )}
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-1 overflow-hidden">
                {(() => {
                  const firstTag = typeof tags[0] === 'string' ? tags[0] : (tags[0] as { name: string }).name
                  const firstTagLength = firstTag.length
                  
                  // 如果第一个标签很长（超过12个字符），直接显示一个带省略号的标签
                  if (firstTagLength > 12) {
                    return (
                      <button
                        onClick={(e) => handleTagClick(e, firstTag)}
                        className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex-shrink-0 max-w-[100px] truncate"
                        title={firstTag}
                      >
                        {firstTag}
                      </button>
                    )
                  }
                  
                  // 如果第一个标签不长，尝试显示多个标签
                  const elements = []
                  
                  // 先显示第一个标签
                  elements.push(
                    <button
                      key={0}
                      onClick={(e) => handleTagClick(e, firstTag)}
                      className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex-shrink-0"
                    >
                      {firstTag}
                    </button>
                  )
                  
                  // 如果有更多标签，并且第一个标签不太长（小于8个字符），尝试显示第二个
                  if (tags.length > 1 && firstTagLength < 8) {
                    const secondTag = typeof tags[1] === 'string' ? tags[1] : (tags[1] as { name: string }).name
                    const secondTagLength = secondTag.length
                    
                    // 如果两个标签总长度合理，显示第二个
                    if (firstTagLength + secondTagLength < 16) {
                      elements.push(
                        <button
                          key={1}
                          onClick={(e) => handleTagClick(e, secondTag)}
                          className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex-shrink-0"
                        >
                          {secondTag}
                        </button>
                      )
                    }
                  }
                  
                  // 如果还有更多标签，显示 +N 指示器
                  const displayedCount = elements.length
                  if (tags.length > displayedCount) {
                    elements.push(
                      <span 
                        key="more"
                        className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0"
                        title={`还有 ${tags.length - displayedCount} 个标签`}
                      >
                        +{tags.length - displayedCount}
                      </span>
                    )
                  }
                  
                  return elements
                })()}
              </div>
            )}
          </div>
          {children}
          </div>
          {isLoggedIn && onDelete && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
              title="删除收藏"
            >
              ×
            </button>
          )}
        </div>
      )}
      
      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              确定要删除收藏 <span className="font-medium text-gray-900">&ldquo;{title}&rdquo;</span> 吗？
            </p>
            <p className="text-sm text-gray-500 mt-2">
              此操作无法撤销。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 