"use client"

import { useState, useEffect } from "react"

interface RecommendedLink {
  id: string
  title: string
  url: string
  icon?: string
  clickCount: number
  createdAt: string
  tags: Array<{
    id: string
    name: string
    icon?: string
    color?: string
  }>
}

export function RecommendedLinks() {
  const [recommendedLinks, setRecommendedLinks] = useState<RecommendedLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendedLinks()
  }, [])

  const fetchRecommendedLinks = async () => {
    try {
      const res = await fetch('/api/links/recommend')
      const response = await res.json()
      
      if (response.data && Array.isArray(response.data)) {
        setRecommendedLinks(response.data)
      } else {
        setRecommendedLinks([])
      }
    } catch (error) {
      console.error('获取推荐链接失败:', error)
      setRecommendedLinks([])
    } finally {
      setLoading(false)
    }
  }

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleLinkClick = async (link: RecommendedLink) => {
    try {
      // 记录点击并在后台更新点击次数
      fetch('/api/links/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId: link.id })
      }).catch(err => {
        console.error('记录点击失败:', err)
      })
      
      // 打开链接
      window.open(link.url, '_blank')
    } catch (error) {
      console.error('打开链接失败:', error)
    }
  }

  const handleImageError = (linkId: string) => {
    setImageErrors(prev => new Set(prev).add(linkId))
  }

  if (loading) {
    return (
      <div className="w-full mb-8">
        <div className="text-center text-gray-400 py-4">
          加载推荐中...
        </div>
      </div>
    )
  }

  if (recommendedLinks.length === 0) {
    return null
  }

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-light tracking-wide">推荐</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {recommendedLinks.map((link) => (
          <div
            key={link.id}
            className="group cursor-pointer hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center text-center"
            onClick={() => handleLinkClick(link)}
          >
            <div className="flex flex-col items-center space-y-1">
              {link.icon ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  {link.icon.startsWith('data:') || link.icon.startsWith('http://') || link.icon.startsWith('https://') ? (
                    <img 
                      src={imageErrors.has(link.id) ? '/globe.svg' : link.icon} 
                      alt={link.title}
                      className="w-full h-full object-contain"
                      onError={() => handleImageError(link.id)}
                    />
                  ) : (
                    <span className="text-sm">{link.icon}</span>
                  )}
                </div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center">
                  <img 
                    src={imageErrors.has(link.id) ? '/globe.svg' : `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(link.url)}`}
                    alt={link.title}
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(link.id)}
                  />
                </div>
              )}
              <div className="text-xs text-gray-600 leading-tight line-clamp-1 group-hover:text-gray-800 transition-colors max-w-[60px]">
                {link.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 