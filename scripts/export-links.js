#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportLinks(options) {
  try {
    console.log('开始导出链接...')

    // 构建查询条件
    const whereCondition = { isActive: true }
    if (options.category) {
      whereCondition.category = options.category
    }

    // 获取链接数据
    const links = await prisma.link.findMany({
      where: whereCondition,
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

    if (links.length === 0) {
      console.log('没有找到要导出的链接')
      return
    }

    // 处理tags字段
    const processedLinks = links.map(link => ({
      ...link,
      tags: link.tags ? JSON.parse(link.tags) : []
    }))

    let content
    let filename

    if (options.format === 'markdown') {
      content = generateMarkdown(processedLinks)
      filename = options.output || `bookmarks-${new Date().toISOString().split('T')[0]}.md`
    } else {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalLinks: processedLinks.length,
        links: processedLinks
      }
      content = JSON.stringify(exportData, null, 2)
      filename = options.output || `bookmarks-${new Date().toISOString().split('T')[0]}.json`
    }

    // 确保输出目录存在
    const outputPath = path.resolve(filename)
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf8')
    
    console.log(`导出完成: ${outputPath}`)
    console.log(`格式: ${options.format.toUpperCase()}`)
    console.log(`链接数量: ${processedLinks.length}`)

  } catch (error) {
    console.error('导出失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function generateMarkdown(links) {
  let markdown = `# 收藏夹导出\n\n`
  markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  markdown += `总计链接: ${links.length} 个\n\n`

  // 生成单个表格
  markdown += `| 标题 | 链接 | 描述 | 分类 | 标签 | 添加时间 | 点击次数 |\n`
  markdown += `|------|------|------|------|------|----------|----------|\n`
  
  links.forEach(link => {
    const title = link.title.replace(/\|/g, '\\|') // 转义表格分隔符
    const url = link.url
    const description = (link.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ') // 转义并替换换行符
    const category = link.category || '未分类'
    const tags = (link.tags && link.tags.length > 0) ? link.tags.join(', ') : ''
    const createdAt = new Date(link.createdAt).toLocaleString('zh-CN')
    const clickCount = link.clickCount
    
    markdown += `| [${title}](${url}) | ${url} | ${description} | ${category} | ${tags} | ${createdAt} | ${clickCount} |\n`
  })

  return markdown
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    format: 'json'
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--format':
      case '-f':
        const format = args[++i]
        if (format === 'json' || format === 'markdown') {
          options.format = format
        } else {
          console.error('格式必须是 json 或 markdown')
          process.exit(1)
        }
        break
      
      case '--output':
      case '-o':
        options.output = args[++i]
        break
      
      case '--category':
      case '-c':
        options.category = args[++i]
        break
      
      case '--help':
      case '-h':
        console.log(`
用法: node scripts/export-links.js [选项]

选项:
  -f, --format <format>    导出格式 (json|markdown) [默认: json]
  -o, --output <file>      输出文件路径
  -c, --category <name>    只导出指定分类的链接
  -h, --help              显示帮助信息

示例:
  node scripts/export-links.js
  node scripts/export-links.js --format markdown
  node scripts/export-links.js --format json --output ./backup/bookmarks.json
  node scripts/export-links.js --category "开发工具" --format markdown
        `)
        process.exit(0)
        break
      
      default:
        console.error(`未知参数: ${arg}`)
        console.log('使用 --help 查看帮助信息')
        process.exit(1)
    }
  }

  return options
}

// 主函数
async function main() {
  const options = parseArgs()
  await exportLinks(options)
}

if (require.main === module) {
  main()
}
