import { PrismaClient } from '@prisma/client'
import readline from 'readline'

const prisma = new PrismaClient()

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function cleanDatabase() {
  console.log('🗑️  数据库清理工具')
  console.log('================')
  
  try {
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 获取当前数据统计
    const userCount = await prisma.user.count()
    const tagCount = await prisma.tag.count()
    const linkCount = await prisma.link.count()
    
    console.log('\n📊 当前数据统计:')
    console.log(`   用户数量: ${userCount}`)
    console.log(`   标签数量: ${tagCount}`)
    console.log(`   链接数量: ${linkCount}`)
    
    if (userCount === 0 && tagCount === 0 && linkCount === 0) {
      console.log('✨ 数据库已经是空的！')
      return
    }
    
    console.log('\n⚠️  清理选项:')
    console.log('1. 清除所有数据 (用户、标签、链接)')
    console.log('2. 仅清除链接和标签 (保留用户)')
    console.log('3. 仅清除链接 (保留用户和标签)')
    console.log('4. 取消操作')
    
    const choice = await question('\n请选择清理选项 (1-4): ')
    
    switch (choice) {
      case '1':
        await cleanAllData()
        break
      case '2':
        await cleanLinksAndTags()
        break
      case '3':
        await cleanLinksOnly()
        break
      case '4':
        console.log('❌ 操作已取消')
        return
      default:
        console.log('❌ 无效的选择')
        return
    }
    
  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

async function cleanAllData() {
  const confirm = await question('⚠️  确定要清除所有数据吗？这将删除所有用户、标签和链接！(y/N): ')
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ 操作已取消')
    return
  }
  
  console.log('🧹 开始清理所有数据...')
  
  try {
    // 按顺序删除数据（由于外键约束）
    console.log('  删除链接数据...')
    await prisma.link.deleteMany({})
    
    console.log('  删除标签数据...')
    await prisma.tag.deleteMany({})
    
    console.log('  删除用户数据...')
    await prisma.user.deleteMany({})
    
    console.log('✅ 所有数据清理完成！')
    
  } catch (error) {
    console.error('❌ 清理失败:', error)
  }
}

async function cleanLinksAndTags() {
  const confirm = await question('⚠️  确定要清除所有链接和标签吗？(y/N): ')
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ 操作已取消')
    return
  }
  
  console.log('🧹 开始清理链接和标签...')
  
  try {
    console.log('  删除链接数据...')
    await prisma.link.deleteMany({})
    
    console.log('  删除标签数据...')
    await prisma.tag.deleteMany({})
    
    console.log('✅ 链接和标签清理完成！')
    
  } catch (error) {
    console.error('❌ 清理失败:', error)
  }
}

async function cleanLinksOnly() {
  const confirm = await question('⚠️  确定要清除所有链接吗？(y/N): ')
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ 操作已取消')
    return
  }
  
  console.log('🧹 开始清理链接...')
  
  try {
    console.log('  删除链接数据...')
    await prisma.link.deleteMany({})
    
    console.log('✅ 链接清理完成！')
    
  } catch (error) {
    console.error('❌ 清理失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanDatabase()
} 