import { useMemo } from "react"

interface Link {
  id: string
  title: string
  url: string
  description?: string
  tags?: string[]
  order?: number
  isActive?: boolean
  clickCount?: number
  createdAt?: Date
  updatedAt?: Date
}

interface RandomTagsProps {
  links: Link[]
  onTagClick: (tag: string) => void
  onRefresh: () => void
  tagSeed: number
}

export function RandomTags({ links, onTagClick, onRefresh, tagSeed }: RandomTagsProps) {
  // 获取所有唯一的标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    links.forEach(link => {
      link.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  }, [links])

  // 随机选择6个标签显示
  const randomTags = useMemo(() => {
    const shuffled = [...allTags].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 6)
  }, [allTags, tagSeed])

  if (randomTags.length === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        {randomTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1.5 text-xs font-medium bg-white/80 backdrop-blur-sm text-gray-600 rounded-full border border-white/20 hover:bg-blue-50/80 hover:text-blue-600 hover:border-blue-200/50 transition-colors duration-200 shadow-sm cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
      <button
        onClick={onRefresh}
        className="px-4 py-1.5 text-xs font-medium bg-gray-100/80 backdrop-blur-sm text-gray-600 rounded-full border border-white/20 hover:bg-gray-200/80 hover:text-gray-700 transition-colors duration-200 flex-shrink-0 cursor-pointer"
      >
        换一批
      </button>
    </div>
  )
} 