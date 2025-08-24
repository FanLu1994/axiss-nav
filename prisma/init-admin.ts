import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

// 创建命令行接口
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

async function initAdmin() {
  try {
    console.log('🔧 初始化管理员账户')
    console.log('====================')

    // 检查是否已存在管理员
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ 管理员账户已存在')
      console.log(`   用户名: ${existingAdmin.username}`)
      console.log(`   邮箱: ${existingAdmin.email}`)
      return
    }

    console.log('📝 请填写管理员信息:')

    const username = await question('用户名: ')
    if (!username) {
      console.log('❌ 用户名不能为空')
      return
    }

    const email = await question('邮箱: ')
    if (!email) {
      console.log('❌ 邮箱不能为空')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ 邮箱格式不正确')
      return
    }

    const password = await question('密码: ')
    if (!password) {
      console.log('❌ 密码不能为空')
      return
    }

    if (password.length < 6) {
      console.log('❌ 密码长度至少6位')
      return
    }

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
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ 管理员账户创建成功！')
    console.log(`   用户名: ${admin.username}`)
    console.log(`   邮箱: ${admin.email}`)
    console.log(`   角色: ${admin.role}`)

  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

initAdmin() 