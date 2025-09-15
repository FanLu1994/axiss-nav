import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// 配置
const config = {
  githubRepo: process.env.GITHUB_BACKUP_REPO,
  githubToken: process.env.GITHUB_TOKEN,
  backupDir: '/tmp/backups',
  branch: process.env.BACKUP_BRANCH || 'backup'
}

export async function GET() {
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

    const [owner, repo] = config.githubRepo.split('/')
    const fileName = `bookmarks-${dateStr}.md`
    const fileContent = fs.readFileSync(mdFile, 'utf8')

    // 使用 GitHub REST API 上传文件
    const uploadFile = async (path, content, message) => {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content, 'utf8').toString('base64'),
          branch: config.branch
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`GitHub API 错误: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return response.json()
    }

    // 检查分支是否存在，如果不存在则创建
    try {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${config.branch}`, {
        headers: {
          'Authorization': `Bearer ${config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      })
    } catch {
      // 分支不存在，需要创建
      console.log(`创建分支 ${config.branch}...`)
      
      // 获取主分支的 SHA
      const mainBranchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/main`, {
        headers: {
          'Authorization': `Bearer ${config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      })
      
      if (!mainBranchResponse.ok) {
        // 尝试 master 分支
        const masterBranchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/master`, {
          headers: {
            'Authorization': `Bearer ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        })
        
        if (!masterBranchResponse.ok) {
          throw new Error('无法找到主分支 (main 或 master)')
        }
        
        const masterData = await masterBranchResponse.json()
        const masterSha = masterData.commit.sha
        
        // 创建新分支
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${config.branch}`,
            sha: masterSha
          })
        })
      } else {
        const mainData = await mainBranchResponse.json()
        const mainSha = mainData.commit.sha
        
        // 创建新分支
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${config.branch}`,
            sha: mainSha
          })
        })
      }
    }

    // 上传备份文件
    console.log(`上传文件: ${fileName}`)
    await uploadFile(fileName, fileContent, `自动备份: ${dateStr}`)

    // 获取现有文件列表来更新 README
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents?ref=${config.branch}`, {
      headers: {
        'Authorization': `Bearer ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    })

    let existingFiles = []
    if (filesResponse.ok) {
      const files = await filesResponse.json()
      existingFiles = files
        .filter(file => file.name.startsWith('bookmarks-') && file.name.endsWith('.md'))
        .map(file => file.name)
        .sort()
        .reverse()
    }

    // 创建或更新 README 文件
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

${existingFiles.map(file => `- [${file}](./${file})`).join('\n')}
`

    console.log('更新 README 文件...')
    await uploadFile('README.md', readmeContent, `更新 README: ${dateStr}`)

    console.log('GitHub同步完成!')

  } catch (error) {
    console.error('GitHub同步失败:', error.message)
    throw error
  }
}
