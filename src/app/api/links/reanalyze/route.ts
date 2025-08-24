import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

// 重新分析链接 - 需要登录
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined
    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

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

    // 这里可以添加链接分析逻辑，比如获取网页标题、描述等
    // 暂时使用简单的标签生成逻辑
    const tags = [
      { name: '链接', emoji: '🔗' },
      { name: '收藏', emoji: '⭐' }
    ]

    // 更新链接信息
    await prisma.link.update({
      where: { id: linkId },
      data: {
        tags: JSON.stringify(tags.map(tag => tag.name)),
        category: tags[0]?.name || null,
        color: null
      }
    })

    // 获取更新后的链接信息
    const finalLink = await prisma.link.findUnique({
      where: { id: linkId }
    })
    
    return NextResponse.json({
      success: true,
      message: '重新分析完成',
      link: {
        id: finalLink?.id,
        title: finalLink?.title,
        description: finalLink?.description,
        icon: finalLink?.icon,
        tags: finalLink?.tags ? JSON.parse(finalLink.tags) : []
      }
    })
  } catch (error) {
    console.error('重新分析链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
