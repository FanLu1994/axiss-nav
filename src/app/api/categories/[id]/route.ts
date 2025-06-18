import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个分类
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params

    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isActive: true
      },
      include: {
        links: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)

  } catch (error) {
    console.error('获取分类错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params
    const { name, description, icon, color, order } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isActive: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    // 如果更新名称，检查是否与其他分类重名
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          userId,
          name,
          isActive: true,
          NOT: {
            id
          }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: '分类名称已存在' },
          { status: 409 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        color,
        order
      }
    })

    return NextResponse.json({
      message: '分类更新成功',
      category: updatedCategory
    })

  } catch (error) {
    console.error('更新分类错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除分类（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params

    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId,
        isActive: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    // 软删除分类
    await prisma.category.update({
      where: { id },
      data: { isActive: false }
    })

    // 将该分类下的所有链接的categoryId设为null
    await prisma.link.updateMany({
      where: {
        categoryId: id
      },
      data: {
        categoryId: null
      }
    })

    return NextResponse.json({
      message: '分类删除成功'
    })

  } catch (error) {
    console.error('删除分类错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 