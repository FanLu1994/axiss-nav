import { PrismaClient, Role } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

const prisma = new PrismaClient()

// 创建readline接口用于交互式输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim())
    })
  })
}

// 备份数据结构
interface BackupUser {
  id: string
  username: string
  email: string
  password: string
  role: string
  createdAt: Date
  updatedAt: Date
}

interface BackupTag {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  order: number
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface BackupLink {
  id: string
  title: string
  url: string
  description: string | null
  icon: string | null
  order: number
  isActive: boolean
  clickCount: number
  userId: string
  createdAt: Date
  updatedAt: Date
  tags: Array<{ id: string }>
}

interface BackupData {
  version: string
  timestamp: string
  users: BackupUser[]
  tags: BackupTag[]
  links: BackupLink[]
}

// 导出数据
async function exportData() {
  try {
    console.log('🔄 正在导出数据...')
    
    // 获取所有数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        order: true,
        isActive: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    const links = await prisma.link.findMany({
      include: {
        tags: {
          select: {
            id: true
          }
        }
      }
    })
    
    // 创建备份数据
    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      users,
      tags,
      links
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `backup_${timestamp}.json`
    const filepath = path.join(process.cwd(), 'backups', filename)
    
    // 确保备份目录存在
    const backupDir = path.dirname(filepath)
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // 写入备份文件
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8')
    
    console.log('✅ 数据导出成功！')
    console.log(`📁 备份文件: ${filepath}`)
    console.log(`📊 导出统计:`)
    console.log(`   - 用户: ${users.length} 个`)
    console.log(`   - 标签: ${tags.length} 个`)
    console.log(`   - 链接: ${links.length} 个`)
    console.log(`   - 文件大小: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`)
    
  } catch (error) {
    console.error('❌ 导出数据失败:', error)
    throw error
  }
}

// 导入数据
async function importData() {
  try {
    // 列出可用的备份文件
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      console.log('❌ 备份目录不存在，请先创建备份')
      return
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
    
    if (files.length === 0) {
      console.log('❌ 没有找到备份文件')
      return
    }
    
    console.log('📁 可用的备份文件:')
    files.forEach((file, index) => {
      const filepath = path.join(backupDir, file)
      const stats = fs.statSync(filepath)
      console.log(`   ${index + 1}. ${file} (${stats.mtime.toLocaleString()})`)
    })
    
    const fileIndex = await question('\n请选择要导入的备份文件编号: ')
    const selectedIndex = parseInt(fileIndex) - 1
    
    if (selectedIndex < 0 || selectedIndex >= files.length) {
      console.log('❌ 无效的文件编号')
      return
    }
    
    const selectedFile = files[selectedIndex]
    const filepath = path.join(backupDir, selectedFile)
    
    // 读取备份文件
    console.log(`🔄 正在读取备份文件: ${selectedFile}`)
    const backupContent = fs.readFileSync(filepath, 'utf8')
    const backupData: BackupData = JSON.parse(backupContent)
    
    console.log('📋 备份信息:')
    console.log(`   - 版本: ${backupData.version}`)
    console.log(`   - 时间: ${new Date(backupData.timestamp).toLocaleString()}`)
    console.log(`   - 用户: ${backupData.users.length} 个`)
    console.log(`   - 标签: ${backupData.tags.length} 个`)
    console.log(`   - 链接: ${backupData.links.length} 个`)
    
    // 确认导入
    const confirm = await question('\n⚠️  导入将覆盖现有数据，确认继续？(y/N): ')
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ 取消导入')
      return
    }
    
    // 清空现有数据
    console.log('🗑️  正在清空现有数据...')
    await prisma.link.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.user.deleteMany()
    
    // 导入用户数据
    console.log('👤 正在导入用户数据...')
    for (const user of backupData.users) {
              await prisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role as Role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        })
    }
    
    // 导入标签数据
    console.log('🏷️  正在导入标签数据...')
    for (const tag of backupData.tags) {
      await prisma.tag.create({
        data: {
          id: tag.id,
          name: tag.name,
          description: tag.description,
          icon: tag.icon,
          color: tag.color,
          order: tag.order,
          isActive: tag.isActive,
          userId: tag.userId,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt
        }
      })
    }
    
    // 导入链接数据
    console.log('🔗 正在导入链接数据...')
    for (const link of backupData.links) {
      await prisma.link.create({
        data: {
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description,
          icon: link.icon,
          order: link.order,
          isActive: link.isActive,
          clickCount: link.clickCount,
          userId: link.userId,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt,
                      tags: {
              connect: link.tags.map((tag: { id: string }) => ({ id: tag.id }))
            }
        }
      })
    }
    
    console.log('✅ 数据导入成功！')
    console.log(`📊 导入统计:`)
    console.log(`   - 用户: ${backupData.users.length} 个`)
    console.log(`   - 标签: ${backupData.tags.length} 个`)
    console.log(`   - 链接: ${backupData.links.length} 个`)
    
  } catch (error) {
    console.error('❌ 导入数据失败:', error)
    throw error
  }
}

// 列出备份文件
async function listBackups() {
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      console.log('📁 备份目录不存在')
      return
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
    
    if (files.length === 0) {
      console.log('📁 没有找到备份文件')
      return
    }
    
    console.log('📁 备份文件列表:')
    files.forEach((file, index) => {
      const filepath = path.join(backupDir, file)
      const stats = fs.statSync(filepath)
      const size = (stats.size / 1024).toFixed(2)
      console.log(`   ${index + 1}. ${file}`)
      console.log(`      时间: ${stats.mtime.toLocaleString()}`)
      console.log(`      大小: ${size} KB`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ 列出备份文件失败:', error)
    throw error
  }
}

// 主函数
async function main() {
  try {
    console.log('💾 数据备份工具')
    console.log('=====================================')
    console.log('1. 导出数据 (export)')
    console.log('2. 导入数据 (import)')
    console.log('3. 列出备份文件 (list)')
    console.log('4. 退出 (exit)')
    console.log('=====================================')
    
    const action = await question('请选择操作 (1-4): ')
    
    switch (action) {
      case '1':
      case 'export':
        await exportData()
        break
      case '2':
      case 'import':
        await importData()
        break
      case '3':
      case 'list':
        await listBackups()
        break
      case '4':
      case 'exit':
        console.log('👋 再见！')
        break
      default:
        console.log('❌ 无效的选择')
        break
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error)
    process.exit(1)
  }
}

// 支持命令行参数
const args = process.argv.slice(2)
if (args.length > 0) {
  const command = args[0]
  switch (command) {
    case 'export':
      exportData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
        .finally(() => {
          rl.close()
          prisma.$disconnect()
        })
      break
    case 'import':
      importData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
        .finally(() => {
          rl.close()
          prisma.$disconnect()
        })
      break
    case 'list':
      listBackups()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
        .finally(() => {
          rl.close()
          prisma.$disconnect()
        })
      break
    default:
      console.log('❌ 无效的命令，支持的命令: export, import, list')
      process.exit(1)
  }
} else {
  main()
    .finally(async () => {
      rl.close()
      await prisma.$disconnect()
    })
} 