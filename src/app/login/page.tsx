"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      alert("用户名和密码不能为空")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (res.ok) {
        localStorage.setItem('token', data.token)
        alert("登录成功")
        router.push("/")
      } else {
        alert(data.error || "登录失败")
      }
    } catch (error) {
      alert("登录失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                placeholder="用户名"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="密码"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 