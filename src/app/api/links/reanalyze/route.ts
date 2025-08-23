import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'
import { analyzeUrl, isAIServiceAvailable } from '@/lib/ai'

// 验证URL格式
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// 获取网页标题和icon
async function fetchWebsiteInfo(url: string): Promise<{ title: string; icon?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch website')
    }
    
    const html = await response.text()
    
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    let title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname
    
    // 清理标题
    title = title.replace(/\s+/g, ' ').substring(0, 100)
    
    // 提取icon (favicon)
    let icon = ''
    const iconMatches = [
      html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i),
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
    ]
    
    for (const match of iconMatches) {
      if (match) {
        let iconUrl = match[1]
        if (iconUrl.startsWith('//')) {
          iconUrl = new URL(url).protocol + iconUrl
        } else if (iconUrl.startsWith('/')) {
          iconUrl = new URL(url).origin + iconUrl
        } else if (!iconUrl.startsWith('http')) {
          iconUrl = new URL(iconUrl, url).href
        }
        icon = iconUrl
        break
      }
    }
    
    // 如果没找到favicon，使用默认路径
    if (!icon) {
      try {
        const faviconUrl = new URL('/favicon.ico', url).href
        const faviconResponse = await fetch(faviconUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        })
        if (faviconResponse.ok) {
          icon = faviconUrl
        }
      } catch {
        // 忽略favicon检查失败
      }
    }
    
    return { title, icon }
  } catch (error) {
    console.error('获取网站信息失败:', error)
    // 返回基本信息
    return { title: new URL(url).hostname }
  }
}

// 重新分析链接 - 需要登录
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = getUserFromToken(authHeader)
    
    if (!user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const { linkId } = await request.json()
    if (!linkId) {
      return NextResponse.json({ error: '链接ID是必填项' }, { status: 400 })
    }

    // 查找链接并验证所有权
    const existingLink = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: user.userId,
        isActive: true
      }
    })

    if (!existingLink) {
      return NextResponse.json({ error: '链接不存在或无权限访问' }, { status: 404 })
    }

    // 验证URL格式
    if (!isValidUrl(existingLink.url)) {
      return NextResponse.json({ error: '链接URL格式无效' }, { status: 400 })
    }

    // 获取网站信息
    const websiteInfo = await fetchWebsiteInfo(existingLink.url)
    
    let title = websiteInfo.title
    let description = '暂无描述'
    let tags: Array<{ name: string; emoji?: string }> = []
    
    // 尝试调用AI分析URL
    if (isAIServiceAvailable()) {
      try {
        const aiAnalysis = await analyzeUrl(existingLink.url)
        title = aiAnalysis.title || websiteInfo.title
        description = aiAnalysis.description || '暂无描述'
        
        if (aiAnalysis.tags && aiAnalysis.tags.length > 0) {
          tags = aiAnalysis.tags.map(tag => ({
            name: tag.name,
            emoji: tag.emoji || '🏷️'
          }))
        } else {
          // 默认标签
          tags = [
            { name: '链接', emoji: '🔗' },
            { name: '收藏', emoji: '⭐' }
          ]
        }
      } catch (error) {
        console.error('AI分析失败，使用默认信息:', error)
        // 使用默认标签
        tags = [
          { name: '链接', emoji: '🔗' },
          { name: '收藏', emoji: '⭐' }
        ]
      }
    } else {
      // AI不可用时的默认标签
      tags = [
        { name: '链接', emoji: '🔗' },
        { name: '收藏', emoji: '⭐' }
      ]
    }

    // 更新数据库中的链接信息
    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data: {
        title,
        description,
        icon: websiteInfo.icon || existingLink.icon,
        updatedAt: new Date()
      }
    })

    // 清除链接与标签的关联关系
    await prisma.link.update({
      where: { id: linkId },
      data: {
        tags: {
          set: [] // 清除所有关联的标签
        }
      }
    })

    // 为每个标签创建或查找现有标签，然后建立关联
    for (const tag of tags) {
      // 查找或创建标签
      let existingTag = await prisma.tag.findFirst({
        where: {
          name: tag.name,
          userId: user.userId
        }
      })

      if (!existingTag) {
        // 创建新标签
        existingTag = await prisma.tag.create({
          data: {
            name: tag.name,
            icon: tag.emoji,
            userId: user.userId
          }
        })
      }

      // 建立链接与标签的关联
      await prisma.link.update({
        where: { id: linkId },
        data: {
          tags: {
            connect: { id: existingTag.id }
          }
        }
      })
    }

    // 获取更新后的链接信息（包含标签）
    const finalLink = await prisma.link.findUnique({
      where: { id: linkId },
      include: {
        tags: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '重新分析完成',
      link: {
        id: finalLink?.id,
        title: finalLink?.title,
        description: finalLink?.description,
        icon: finalLink?.icon,
        tags: finalLink?.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          icon: tag.icon
        }))
      }
    })
  } catch (error) {
    console.error('重新分析链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
