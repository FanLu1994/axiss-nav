import { ReactNode, useState, useEffect, useRef } from "react"

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
  children?: ReactNode
  mode?: 'normal' | 'compact' | 'table'
}

export function LinkCard({ title, url, description, icon, tags, onTagClick, children, mode = 'normal' }: LinkCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLAnchorElement>(null)
  
  const faviconUrl = icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`
  const defaultImage = "/globe.svg" // 使用 public 目录中的默认图片

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault()
    e.stopPropagation()
    onTagClick?.(tag)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!description) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const tooltipWidth = 280 // 预估tooltip宽度
    
    let x = rect.left + rect.width / 2
    // 防止tooltip超出右边界
    if (x + tooltipWidth / 2 > viewportWidth - 10) {
      x = viewportWidth - tooltipWidth / 2 - 10
    }
    // 防止tooltip超出左边界
    if (x - tooltipWidth / 2 < 10) {
      x = tooltipWidth / 2 + 10
    }
    
    setTooltipPosition({
      x: x,
      y: rect.top - 10
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
      <a
        ref={cardRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center hover:scale-[1.05] transition-all duration-200 p-2 cursor-pointer w-full"
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
      </a>
    )
  }

  if (mode === 'table') {
    return (
      <a
        ref={cardRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center hover:bg-gray-50/50 transition-all duration-200 py-1 px-4 cursor-pointer max-w-2xl mx-auto"
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
        <div className="flex-1 min-w-0 max-w-[300px]">
          <p className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
            {description || '暂无描述'}
          </p>
        </div>
        {children}
      </a>
    )
  }

  return (
    <>
      <a
        ref={cardRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer border border-white/20 hover:border-blue-200/50 hover:scale-[1.02] w-full"
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
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate mb-1 max-w-[200px]">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 group-hover:text-gray-600 mb-1 truncate max-w-[150px]">
              {description}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag: string | { name: string }, index) => {
                const tagName = typeof tag === 'string' ? tag : tag.name
                return (
                  <button
                    key={index}
                    onClick={(e) => handleTagClick(e, tagName)}
                    className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 flex-shrink-0"
                  >
                    {tagName}
                  </button>
                )
              })}
              {tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full flex-shrink-0">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        {children}
      </a>
      
      {/* Tooltip - 只在描述过长时显示 */}
      {showTooltip && description && isDescriptionLong && (
        <div
          className="fixed z-50 bg-gray-800/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-gray-700/50 max-w-[280px] break-words pointer-events-none transform -translate-x-1/2 -translate-y-full leading-relaxed"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="relative">
            {description}
            {/* 箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800/95"></div>
          </div>
        </div>
      )}
    </>
  )
} 