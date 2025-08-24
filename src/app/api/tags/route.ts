import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取随机标签 - 从Link表中提取标签信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    
    // 获取所有活跃的链接的标签信息
    const links = await prisma.link.findMany({
      where: { 
        isActive: true,
        tags: { not: null }
      },
      select: {
        tags: true,
        category: true,
        color: true
      }
    })
    
    // 提取所有标签并统计使用频率
    const tagCounts = new Map<string, { count: number; color?: string }>()
    
    links.forEach(link => {
      if (link.tags) {
        try {
          const tags = JSON.parse(link.tags)
          if (Array.isArray(tags)) {
            tags.forEach(tagName => {
              if (tagName && typeof tagName === 'string') {
                const current = tagCounts.get(tagName) || { count: 0 }
                tagCounts.set(tagName, {
                  count: current.count + 1,
                  color: link.color || current.color
                })
              }
            })
          }
        } catch (error) {
          console.error('解析标签JSON失败:', error)
        }
      }
      
      // 也统计category字段
      if (link.category) {
        const current = tagCounts.get(link.category) || { count: 0 }
        tagCounts.set(link.category, {
          count: current.count + 1,
          color: link.color || current.color
        })
      }
    })
    
    // 转换为数组格式
    const tags = Array.from(tagCounts.entries()).map(([name, info]) => ({
      id: name, // 使用标签名作为ID
      name,
      color: info.color,
      icon: '🏷️', // 默认图标
      count: info.count
    }))
    
    // 按使用频率排序
    tags.sort((a, b) => b.count - a.count)
    
    // 如果标签数量不够，直接返回所有标签
    if (tags.length <= limit) {
          const response = NextResponse.json({
      data: tags
    })
    
    // 添加缓存头，标签数据变化不频繁
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    
    return response
    }
    
    // 随机选择指定数量的标签
    const shuffled = [...tags].sort(() => 0.5 - Math.random())
    const randomTags = shuffled.slice(0, limit)
    
    const response = NextResponse.json({
      data: randomTags
    })
    
    // 添加缓存头，标签数据变化不频繁
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    
    return response
  } catch (error) {
    console.error('获取随机标签错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 