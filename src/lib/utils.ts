import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT载荷类型
interface JWTPayload {
  userId: string
  username: string
  role: string
}

// 生成JWT令牌
export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: '180d' }); // 半年（180天）
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET || 'fallback-secret';

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('JWT验证失败: 令牌已过期');
    } else if (error instanceof JsonWebTokenError) {
      console.error('JWT验证失败: 无效的令牌 (例如签名不正确, 格式错误等)');
      console.error('具体错误信息:', error.message); // 打印具体的错误消息
    } else {
      console.error('JWT验证失败: 未知错误', error);
    }
    return null;
  }
}

// 从请求头提取用户信息
export function getUserFromToken(authHeader: string | undefined): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// 默认网站图标 - 简单的地球图标SVG
const DEFAULT_FAVICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS02IDBoLThtNCAwaC04bTAtNGg4bTQgMGg4IiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'

// 获取网站favicon并转换为Base64
export async function getFaviconAsBase64(url: string): Promise<string> {
  try {
    // 尝试多个可能的favicon路径
    const faviconUrls = [
      `${new URL(url).origin}/favicon.ico`,
      `${new URL(url).origin}/favicon.png`,
      `${new URL(url).origin}/apple-touch-icon.png`,
      `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
    ]
    
    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = response.headers.get('content-type') || 'image/x-icon'
          return `data:${mimeType};base64,${base64}`
        }
      } catch (error) {
        console.log(`尝试获取 ${faviconUrl} 失败:`, error)
        continue
      }
    }
    
    // 如果所有尝试都失败，返回默认图标
    console.log(`所有favicon获取尝试都失败，使用默认图标: ${url}`)
    return DEFAULT_FAVICON
  } catch (error) {
    console.error('获取favicon失败，使用默认图标:', error)
    return DEFAULT_FAVICON
  }
}

// 批量获取多个网站的favicon
export async function getFaviconsForLinks(links: Array<{ url: string; title: string }>) {
  const results: Array<{ url: string; title: string; icon: string }> = []
  
  for (const link of links) {
    console.log(`正在获取 ${link.title} 的favicon...`)
    const icon = await getFaviconAsBase64(link.url)
    results.push({ ...link, icon })
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}
