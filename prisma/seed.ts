import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据...')

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  // 创建测试用户
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'user',
      password: userPassword,
      role: 'USER'
    }
  })

  // 创建示例链接
  const links = [
    {
      title: 'GitHub',
      url: 'https://github.com',
      description: '全球最大的代码托管平台',
      icon: 'https://github.com/favicon.ico',
      tags: JSON.stringify(['开发', '代码', '开源']),
      category: '开发',
      color: '#24292e',
      order: 1,
      isActive: true,
      clickCount: 0
    },
    {
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      description: '程序员问答社区',
      icon: 'https://stackoverflow.com/favicon.ico',
      tags: JSON.stringify(['问答', '编程', '技术']),
      category: '技术',
      color: '#f48024',
      order: 2,
      isActive: true,
      clickCount: 0
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Web开发文档',
      icon: 'https://developer.mozilla.org/favicon.ico',
      tags: JSON.stringify(['文档', 'Web', '开发']),
      category: '开发',
      color: '#000000',
      order: 3,
      isActive: true,
      clickCount: 0
    },
    {
      title: 'React',
      url: 'https://react.dev',
      description: 'React官方文档',
      icon: 'https://react.dev/favicon.ico',
      tags: JSON.stringify(['React', '前端', '框架']),
      category: '前端',
      color: '#61dafb',
      order: 4,
      isActive: true,
      clickCount: 0
    },
    {
      title: 'Vue.js',
      url: 'https://vuejs.org',
      description: 'Vue.js官方文档',
      icon: 'https://vuejs.org/favicon.ico',
      tags: JSON.stringify(['Vue', '前端', '框架']),
      category: '前端',
      color: '#42b883',
      order: 5,
      isActive: true,
      clickCount: 0
    }
  ]

  for (const linkData of links) {
    await prisma.link.upsert({
      where: { url: linkData.url },
      update: {},
      create: linkData
    })
  }

  console.log('种子数据创建完成！')
  console.log(`管理员用户: ${admin.email}`)
  console.log(`测试用户: ${user.email}`)
  console.log(`示例链接: ${links.length} 个`)
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 