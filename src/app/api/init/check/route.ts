import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 检查是否存在管理员用户
export async function GET() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    return NextResponse.json({
      hasAdmin: !!adminUser,
      needsInitialization: !adminUser
    })
  } catch (error) {
    console.error('检查管理员用户失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 