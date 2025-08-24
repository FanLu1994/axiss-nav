import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('开始清理数据库...')
    
    // 删除所有链接
    const deletedLinks = await prisma.link.deleteMany()
    console.log(`删除了 ${deletedLinks.count} 个链接`)
    
    // 删除所有用户（除了管理员）
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    })
    console.log(`删除了 ${deletedUsers.count} 个普通用户`)
    
    console.log('数据库清理完成！')
    console.log('注意：管理员用户已保留')
    
  } catch (error) {
    console.error('清理数据库失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase() 