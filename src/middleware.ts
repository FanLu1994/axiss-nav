import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 暂时禁用中间件认证，让各个API路由自己处理认证
// 这避免了Edge Runtime不支持crypto模块的问题

export function middleware(request: NextRequest) {
  // 简单地让所有请求通过，认证交给各个API路由处理
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 