import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取用户的所有分类
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            links: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categories)

  } catch (error) {
    console.error('获取分类错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { name, description, icon, color, order } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '分类名称是必填项' },
        { status: 400 }
      )
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
        isActive: true
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        icon,
        color,
        order: order || 0,
        userId
      }
    })

    return NextResponse.json({
      message: '分类创建成功',
      category
    }, { status: 201 })

  } catch (error) {
    console.error('创建分类错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 