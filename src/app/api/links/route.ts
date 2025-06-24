import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

// 获取所有链接 - 所有用户都可以查看所有链接
export async function GET() {
  try {
    const links = await prisma.link.findMany({
      where: { isActive: true },
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
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(links)
  } catch (error) {
    console.error('获取链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
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

    const { title, url, description, tags } = await request.json()
    if (!title || !url) {
      return NextResponse.json({ error: '标题和网址是必填项' }, { status: 400 })
    }

    // 处理标签
    const tagConnections = []
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // 查找或创建标签
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const existingTag = await prisma.tag.findFirst({
            where: {
              name: tagName.trim(),
              userId: user.userId
            }
          })
          
          if (existingTag) {
            tagConnections.push({ id: existingTag.id })
          } else {
            // 创建新标签
            const newTag = await prisma.tag.create({
              data: {
                name: tagName.trim(),
                userId: user.userId
              }
            })
            tagConnections.push({ id: newTag.id })
          }
        }
      }
    }

    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
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