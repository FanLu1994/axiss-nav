import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 记录链接点击次数
export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json()
    
    if (!linkId) {
      return NextResponse.json({ error: '缺少链接ID' }, { status: 400 })
    }

    // 检查链接是否存在且处于活跃状态
    const link = await prisma.link.findUnique({
      where: { 
        id: linkId,
        isActive: true
      }
    })

    if (!link) {
      return NextResponse.json({ error: '链接不存在' }, { status: 404 })
    }

    // 增加点击次数
    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data: {
        clickCount: {
          increment: 1
        }
      }
    })
    
    return NextResponse.json({ 
      success: true,
      clickCount: updatedLink.clickCount,
      url: updatedLink.url
    })
  } catch (error) {
    console.error('记录点击次数错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 