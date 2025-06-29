import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取随机标签
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    
    // 获取所有活跃的标签，按使用频率排序
    const tags = await prisma.tag.findMany({
      where: { 
        isActive: true,
        links: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        _count: {
          select: {
            links: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        links: {
          _count: 'desc'
        }
      }
    })
    
    // 如果标签数量不够，直接返回所有标签
    if (tags.length <= limit) {
      return NextResponse.json({
        data: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          icon: tag.icon,
          count: tag._count.links
        }))
      })
    }
    
    // 随机选择指定数量的标签
    const shuffled = [...tags].sort(() => 0.5 - Math.random())
    const randomTags = shuffled.slice(0, limit)
    
    return NextResponse.json({
      data: randomTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        icon: tag.icon,
        count: tag._count.links
      }))
    })
  } catch (error) {
    console.error('获取随机标签错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 