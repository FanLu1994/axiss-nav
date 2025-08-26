import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取随机链接
export async function GET() {
  try {
    // 获取所有活跃的链接
    const links = await prisma.link.findMany({
      where: { isActive: true },
      select: {
        id: true,
        url: true,
        title: true
      }
    })

    if (links.length === 0) {
      return NextResponse.json({
        error: '暂无可用链接'
      }, { status: 404 })
    }

    // 随机选择一个链接
    const randomIndex = Math.floor(Math.random() * links.length)
    const randomLink = links[randomIndex]

    return NextResponse.json({
      data: randomLink
    })
  } catch (error) {
    console.error('获取随机链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}