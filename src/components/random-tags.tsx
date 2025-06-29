import { useState, useEffect } from "react"

interface Tag {
  id: string
  name: string
  color?: string
  icon?: string
  count: number
}

interface RandomTagsProps {
  onTagClick: (tag: string) => void
  onRefresh: () => void
  tagSeed: number
}

export function RandomTags({ onTagClick, onRefresh, tagSeed }: RandomTagsProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  // 从API获取随机标签
  const fetchRandomTags = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tags?limit=15')
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        setTags(response.data)
      } else {
        setTags([])
      }
    } catch (error) {
      console.error('获取随机标签失败:', error)
      setTags([])
    }
    setLoading(false)
  }

  // 初始加载和刷新时获取标签
  useEffect(() => {
    fetchRandomTags()
  }, [tagSeed])

  const handleRefresh = () => {
    onRefresh()
    fetchRandomTags()
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-4 py-2">
        <div className="text-center text-xs text-gray-400">加载标签中...</div>
      </div>
    )
  }

  if (tags.length === 0) {
    return null
  }

  // 为了真正无缝循环，我们需要确保有足够的标签来填满屏幕
  const duplicatedTags = [...tags, ...tags, ...tags]
  const animationDuration = Math.max(30, tags.length * 3)

  return (
    <div className="flex items-center gap-3 w-full max-w-7xl mx-auto mb-4 group">
      {/* 标签滚动容器 */}
      <div className="flex-1 overflow-hidden">
        <div className="py-2">
          <div 
            className="flex gap-2"
            style={{ 
              width: 'max-content',
              animation: `scrollBanner ${animationDuration}s linear infinite`,
              animationPlayState: 'running'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running'
            }}
          >
            {duplicatedTags.map((tag, index) => (
              <button
                key={`${tag.id}-${index}`}
                onClick={() => onTagClick(tag.name)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-full border border-gray-200/40 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200/60 transition-all duration-200 cursor-pointer whitespace-nowrap bg-white/60 backdrop-blur-sm shadow-sm"
                style={tag.color ? { 
                  borderColor: tag.color + '30', 
                  backgroundColor: tag.color + '08' 
                } : {}}
              >
                {tag.icon && (
                  <span className="mr-1 text-xs" dangerouslySetInnerHTML={{ __html: tag.icon }} />
                )}
                {tag.name}
                <span className="ml-1 text-xs opacity-50">({tag.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 刷新图标按钮 - 容器外部右侧 */}
      <button
        onClick={handleRefresh}
        className="flex-shrink-0 p-2 bg-white/90 backdrop-blur-sm text-gray-500 rounded-full border border-gray-200/40 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300/60 transition-all duration-200 cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
        disabled={loading}
        title="换一批"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
      </button>

      <style jsx global>{`
        @keyframes scrollBanner {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }
      `}</style>
    </div>
  )
} 