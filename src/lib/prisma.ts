import { PrismaClient } from '@prisma/client'

// 全局变量声明
declare global {
  var prisma: PrismaClient | undefined
}

// 创建优化的Prisma客户端
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// 使用单例模式避免在开发模式下创建多个客户端
const prisma = globalThis.prisma || createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma
}

// 监控查询性能
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const start = Date.now()
    const result = await next(params)
    const end = Date.now()
    
    // 如果查询时间超过1秒，记录慢查询
    if (end - start > 1000) {
      console.warn(`🐌 慢查询检测: ${params.model}.${params.action} 耗时 ${end - start}ms`)
      console.warn('查询参数:', JSON.stringify(params.args, null, 2))
    }
    
    return result
  })
}

export { prisma } 