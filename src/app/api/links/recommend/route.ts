import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取推荐链接 - 基于点击次数和添加时间的算法
export async function GET() {
  try {
    // 获取所有活跃的链接
    const links = await prisma.link.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        url: true,
        icon: true,
        clickCount: true,
        createdAt: true,
        tags: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (links.length === 0) {
      return NextResponse.json({
        data: [],
        message: '暂无推荐链接'
      })
    }

    // 计算推荐分数
    const now = Date.now()
    const linksWithScore = links.map(link => {
      const createdTime = new Date(link.createdAt).getTime()
      const daysSinceCreated = (now - createdTime) / (1000 * 60 * 60 * 24)
      
      // 推荐算法：
      // 1. 点击次数越少，分数越高（最大100分）
      // 2. 添加时间越久，分数越高（最大50分）
      // 3. 增加随机因子，避免结果过于固定（最大20分）
      
      const clickScore = Math.max(0, 100 - link.clickCount * 5) // 点击次数少的优先
      const ageScore = Math.min(50, daysSinceCreated * 2) // 添加时间久的优先
      const randomScore = Math.random() * 20 // 随机因子
      
      const totalScore = clickScore + ageScore + randomScore
      
      return {
        ...link,
        score: totalScore
      }
    })

    // 按分数排序并取前7个
    const recommendedLinks = linksWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        clickCount: link.clickCount,
        createdAt: link.createdAt,
        tags: link.tags
      })) // 移除分数字段

    return NextResponse.json({
      data: recommendedLinks,
      message: '推荐链接获取成功'
    })
  } catch (error) {
    console.error('获取推荐链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 