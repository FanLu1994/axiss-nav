import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

// 获取所有链接 - 未登录用户也可以查看
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const user = getUserFromToken(authHeader)
      userId = user?.userId || null
    }

    // 如果用户已登录，获取该用户的链接；否则获取所有活跃链接
    const whereClause = userId 
      ? { userId, isActive: true }
      : { isActive: true }

    const links = await prisma.link.findMany({
      where: whereClause,
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

    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
        userId: user.userId
      }
    })
    
    return NextResponse.json(link)
  } catch (error) {
    console.error('添加链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 