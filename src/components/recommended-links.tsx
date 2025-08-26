"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

interface RecommendedLink {
  id: string
  title: string
  url: string
  description?: string
  icon?: string
  clickCount: number
  createdAt: string
  tags: string[] // 现在是字符串数组
  category?: string
  color?: string
}

export function RecommendedLinks() {
  const [links, setLinks] = useState<RecommendedLink[]>([])
  const [loading, setLoading] = useState(true)
  const [randomizing, setRandomizing] = useState(false)

  useEffect(() => {
    fetchRecommendedLinks()
  }, [])

  const fetchRecommendedLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/links/recommend')
      if (response.ok) {
        const data = await response.json()
        setLinks(data.data || [])
      } else {
        console.error('获取推荐链接失败')
      }
    } catch (error) {
      console.error('获取推荐链接错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      // 记录点击
      await fetch('/api/links/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId })
      })
      
      // 打开链接
      window.open(url, '_blank')
    } catch (error) {
      console.error('记录点击失败:', error)
      // 即使记录失败也打开链接
      window.open(url, '_blank')
    }
  }

  const handleRandomVisit = async () => {
    try {
      setRandomizing(true)
      const response = await fetch('/api/links/random')
      
      if (response.ok) {
        const data = await response.json()
        const randomLink = data.data
        
        // 记录点击并打开随机链接
        await handleLinkClick(randomLink.id, randomLink.url)
      } else {
        console.error('获取随机链接失败')
      }
    } catch (error) {
      console.error('随机访问错误:', error)
    } finally {
      setRandomizing(false)
    }
  }

  if (loading) {
    return null // 直接返回null，让skeleton组件显示
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
          <Sparkles className="w-3 h-3" />
          <span className="text-xs font-light tracking-wide">推荐</span>
          <Sparkles className="w-3 h-3" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="group cursor-pointer hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center text-center"
            onClick={() => handleLinkClick(link.id, link.url)}
          >
            <div className="flex flex-col items-center space-y-1">
              {link.icon ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  {link.icon.startsWith('data:') || link.icon.startsWith('http://') || link.icon.startsWith('https://') ? (
                    <img 
                      src={link.icon} 
                      alt={link.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-sm">{link.icon}</span>
                  )}
                </div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center">
                  <img 
                    src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(link.url)}`}
                    alt={link.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="text-xs text-gray-600 leading-tight line-clamp-1 group-hover:text-gray-800 transition-colors max-w-[60px]">
                {link.title}
              </div>
            </div>
          </div>
        ))}
        {/* 随机访问按钮 */}
        <div
          className="group cursor-pointer hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-300"
          onClick={handleRandomVisit}
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="w-5 h-5 flex items-center justify-center">
              {randomizing ? (
                <span className="text-sm animate-spin">🎯</span>
              ) : (
                <span className="text-sm">❓</span>
              )}
            </div>
            <div className="text-xs text-gray-600 leading-tight line-clamp-1 group-hover:text-gray-800 transition-colors max-w-[60px]">
              随便看看
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 