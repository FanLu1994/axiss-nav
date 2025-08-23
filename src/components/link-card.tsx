import { ReactNode, useState } from "react"
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
  onContextMenu?: (e: React.MouseEvent, linkId: string) => void
  children?: ReactNode
}

export function LinkCard({ id, title, url, description, icon, tags, onTagClick, onDelete, isLoggedIn, onContextMenu, children }: LinkCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)

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

  const handleReanalyze = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowReanalyzeDialog(true)
  }

  const handleConfirmReanalyze = async () => {
    setShowReanalyzeDialog(false)
    setIsReanalyzing(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('未找到认证令牌')
        return
      }

      const response = await fetch('/api/links/reanalyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkId: id })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('重新分析成功:', result)
        // 可以在这里添加成功提示或刷新页面
        window.location.reload()
      } else {
        const error = await response.json()
        console.error('重新分析失败:', error)
        alert('重新分析失败: ' + (error.error || '未知错误'))
      }
    } catch (error) {
      console.error('重新分析请求失败:', error)
      alert('重新分析请求失败')
    } finally {
      setIsReanalyzing(false)
    }
  }

  const handleCancelReanalyze = () => {
    setShowReanalyzeDialog(false)
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

  const handleContextMenu = (e: React.MouseEvent) => {
    console.log('鼠标位置:', { 
      clientX: e.clientX, 
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
      screenX: e.screenX,
      screenY: e.screenY
    })
    e.preventDefault()
    e.stopPropagation()

    onContextMenu?.(e, id)
  }









  // 渲染卡片内容的函数
  const renderCard = (cardContent: React.ReactNode) => {
    return cardContent
  }

  return (
    <>
             {renderCard(
         <div className="relative group" data-link-card>
                       <div
              onClick={handleCardClick}
              onContextMenu={handleContextMenu}
              className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer border border-white/20 dark:border-gray-600/20 hover:border-blue-200/50 dark:hover:border-blue-500/50 hover:scale-[1.02] w-80 h-36"
            >
          <div className="flex-shrink-0 mr-4">
            <img
              src={imageError ? defaultImage : faviconUrl}
              alt={title}
              className="w-12 h-12 rounded"
              loading="lazy"
              onError={handleImageError}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1 max-w-[280px]">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 line-clamp-2 max-w-[240px]">
                  {description}
                </p>
              )}
            </div>
                         {tags && tags.length > 0 && (
               <div className="flex flex-wrap items-start gap-1 overflow-hidden max-h-[3rem]">
                                 {tags.slice(0, 4).map((tag, index) => {
                   const tagName = typeof tag === 'string' ? tag : (tag as { name: string }).name
                   return (
                     <button
                       key={index}
                       onClick={(e) => handleTagClick(e, tagName)}
                       className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex-shrink-0 max-w-[110px] truncate"
                       title={tagName}
                     >
                       {tagName}
                     </button>
                   )
                 })}
                 {tags.length > 4 && (
                   <span
                     className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0"
                     title={`还有 ${tags.length - 4} 个标签`}
                   >
                     +{tags.length - 4}
                   </span>
                 )}
              </div>
            )}
          </div>
                     {children}
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

       {/* 重新分析确认对话框 */}
       <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>确认重新分析</DialogTitle>
           </DialogHeader>
           <div className="py-4">
             <p className="text-sm text-gray-600">
               确定要重新分析链接 <span className="font-medium text-gray-900">&ldquo;{title}&rdquo;</span> 吗？
             </p>
             <p className="text-sm text-gray-500 mt-2">
               这将使用AI重新分析网站内容，更新标题、描述和标签。
             </p>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={handleCancelReanalyze}>
               取消
             </Button>
             <Button
               variant="default"
               onClick={handleConfirmReanalyze}
               disabled={isReanalyzing}
             >
               {isReanalyzing ? '分析中...' : '确认重新分析'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </>
  )
}
