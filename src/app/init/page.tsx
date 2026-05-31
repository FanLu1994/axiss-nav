"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { VisualBackdrop } from "@/components/visual-backdrop"

export default function InitPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const res = await fetch("/api/init/check")
        const data = await res.json()

        if (!data.needsInitialization) {
          router.push("/")
          return
        }
      } catch (error) {
        console.error("检查初始化状态失败:", error)
      } finally {
        setChecking(false)
      }
    }

    checkInitStatus()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setError("")
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("请填写所有字段。")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致。")
      return
    }

    if (formData.password.length < 6) {
      setError("密码长度不能少于 6 位。")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/init/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await res.json()

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token)
        }
        toast.success("管理员账户已创建")
        router.push("/")
      } else {
        setError(data.error || "创建失败。")
      }
    } catch (error) {
      console.error("创建管理员账户失败:", error)
      setError("网络错误，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-slate-950 dark:text-slate-100">
        <VisualBackdrop variant="auth" />
        <div className="axiss-panel relative rounded-lg px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
          检查初始化状态中...
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-950 dark:text-slate-100">
      <VisualBackdrop variant="auth" />
      <div className="relative mx-auto flex max-w-5xl justify-end">
        <DarkModeToggle />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_27rem]">
        <div className="hidden lg:block">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-md border border-emerald-950/10 bg-emerald-950 text-base font-semibold text-[#f5f0df] shadow-sm dark:border-emerald-100/10 dark:bg-[#d8cfaa] dark:text-emerald-950">
            AX
          </div>
          <p className="text-sm font-medium text-emerald-900/70 dark:text-[#d8cfaa]">首次设置</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-100">
            创建你的 Axiss Nav 管理账户
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            账户创建后会自动登录并进入主页，用于后续管理收藏链接。
          </p>
        </div>

        <div className="axiss-panel rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">初始化管理员</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">创建后将进入主页。</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "创建中..." : "创建管理员账户"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
