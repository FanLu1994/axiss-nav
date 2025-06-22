import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有链接
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    const links = await prisma.link.findMany({
      where: { userId, isActive: true },
      include: { tags: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(links)
  } catch (error) {
    console.error('获取链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 新增链接
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    const { title, url, description, tags } = await request.json()
    if (!title || !url) {
      return NextResponse.json({ error: '标题和网址是必填项' }, { status: 400 })
    }
    // 处理标签
    let tagObjs: { id: string }[] = []
    if (Array.isArray(tags) && tags.length > 0) {
      tagObjs = await Promise.all(tags.map(async (tagName: string) => {
        // 查找或创建标签
        let tag = await prisma.tag.findFirst({ where: { name: tagName, userId, isActive: true } })
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName, userId } })
        }
        return { id: tag.id }
      }))
    }
    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
        userId,
        tags: { connect: tagObjs }
      },
      include: { tags: true }
    })
    return NextResponse.json(link)
  } catch (error) {
    console.error('添加链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 