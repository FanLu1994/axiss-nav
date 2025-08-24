import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 记录链接点击
export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json()

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

    // 更新点击次数
    await prisma.link.update({
      where: { id: linkId },
      data: {
        clickCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: '点击记录成功' 
    })
  } catch (error) {
    console.error('记录点击错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 