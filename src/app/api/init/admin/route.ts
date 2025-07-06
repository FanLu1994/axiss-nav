import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/utils'

// 初始化管理员账户
export async function POST(request: NextRequest) {
  try {
    // 首先检查是否已经存在管理员用户
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({ error: '管理员账户已存在' }, { status: 400 })
    }

    const { username, email, password } = await request.json()
    
    // 验证输入
    if (!username || !email || !password) {
      return NextResponse.json({ error: '用户名、邮箱和密码都是必填项' }, { status: 400 })
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 })
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 })
    }
    
    // 检查用户名和邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: '用户名或邮箱已存在' }, { status: 400 })
    }

    // 创建管理员账户
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // 生成JWT令牌
    const token = generateToken({
      userId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    })

    // 返回成功信息（不返回密码）
    return NextResponse.json({
      message: '管理员账户创建成功',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt
      },
      token
    })
  } catch (error) {
    console.error('创建管理员账户失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 