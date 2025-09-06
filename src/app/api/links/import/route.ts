import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/utils'

interface ImportLink {
  title: string
  url: string
  description?: string
  icon?: string
  order?: number
  tags?: string[]
  category?: string
  color?: string
  createdAt?: string
  clickCount?: number
}

// 导入链接数据
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined
    const user = getUserFromToken(authHeader)
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string || 'json'

    if (!file) {
      return NextResponse.json({ error: '请选择要导入的文件' }, { status: 400 })
    }

    const fileContent = await file.text()
    let links: ImportLink[] = []

    try {
      if (format === 'json') {
        const data = JSON.parse(fileContent)
        links = data.links || data // 支持直接数组或包含links字段的对象
      } else if (format === 'markdown') {
        links = parseMarkdown(fileContent)
      } else {
        return NextResponse.json({ error: '不支持的文件格式' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: '文件格式错误，请检查文件内容' }, { status: 400 })
    }

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json({ error: '文件中没有找到有效的链接数据' }, { status: 400 })
    }

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
      const existingLink = await prisma.link.findUnique({
        where: { url: link.url }
      })

      if (existingLink) {
        errors.push(`第${i + 1}行: URL "${link.url}" 已存在`)
        continue
      }

      validLinks.push(cleanLink(link))
    }

    // 批量插入有效链接
    let importedCount = 0
    if (validLinks.length > 0) {
      try {
        await prisma.link.createMany({
          data: validLinks,
          skipDuplicates: true
        })
        importedCount = validLinks.length
      } catch (error) {
        console.error('批量插入链接失败:', error)
        return NextResponse.json({ error: '导入过程中发生错误' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: '导入完成',
      total: links.length,
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('导入链接错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 验证链接数据
function validateLink(link: ImportLink, index: number): string | null {
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
function cleanLink(link: ImportLink) {
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
function parseMarkdown(content: string): ImportLink[] {
  const links: ImportLink[] = []
  const lines = content.split('\n')
  
  let currentLink: ImportLink | null = null
  let inLinkBlock = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测链接标题 (### [标题](URL))
    const linkMatch = line.match(/^###\s*\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      // 保存上一个链接
      if (currentLink) {
        links.push(currentLink)
      }
      
      // 开始新链接
      currentLink = {
        title: linkMatch[1],
        url: linkMatch[2],
        description: '',
        tags: [],
        category: '导入'
      }
      inLinkBlock = true
      continue
    }
    
    // 检测分类标题 (## 分类名)
    const categoryMatch = line.match(/^##\s*(.+)/)
    if (categoryMatch && currentLink) {
      currentLink.category = categoryMatch[1]
      continue
    }
    
    // 检测描述
    if (inLinkBlock && currentLink && line && !line.startsWith('**') && !line.startsWith('-')) {
      if (currentLink.description) {
        currentLink.description += ' ' + line
      } else {
        currentLink.description = line
      }
      continue
    }
    
    // 检测标签
    const tagsMatch = line.match(/^\*\*标签:\*\*\s*(.+)/)
    if (tagsMatch && currentLink) {
      currentLink.tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag)
      continue
    }
    
    // 检测分隔线，结束当前链接块
    if (line === '---' && currentLink) {
      inLinkBlock = false
      continue
    }
  }
  
  // 保存最后一个链接
  if (currentLink) {
    links.push(currentLink)
  }
  
  return links
}
