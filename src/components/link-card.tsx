import { ReactNode, useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"


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
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  
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

  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    try {
      // 记录点击次数
      await fetch('/api/links/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId: id }),
      })
    } catch (error) {
      console.error('记录点击次数失败:', error)
    }
    
    // 跳转到目标链接
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!description) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const tooltipWidth = 280 // 预估tooltip宽度
    const tooltipHeight = 60 // 预估tooltip高度
    
    let x = rect.left + rect.width / 2
    // 防止tooltip超出右边界
    if (x + tooltipWidth / 2 > viewportWidth - 10) {
      x = viewportWidth - tooltipWidth / 2 - 10
    }
    // 防止tooltip超出左边界
    if (x - tooltipWidth / 2 < 10) {
      x = tooltipWidth / 2 + 10
    }
    
    // 计算Y位置，考虑页面滚动
    let y = rect.top + window.scrollY - tooltipHeight - 10
    
    // 如果tooltip会超出顶部，显示在卡片下方
    if (rect.top < tooltipHeight + 20) {
      y = rect.bottom + window.scrollY + 10
    }
    
    setTooltipPosition({
      x: x,
      y: y
    })
    
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 800)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setShowTooltip(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])



  // 判断描述是否过长，需要显示tooltip
  const isDescriptionLong = description && description.length > 60

    if (mode === 'compact') {
    return (
      <>
        <div className="relative group">
          <div
            ref={cardRef}
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
            <h3 className="text-xs font-medium text-gray-900 group-hover:text-blue-600 text-center line-clamp-2 leading-tight max-w-[120px]">
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
        <div className="relative group">
          <div
            ref={cardRef}
            onClick={handleCardClick}
            className="flex items-center hover:bg-gray-50/50 transition-all duration-200 py-1 px-4 cursor-pointer max-w-2xl mx-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
              <h3 className="text-xs font-medium text-gray-900 group-hover:text-blue-600 truncate">
                {title}
              </h3>
            </div>
            <div className="flex-1 min-w-0 max-w-[450px]">
              <p className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
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
      <div className="relative group">
        <div
          ref={cardRef}
          onClick={handleCardClick}
          className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer border border-white/20 hover:border-blue-200/50 hover:scale-[1.02] w-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate mb-1 max-w-[200px]">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 group-hover:text-gray-600 mb-1 truncate max-w-[150px]">
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
                      className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 flex-shrink-0 max-w-[100px] truncate"
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
                    className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 flex-shrink-0"
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
                        className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 flex-shrink-0"
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
                      className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full flex-shrink-0"
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
      
      {/* Tooltip - 只在描述过长时显示 */}
      {showTooltip && description && isDescriptionLong && (
        <div
          className="fixed z-50 bg-gray-800/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-gray-700/50 max-w-[280px] break-words pointer-events-none transform -translate-x-1/2 leading-relaxed"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="relative">
            {description}
            {/* 箭头 - 根据位置决定显示在上方还是下方 */}
            {tooltipPosition.y > window.scrollY + 100 ? (
              // 显示在卡片上方时，箭头在底部
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800/95"></div>
            ) : (
              // 显示在卡片下方时，箭头在顶部
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800/95"></div>
            )}
          </div>
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