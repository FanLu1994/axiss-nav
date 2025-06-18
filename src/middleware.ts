import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/utils'

// 需要身份验证的API路由
const protectedRoutes = [
  '/api/categories',
  '/api/links',
  '/api/users'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '缺少身份验证令牌' },
        { status: 401 }
      )
    }

    const user = verifyToken(authHeader.replace('Bearer ', ''))
    if (!user) {
      return NextResponse.json(
        { error: '无效的身份验证令牌' },
        { status: 401 }
      )
    }

    // 将用户信息添加到请求头中
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 