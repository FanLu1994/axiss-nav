import { PrismaClient } from '@prisma/client'
import { getFaviconAsBase64 } from '../src/lib/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据...')

  // 检查是否存在管理员用户
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('❌ 未找到管理员用户！')
    console.log('请先启动应用并访问网站创建管理员账户。')
    console.log('首次访问时，系统会自动引导您创建管理员账户。')
    return
  }

  console.log(`✅ 找到管理员用户: ${adminUser.username}`)

  // 清理现有的链接和标签数据，但保留用户数据
  await prisma.link.deleteMany()
  await prisma.tag.deleteMany()

  // 为管理员用户创建标签
  const socialTag = await prisma.tag.create({
    data: {
      name: '社交媒体',
      description: '社交网络和聊天工具',
      icon: '💬',
      color: '#3B82F6',
      order: 1,
      userId: adminUser.id,
    },
  })

  const devTag = await prisma.tag.create({
    data: {
      name: '开发工具',
      description: '编程和开发相关的工具',
      icon: '⚡',
      color: '#10B981',
      order: 2,
      userId: adminUser.id,
    },
  })

  const newsTag = await prisma.tag.create({
    data: {
      name: '新闻资讯',
      description: '新闻和信息网站',
      icon: '📰',
      color: '#F59E0B',
      order: 3,
      userId: adminUser.id,
    },
  })

  const entertainmentTag = await prisma.tag.create({
    data: {
      name: '娱乐视频',
      description: '视频和娱乐网站',
      icon: '🎬',
      color: '#EF4444',
      order: 4,
      userId: adminUser.id,
    },
  })

  const toolsTag = await prisma.tag.create({
    data: {
      name: '实用工具',
      description: '日常使用的在线工具',
      icon: '🔧',
      color: '#8B5CF6',
      order: 5,
      userId: adminUser.id,
    },
  })

  console.log('✅ 标签创建完成')

  // 定义链接数据（不包含icon，稍后获取）
  const linksData = [
    // 社交媒体
    {
      title: '微信网页版',
      url: 'https://wx.qq.com/',
      description: '微信网页版，随时随地聊天',
      order: 1,
      userId: adminUser.id,
      tagIds: [socialTag.id],
    },
    {
      title: 'QQ空间',
      url: 'https://qzone.qq.com/',
      description: '记录生活点滴',
      order: 2,
      userId: adminUser.id,
      tagIds: [socialTag.id],
    },
    {
      title: '微博',
      url: 'https://weibo.com/',
      description: '热点话题，实时关注',
      order: 3,
      userId: adminUser.id,
      tagIds: [socialTag.id],
    },
    
    // 开发工具
    {
      title: 'GitHub',
      url: 'https://github.com/',
      description: '全球最大的代码托管平台',
      order: 4,
      userId: adminUser.id,
      tagIds: [devTag.id],
    },
    {
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com/',
      description: '程序员问答社区',
      order: 5,
      userId: adminUser.id,
      tagIds: [devTag.id],
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/',
      description: 'Web 开发技术文档',
      order: 6,
      userId: adminUser.id,
      tagIds: [devTag.id],
    },
    
    // 新闻资讯
    {
      title: '网易新闻',
      url: 'https://news.163.com/',
      description: '网易新闻中心',
      order: 7,
      userId: adminUser.id,
      tagIds: [newsTag.id],
    },
    {
      title: '腾讯新闻',
      url: 'https://news.qq.com/',
      description: '腾讯新闻资讯',
      order: 8,
      userId: adminUser.id,
      tagIds: [newsTag.id],
    },
    
    // 娱乐视频
    {
      title: '哔哩哔哩',
      url: 'https://www.bilibili.com/',
      description: '年轻人的视频社区',
      order: 9,
      userId: adminUser.id,
      tagIds: [entertainmentTag.id],
    },
    {
      title: '优酷',
      url: 'https://www.youku.com/',
      description: '优酷视频',
      order: 10,
      userId: adminUser.id,
      tagIds: [entertainmentTag.id],
    },
    
    // 实用工具
    {
      title: '百度翻译',
      url: 'https://fanyi.baidu.com/',
      description: '在线翻译工具',
      order: 11,
      userId: adminUser.id,
      tagIds: [toolsTag.id],
    },
    {
      title: '草料二维码',
      url: 'https://cli.im/',
      description: '二维码生成工具',
      order: 12,
      userId: adminUser.id,
      tagIds: [toolsTag.id],
    },
  ]

  // 创建链接并获取真实favicon
  console.log('🔄 开始获取网站图标并创建链接...')
  
  for (const linkData of linksData) {
    const { tagIds, ...linkInfo } = linkData
    
    console.log(`正在获取 ${linkInfo.title} 的favicon...`)
    const favicon = await getFaviconAsBase64(linkInfo.url)
    
    await prisma.link.create({
      data: {
        ...linkInfo,
        icon: favicon, // 使用获取到的favicon，如果获取失败则使用默认图标
        tags: {
          connect: tagIds.map((id: string) => ({ id })),
        },
      },
    })
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('✅ 链接创建完成')
  console.log('🎉 种子数据创建完成！')
  console.log(`📊 管理员用户: ${adminUser.username}`)
  console.log(`📊 创建了 ${await prisma.tag.count()} 个标签`)
  console.log(`📊 创建了 ${await prisma.link.count()} 个链接`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 