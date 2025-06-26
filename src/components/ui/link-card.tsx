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
}

export function LinkCard({ title, url, description, icon, tags, onTagClick, children }: LinkCardProps) {
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
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 1000)
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

  return (
    <>
      <a
        ref={cardRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer border border-white/20 hover:border-blue-200/50 hover:scale-[1.02] min-w-0"
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
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 truncate group-hover:text-gray-600 mb-1">
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
                    className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200"
                  >
                    {tagName}
                  </button>
                )
              })}
              {tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        {children}
      </a>
      
      {/* Tooltip */}
      {showTooltip && description && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs break-words pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="relative">
            {description}
            {/* 箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </>
  )
} 