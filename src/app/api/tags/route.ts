import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { matchTagEmoji, getRandomTagEmoji } from '@/lib/emoji-matcher'

// 解析标签数据，支持字符串数组或对象数组格式
function parseTagsFromDatabase(tagsString: string, useRandomEmoji: boolean = false): Array<{name: string; icon: string}> {
  try {
    const parsed = JSON.parse(tagsString)
    if (Array.isArray(parsed)) {
      return parsed.map(tag => {
        if (typeof tag === 'string') {
          // 旧格式：字符串数组
          return {
            name: tag,
            icon: useRandomEmoji ? getRandomTagEmoji(tag) : matchTagEmoji(tag)
          }
        } else if (tag && typeof tag === 'object' && tag.name) {
          // 新格式：对象数组，可能包含emoji字段
          return {
            name: tag.name,
            icon: tag.emoji || tag.icon || (useRandomEmoji ? getRandomTagEmoji(tag.name) : matchTagEmoji(tag.name))
          }
        }
        return null
      }).filter(Boolean) as Array<{name: string; icon: string}>
    }
  } catch (error) {
    console.error('解析标签JSON失败:', error)
  }
  return []
}

// 获取随机标签 - 从Link表中提取标签信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '7')
    const randomEmoji = searchParams.get('randomEmoji') === 'true' // 是否使用随机emoji
    
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
    const tagCounts = new Map<string, { count: number; color?: string; icon: string }>()
    
    links.forEach(link => {
      if (link.tags) {
        const parsedTags = parseTagsFromDatabase(link.tags, randomEmoji)
        parsedTags.forEach(tagInfo => {
          if (tagInfo.name) {
            const existingTag = tagCounts.get(tagInfo.name)
            tagCounts.set(tagInfo.name, {
              count: (existingTag?.count || 0) + 1,
              color: link.color || existingTag?.color,
              icon: randomEmoji ? getRandomTagEmoji(tagInfo.name) : (tagInfo.icon || existingTag?.icon || matchTagEmoji(tagInfo.name))
            })
          }
        })
      }
      
      // 也统计category字段
      if (link.category) {
        const existingCategory = tagCounts.get(link.category)
        tagCounts.set(link.category, {
          count: (existingCategory?.count || 0) + 1,
          color: link.color || existingCategory?.color,
          icon: randomEmoji ? getRandomTagEmoji(link.category) : (existingCategory?.icon || matchTagEmoji(link.category))
        })
      }
    })
    
    // 转换为数组格式
    const tags = Array.from(tagCounts.entries()).map(([name, info]) => ({
      id: name, // 使用标签名作为ID
      name,
      color: info.color,
      icon: info.icon,
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