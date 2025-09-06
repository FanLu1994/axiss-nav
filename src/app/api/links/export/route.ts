import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

interface LinkData {
  id: string
  title: string
  url: string
  description: string | null
  icon: string | null
  order: number
  clickCount: number
  createdAt: Date
  updatedAt: Date
  tags: string | null
  category: string | null
  color: string | null
}

interface ProcessedLink extends Omit<LinkData, 'tags'> {
  tags: string[]
}

// 导出链接数据
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined
    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json 或 markdown

    // 获取所有活跃的链接
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

    // 处理tags字段，将JSON字符串转换为数组
    const processedLinks = links.map(link => ({
      ...link,
      tags: link.tags ? JSON.parse(link.tags) : []
    }))

    if (format === 'markdown') {
      // 生成Markdown格式
      const markdown = generateMarkdown(processedLinks)
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="bookmarks-${new Date().toISOString().split('T')[0]}.md"`
        }
      })
    } else {
      // 生成JSON格式
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalLinks: processedLinks.length,
        links: processedLinks
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="bookmarks-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }
  } catch (error) {
    console.error('导出链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 生成Markdown格式的导出内容
function generateMarkdown(links: ProcessedLink[]): string {
  let markdown = `# 收藏夹导出\n\n`
  markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  markdown += `总计链接: ${links.length} 个\n\n`

  // 按分类分组
  const categories = new Map<string, ProcessedLink[]>()
  
  links.forEach(link => {
    const category = link.category || '未分类'
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(link)
  })

  // 生成分类内容
  for (const [category, categoryLinks] of categories) {
    markdown += `## ${category}\n\n`
    
    categoryLinks.forEach(link => {
      markdown += `### [${link.title}](${link.url})\n\n`
      
      if (link.description) {
        markdown += `${link.description}\n\n`
      }
      
      if (link.tags && link.tags.length > 0) {
        markdown += `**标签:** ${link.tags.join(', ')}\n\n`
      }
      
      markdown += `- 添加时间: ${new Date(link.createdAt).toLocaleString('zh-CN')}\n`
      markdown += `- 点击次数: ${link.clickCount}\n\n`
      markdown += `---\n\n`
    })
  }

  return markdown
}
