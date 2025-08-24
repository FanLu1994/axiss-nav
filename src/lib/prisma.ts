import { PrismaClient } from '@prisma/client'

// 全局变量声明
declare global {
  var prisma: PrismaClient | undefined
}

// 创建优化的Prisma客户端
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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



export { prisma }
