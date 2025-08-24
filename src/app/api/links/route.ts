import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

// 获取链接 - 支持分页和搜索 - 优化版本
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100) // 限制最大页面大小
    const search = searchParams.get('search')?.trim() || ''
    
    // 优化的搜索条件
    const whereCondition = search 
      ? {
          isActive: true,
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { url: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
            { tags: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : { isActive: true }

    const skip = (page - 1) * pageSize

    // 使用Promise.all并行执行count和查询
    const [total, links] = await Promise.all([
      prisma.link.count({ where: whereCondition }),
      prisma.link.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          icon: true,
          order: true,
          isActive: true,
          clickCount: true,
          createdAt: true,
          updatedAt: true,
          tags: true,
          category: true,
          color: true
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: pageSize
      })
    ])
    
    // 处理tags字段，将JSON字符串转换为数组
    const processedLinks = links.map(link => ({
      ...link,
      tags: link.tags ? JSON.parse(link.tags) : []
    }))
    
    const response = NextResponse.json({
      data: processedLinks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page < Math.ceil(total / pageSize)
      }
    })
    
    // 添加缓存头，提高性能
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60')
    
    return response
  } catch (error) {
    console.error('获取链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 验证URL格式
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 新增链接 - 需要登录
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined
    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, description, icon, tags, category, color } = body

    // 验证必填字段
    if (!title?.trim() || !url?.trim()) {
      return NextResponse.json({ error: '标题和URL不能为空' }, { status: 400 })
    }

    // 验证URL格式
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'URL格式不正确' }, { status: 400 })
    }

    // 处理标签数据
    const tagNames = new Set<string>() // 用于去重
    const processedTags = []
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // 使用传入的标签
      for (const tagInfo of tags) {
        const tagName = (typeof tagInfo === 'string' ? tagInfo : tagInfo.name)?.trim()
        
        if (!tagName || tagNames.has(tagName)) continue // 跳过空标签和重复标签
        tagNames.add(tagName)
        processedTags.push(tagName)
      }
    } else {
      // 使用默认标签
      const defaultTags = ['链接', '收藏']
      for (const tagName of defaultTags) {
        if (tagNames.has(tagName)) continue
        tagNames.add(tagName)
        processedTags.push(tagName)
      }
    }

    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
        icon: icon || '',
        tags: JSON.stringify(processedTags),
        category: category || processedTags[0] || null,
        color: color || null
      }
    })
    
    return NextResponse.json({
      ...link,
      tags: processedTags
    })
  } catch (error) {
    console.error('添加链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 删除链接 - 需要登录
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined
    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: '链接ID不能为空' }, { status: 400 })
    }

    // 查找链接
    const link = await prisma.link.findUnique({
      where: { id: linkId }
    })

    if (!link) {
      return NextResponse.json({ error: '链接不存在' }, { status: 404 })
    }

    // 删除链接（软删除）
    await prisma.link.update({
      where: { id: linkId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: '链接已删除' })
  } catch (error) {
    console.error('删除链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 