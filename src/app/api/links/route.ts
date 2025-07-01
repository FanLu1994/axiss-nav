import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'
import { analyzeUrl, isAIServiceAvailable } from '@/lib/ai'

// 获取链接 - 支持分页和搜索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    
    // 构建搜索条件
    const whereCondition = search 
      ? {
          isActive: true,
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { url: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            {
              tags: {
                some: {
                  name: { contains: search, mode: 'insensitive' as const }
                }
              }
            }
          ]
        }
      : { isActive: true }

    const skip = (page - 1) * pageSize

    // 获取总数
    const total = await prisma.link.count({ where: whereCondition })

    // 获取分页数据
    const links = await prisma.link.findMany({
      where: whereCondition,
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { order: 'asc' },
      skip,
      take: pageSize
    })
    
    return NextResponse.json({
      data: links,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page < Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('获取链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

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

// 新增链接 - 需要登录
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

    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: '网址是必填项' }, { status: 400 })
    }

    // 验证URL格式
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: '请输入有效的网址（需要包含 http:// 或 https://）' }, { status: 400 })
    }

    // 检查URL是否已经存在
    const existingLink = await prisma.link.findFirst({
      where: {
        url: url,
        isActive: true,
        userId: user.userId // 只检查当前用户的链接
      }
    })

    if (existingLink) {
      return NextResponse.json({ 
        error: '该网址已经存在',
        existingLink: {
          id: existingLink.id,
          title: existingLink.title,
          url: existingLink.url
        }
      }, { status: 409 }) // 409 Conflict
    }

    // 获取网站信息
    const websiteInfo = await fetchWebsiteInfo(url)
    
    let aiAnalysis = null
    let title = websiteInfo.title
    let description = '等待ai生成描述'
    
    // 尝试调用AI分析URL
    if (isAIServiceAvailable()) {
      try {
        aiAnalysis = await analyzeUrl(url)
        title = aiAnalysis.title || websiteInfo.title
        description = aiAnalysis.description
      } catch (error) {
        console.error('AI分析失败，使用默认信息:', error)
      }
    }
    
    // 处理标签（去重）
    const tagConnections = []
    const tagNames = new Set<string>() // 用于去重
    
    if (aiAnalysis && aiAnalysis.tags && aiAnalysis.tags.length > 0) {
      // 使用AI生成的标签
      for (const tagInfo of aiAnalysis.tags) {
        const tagName = tagInfo.name.trim()
        const tagEmoji = tagInfo.emoji || '🏷️'
        
        if (!tagName || tagNames.has(tagName)) continue // 跳过空标签和重复标签
        tagNames.add(tagName)
        
        // 查找或创建标签
        let existingTag = await prisma.tag.findFirst({
          where: {
            name: tagName,
            userId: user.userId
          }
        })
        
        if (existingTag) {
          // 更新emoji如果不存在
          if (!existingTag.icon && tagEmoji) {
            existingTag = await prisma.tag.update({
              where: { id: existingTag.id },
              data: { icon: tagEmoji }
            })
          }
          tagConnections.push({ id: existingTag.id })
        } else {
          // 创建新标签
          const newTag = await prisma.tag.create({
            data: {
              name: tagName,
              icon: tagEmoji,
              userId: user.userId
            }
          })
          tagConnections.push({ id: newTag.id })
        }
      }
    } else {
      // 使用默认标签（如果AI不可用）
      const defaultTags = ['链接', '收藏']
      for (const tagName of defaultTags) {
        if (tagNames.has(tagName)) continue
        tagNames.add(tagName)
        
        const existingTag = await prisma.tag.findFirst({
          where: {
            name: tagName,
            userId: user.userId
          }
        })
        
        if (existingTag) {
          tagConnections.push({ id: existingTag.id })
        } else {
          const newTag = await prisma.tag.create({
            data: {
              name: tagName,
              icon: '🔗',
              userId: user.userId
            }
          })
          tagConnections.push({ id: newTag.id })
        }
      }
    }

    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
        icon: websiteInfo.icon || '',
        userId: user.userId,
        tags: {
          connect: tagConnections
        }
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })
    
    return NextResponse.json(link)
  } catch (error) {
    console.error('添加链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 删除链接 - 需要登录
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')
    
    if (!linkId) {
      return NextResponse.json({ error: '缺少链接ID' }, { status: 400 })
    }

    // 检查链接是否存在且属于当前用户（或者是管理员）
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { user: true }
    })

    if (!link) {
      return NextResponse.json({ error: '链接不存在' }, { status: 404 })
    }

    // 只有链接的创建者或管理员可以删除
    if (link.userId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限删除此链接' }, { status: 403 })
    }

    await prisma.link.delete({
      where: { id: linkId }
    })
    
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 