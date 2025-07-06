"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Particles } from "@/components/particles"
import { toast } from "sonner"

export default function InitPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // 检查是否需要初始化
  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const res = await fetch('/api/init/check')
        const data = await res.json()
        
        if (!data.needsInitialization) {
          // 已经有管理员了，重定向到主页
          router.push('/')
          return
        }
      } catch (error) {
        console.error('检查初始化状态失败:', error)
      } finally {
        setChecking(false)
      }
    }
    
    checkInitStatus()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证表单
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('请填写所有字段')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    
    if (formData.password.length < 6) {
      toast.error('密码长度不能少于6位')
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch('/api/init/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // 保存token到localStorage实现自动登录
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        toast.success('管理员账户创建成功！即将跳转到主页面...')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建管理员账户失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center relative">
        <Particles />
        <div className="text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
          检查初始化状态中...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative">
      <Particles />
      
      <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🚀 欢迎使用 Axiss Nav
          </h1>
          <p className="text-gray-600 text-sm">
            首次使用需要创建管理员账户
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱地址"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码（至少6位）"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? '创建中...' : '创建管理员账户'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="mb-1">💡 <strong>提示</strong></p>
            <p>• 管理员账户用于管理您的个人导航网站</p>
            <p>• 请妥善保管您的登录信息</p>
            <p>• 创建后将跳转到登录页面</p>
          </div>
        </div>
      </Card>
    </main>
  )
} 