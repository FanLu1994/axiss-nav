import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// 配置
const config = {
  githubRepo: process.env.GITHUB_BACKUP_REPO,
  githubToken: process.env.GITHUB_TOKEN,
  backupDir: './backups',
  branch: process.env.BACKUP_BRANCH || 'backup'
}

export async function GET(request) {
  try {
    console.log('开始定时备份任务...')
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`)

    // 检查配置
    if (!config.githubRepo || !config.githubToken) {
      return NextResponse.json({ 
        error: '缺少GitHub配置: GITHUB_BACKUP_REPO 或 GITHUB_TOKEN' 
      }, { status: 500 })
    }

    // 验证Fine-grained Token格式
    if (!config.githubToken.startsWith('github_pat_')) {
      return NextResponse.json({ 
        error: '请使用GitHub Fine-grained Personal Access Token (以 github_pat_ 开头)' 
      }, { status: 500 })
    }

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

    // 生成Markdown格式
    const markdown = generateMarkdown(processedLinks)

    // 生成文件名
    const dateStr = new Date().toISOString().split('T')[0]
    const mdFile = path.join(config.backupDir, `bookmarks-${dateStr}.md`)

    // 写入文件
    fs.writeFileSync(mdFile, markdown, 'utf8')

    console.log(`备份文件已生成: ${mdFile}`)

    // 同步到GitHub
    await syncToGitHub(mdFile, dateStr, processedLinks.length)

    return NextResponse.json({
      success: true,
      message: '自动备份完成',
      backupDate: new Date().toISOString(),
      totalLinks: processedLinks.length,
      files: {
        markdown: `bookmarks-${dateStr}.md`
      }
    })

  } catch (error) {
    console.error('定时备份失败:', error)
    return NextResponse.json({ 
      error: '备份失败', 
      details: error.message 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

function generateMarkdown(links) {
  let markdown = `# 收藏夹自动备份\n\n`
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

async function syncToGitHub(mdFile, dateStr, totalLinks) {
  try {
    console.log('开始同步到GitHub...')

    // Fine-grained Token 格式
    const repoUrl = `https://x-access-token:${config.githubToken}@github.com/${config.githubRepo}.git`
    const tempDir = path.join(process.cwd(), 'temp-repo')

    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }

    // 克隆仓库
    console.log('克隆GitHub仓库...')
    execSync(`git clone -b ${config.branch} ${repoUrl} ${tempDir}`, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      shell: true
    })

    // 如果分支不存在，创建新分支
    try {
      execSync(`git checkout -b ${config.branch}`, { 
        stdio: 'pipe',
        cwd: tempDir,
        shell: true
      })
    } catch (error) {
      // 分支已存在，切换到该分支
      execSync(`git checkout ${config.branch}`, { 
        stdio: 'pipe',
        cwd: tempDir,
        shell: true
      })
    }

    // 复制备份文件
    const destMdFile = path.join(tempDir, `bookmarks-${dateStr}.md`)
    
    fs.copyFileSync(mdFile, destMdFile)

    // 创建README文件
    const readmeContent = `# 书签自动备份

这是由 Axiss Nav 自动生成的书签备份仓库。

## 备份说明

- 每天 0:00 自动备份
- 包含 Markdown 格式
- 文件命名格式: \`bookmarks-YYYY-MM-DD.md\`

## 最新备份

最新备份时间: ${new Date().toLocaleString('zh-CN')}
总链接数: ${totalLinks} 个

## 文件列表

${fs.readdirSync(tempDir)
  .filter(file => file.startsWith('bookmarks-') && file.endsWith('.md'))
  .sort()
  .reverse()
  .map(file => `- [${file}](./${file})`)
  .join('\n')}
`

    fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent, 'utf8')

    // 提交更改
    execSync('git add .', { cwd: tempDir, shell: true })
    execSync(`git commit -m "自动备份: ${dateStr}"`, { cwd: tempDir, shell: true })
    execSync(`git push origin ${config.branch}`, { cwd: tempDir, shell: true })

    console.log('GitHub同步完成!')

    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })

  } catch (error) {
    console.error('GitHub同步失败:', error.message)
    throw error
  }
}
