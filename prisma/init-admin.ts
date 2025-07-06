import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
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

async function main() {
  console.log('🔑 初始化管理员账户')
  console.log('=====================================')
  
  // 检查是否已有管理员用户
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (existingAdmin) {
    console.log('⚠️  已存在管理员账户:')
    console.log(`   用户名: ${existingAdmin.username}`)
    console.log(`   邮箱: ${existingAdmin.email}`)
    console.log('   如需重置，请手动删除数据库中的用户数据')
    return
  }

  // 获取用户输入
  const username = await question('请输入管理员用户名 (默认: admin): ') || 'admin'
  const email = await question('请输入管理员邮箱 (默认: admin@example.com): ') || 'admin@example.com'
  
  let password = ''
  while (!password) {
    password = await question('请输入管理员密码 (不少于6位): ')
    if (password.length < 6) {
      console.log('❌ 密码长度不能少于6位，请重新输入')
      password = ''
    }
  }
  
  // 确认信息
  console.log('\n📋 确认信息:')
  console.log(`   用户名: ${username}`)
  console.log(`   邮箱: ${email}`)
  console.log(`   密码: ${'*'.repeat(password.length)}`)
  
  const confirm = await question('\n确认创建管理员账户？(y/N): ')
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ 取消创建')
    return
  }

  try {
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
      console.log('❌ 用户名或邮箱已存在')
      return
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

    console.log('✅ 管理员账户创建成功！')
    console.log(`   用户ID: ${adminUser.id}`)
    console.log(`   用户名: ${adminUser.username}`)
    console.log(`   邮箱: ${adminUser.email}`)
    console.log(`   创建时间: ${adminUser.createdAt}`)
    console.log('\n🎉 您现在可以使用该账户登录管理您的个人导航网站了！')
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    rl.close()
    await prisma.$disconnect()
  }) 