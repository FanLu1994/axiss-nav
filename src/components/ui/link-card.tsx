import { ReactNode } from "react"

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
  const faviconUrl = icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault()
    e.stopPropagation()
    onTagClick?.(tag)
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer border border-white/20 hover:border-blue-200/50 hover:scale-[1.02] min-w-0"
      title={title}
    >
      <div className="flex-shrink-0 mr-3">
        <img
          src={faviconUrl}
          alt={title}
          className="w-8 h-8 rounded"
          loading="lazy"
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
            {tags.slice(0, 2).map((tag, index) => (
              <button
                key={index}
                onClick={(e) => handleTagClick(e, tag)}
                className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                {tag}
              </button>
            ))}
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
  )
} 