import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  try {
    return jwt.verify(token, secret) as JWTPayload
  } catch {
    return null
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
