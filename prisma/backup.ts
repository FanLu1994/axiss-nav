import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backupData() {
  try {
    console.log('开始备份数据...')
    
    // 创建备份目录
    const backupDir = path.join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
    
    // 备份用户数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // 备份链接数据
    const links = await prisma.link.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        clickCount: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        category: true,
        color: true
      }
    })
    
    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      links,
      totalUsers: users.length,
      totalLinks: links.length
    }
    
    // 写入备份文件
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    
    console.log(`备份完成: ${backupFile}`)
    console.log(`用户数量: ${users.length}`)
    console.log(`链接数量: ${links.length}`)
    
  } catch (error) {
    console.error('备份失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backupData() 