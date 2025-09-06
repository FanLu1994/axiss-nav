#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importLinks(options) {
  try {
    console.log('开始导入链接...')

    // 检查文件是否存在
    if (!fs.existsSync(options.file)) {
      console.error(`文件不存在: ${options.file}`)
      process.exit(1)
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(options.file, 'utf8')
    console.log(`读取文件: ${options.file}`)

    let links = []

    // 根据文件扩展名或指定格式解析文件
    const fileExt = path.extname(options.file).toLowerCase()
    const format = options.format || (fileExt === '.md' ? 'markdown' : 'json')

    try {
      if (format === 'json') {
        const data = JSON.parse(fileContent)
        links = data.links || data // 支持直接数组或包含links字段的对象
      } else if (format === 'markdown') {
        links = parseMarkdown(fileContent)
      } else {
        console.error('不支持的文件格式')
        process.exit(1)
      }
    } catch (error) {
      console.error('文件格式错误:', error)
      process.exit(1)
    }

    if (!Array.isArray(links) || links.length === 0) {
      console.log('文件中没有找到有效的链接数据')
      return
    }

    console.log(`找到 ${links.length} 个链接`)

    // 验证和清理数据
    const validLinks = []
    const errors = []

    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const error = validateLink(link, i + 1)
      
      if (error) {
        errors.push(error)
        continue
      }

      // 检查URL是否已存在
      if (!options.skipDuplicates) {
        const existingLink = await prisma.link.findUnique({
          where: { url: link.url }
        })

        if (existingLink) {
          errors.push(`第${i + 1}行: URL "${link.url}" 已存在`)
          continue
        }
      }

      validLinks.push(cleanLink(link))
    }

    console.log(`有效链接: ${validLinks.length} 个`)
    if (errors.length > 0) {
      console.log(`错误: ${errors.length} 个`)
      errors.forEach(error => console.log(`  - ${error}`))
    }

    if (options.dryRun) {
      console.log('\n[试运行模式] 不会实际导入数据')
      console.log('将要导入的链接:')
      validLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.title} - ${link.url}`)
      })
      return
    }

    // 批量插入有效链接
    if (validLinks.length > 0) {
      try {
        await prisma.link.createMany({
          data: validLinks,
          skipDuplicates: true
        })
        console.log(`\n导入完成! 成功导入 ${validLinks.length} 个链接`)
      } catch (error) {
        console.error('导入过程中发生错误:', error)
        process.exit(1)
      }
    } else {
      console.log('没有可导入的链接')
    }

  } catch (error) {
    console.error('导入失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 验证链接数据
function validateLink(link, index) {
  if (!link || typeof link !== 'object') {
    return `第${index}行: 数据格式错误`
  }

  if (!link.title || typeof link.title !== 'string' || !link.title.trim()) {
    return `第${index}行: 标题不能为空`
  }

  if (!link.url || typeof link.url !== 'string' || !link.url.trim()) {
    return `第${index}行: URL不能为空`
  }

  // 验证URL格式
  try {
    new URL(link.url)
  } catch {
    return `第${index}行: URL格式不正确`
  }

  return null
}

// 清理链接数据
function cleanLink(link) {
  return {
    title: link.title.trim(),
    url: link.url.trim(),
    description: link.description?.trim() || null,
    icon: link.icon?.trim() || null,
    order: typeof link.order === 'number' ? link.order : 0,
    tags: link.tags ? JSON.stringify(Array.isArray(link.tags) ? link.tags : [link.tags]) : JSON.stringify(['导入']),
    category: link.category?.trim() || null,
    color: link.color?.trim() || null,
    isActive: true,
    clickCount: 0
  }
}

// 解析Markdown格式的链接
function parseMarkdown(content) {
  const links = []
  const lines = content.split('\n')
  
  let inTable = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测表格开始 (| 标题 | 链接 | ...)
    if (line.startsWith('| 标题 |')) {
      inTable = true
      continue
    }
    
    // 检测表格分隔线 (|---|---|...)
    if (line.match(/^\|[\s\-\|]+\|$/)) {
      continue
    }
    
    // 解析表格行
    if (inTable && line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
      
      if (cells.length >= 7) {
        // 解析标题和链接 [标题](URL)
        const titleLinkMatch = cells[0].match(/\[([^\]]+)\]\(([^)]+)\)/)
        if (titleLinkMatch) {
          const link = {
            title: titleLinkMatch[1],
            url: cells[1], // 第二列是纯URL
            description: cells[2] || '',
            category: cells[3] || '导入',
            tags: cells[4] ? cells[4].split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            createdAt: cells[5] || '',
            clickCount: parseInt(cells[6]) || 0
          }
          links.push(link)
        }
      }
      continue
    }
    
    // 如果不是表格格式，尝试解析旧的格式
    const linkMatch = line.match(/^###\s*\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      const link = {
        title: linkMatch[1],
        url: linkMatch[2],
        description: '',
        tags: [],
        category: '导入'
      }
      links.push(link)
      continue
    }
  }
  
  return links
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    file: ''
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--file':
      case '-f':
        options.file = args[++i]
        break
      
      case '--format':
        const format = args[++i]
        if (format === 'json' || format === 'markdown') {
          options.format = format
        } else {
          console.error('格式必须是 json 或 markdown')
          process.exit(1)
        }
        break
      
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      
      case '--skip-duplicates':
      case '-s':
        options.skipDuplicates = true
        break
      
      case '--help':
      case '-h':
        console.log(`
用法: node scripts/import-links.js --file <文件路径> [选项]

选项:
  -f, --file <path>        要导入的文件路径 (必需)
  --format <format>        文件格式 (json|markdown) [自动检测]
  -d, --dry-run           试运行模式，不实际导入数据
  -s, --skip-duplicates   跳过重复的URL
  -h, --help              显示帮助信息

示例:
  node scripts/import-links.js --file ./bookmarks.json
  node scripts/import-links.js --file ./bookmarks.md --format markdown
  node scripts/import-links.js --file ./bookmarks.json --dry-run
  node scripts/import-links.js --file ./bookmarks.json --skip-duplicates
        `)
        process.exit(0)
        break
      
      default:
        if (!options.file && !arg.startsWith('-')) {
          options.file = arg
        } else {
          console.error(`未知参数: ${arg}`)
          console.log('使用 --help 查看帮助信息')
          process.exit(1)
        }
    }
  }

  if (!options.file) {
    console.error('请指定要导入的文件路径')
    console.log('使用 --help 查看帮助信息')
    process.exit(1)
  }

  return options
}

// 主函数
async function main() {
  const options = parseArgs()
  await importLinks(options)
}

if (require.main === module) {
  main()
}
