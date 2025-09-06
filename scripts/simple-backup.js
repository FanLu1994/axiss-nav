#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// 配置
const config = {
  backupDir: process.env.BACKUP_DIR || './backups'
}

async function simpleBackup() {
  try {
    console.log('开始简单备份...')
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`)

    // 创建备份目录
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true })
    }

    // 获取所有链接数据
    const links = await prisma.link.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        clickCount: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        category: true,
        color: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`找到 ${links.length} 个链接`)

    // 处理tags字段
    const processedLinks = links.map(link => ({
      ...link,
      tags: link.tags ? JSON.parse(link.tags) : []
    }))

    // 生成备份数据
    const backupData = {
      version: '1.0',
      backupDate: new Date().toISOString(),
      totalLinks: processedLinks.length,
      links: processedLinks
    }

    // 生成Markdown格式
    const markdown = generateMarkdown(processedLinks)

    // 生成文件名
    const dateStr = new Date().toISOString().split('T')[0]
    const jsonFile = path.join(config.backupDir, `bookmarks-${dateStr}.json`)
    const mdFile = path.join(config.backupDir, `bookmarks-${dateStr}.md`)

    // 写入文件
    fs.writeFileSync(jsonFile, JSON.stringify(backupData, null, 2), 'utf8')
    fs.writeFileSync(mdFile, markdown, 'utf8')

    console.log(`备份文件已生成:`)
    console.log(`  JSON: ${jsonFile}`)
    console.log(`  Markdown: ${mdFile}`)
    console.log(`链接数量: ${processedLinks.length}`)
    console.log('简单备份完成!')

  } catch (error) {
    console.error('简单备份失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function generateMarkdown(links) {
  let markdown = `# 收藏夹备份\n\n`
  markdown += `备份时间: ${new Date().toLocaleString('zh-CN')}\n`
  markdown += `总计链接: ${links.length} 个\n\n`

  // 生成单个表格
  markdown += `| 标题 | 链接 | 描述 | 分类 | 标签 | 添加时间 | 点击次数 |\n`
  markdown += `|------|------|------|------|------|----------|----------|\n`
  
  links.forEach(link => {
    const title = link.title.replace(/\|/g, '\\|')
    const url = link.url
    const description = (link.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    const category = link.category || '未分类'
    const tags = (link.tags && link.tags.length > 0) ? link.tags.join(', ') : ''
    const createdAt = new Date(link.createdAt).toLocaleString('zh-CN')
    const clickCount = link.clickCount
    
    markdown += `| [${title}](${url}) | ${url} | ${description} | ${category} | ${tags} | ${createdAt} | ${clickCount} |\n`
  })

  return markdown
}

// 主函数
async function main() {
  await simpleBackup()
}

if (require.main === module) {
  main()
}
