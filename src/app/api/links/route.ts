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
            {
              tags: {
                some: {
                  name: { contains: search, mode: 'insensitive' as const },
                  isActive: true
                }
              }
            }
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
          tags: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            },
            where: { isActive: true }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: pageSize
      })
    ])
    
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

    const { url, title, description, icon, tags } = await request.json()
    
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

    // 处理标签（去重）
    const tagConnections = []
    const tagNames = new Set<string>() // 用于去重
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // 使用传入的标签
      for (const tagInfo of tags) {
        const tagName = (typeof tagInfo === 'string' ? tagInfo : tagInfo.name)?.trim()
        const tagEmoji = (typeof tagInfo === 'object' ? tagInfo.emoji : null) || '🏷️'
        
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
      // 使用默认标签
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
        icon: icon || '',
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