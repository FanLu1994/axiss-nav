"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { VisualBackdrop } from "@/components/visual-backdrop"

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.username || !form.password) {
      setError("用户名和密码不能为空。")
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
        localStorage.setItem("token", data.token)
        toast.success("登录成功")
        router.push("/")
      } else {
        setError(data.error || "登录失败。")
      }
    } catch {
      setError("登录失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-950 dark:text-slate-100">
      <VisualBackdrop variant="auth" />
      <div className="relative mx-auto flex max-w-5xl justify-end">
        <DarkModeToggle />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_25rem]">
        <div className="hidden lg:block">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-md border border-emerald-950/10 bg-emerald-950 text-base font-semibold text-[#f5f0df] shadow-sm dark:border-emerald-100/10 dark:bg-[#d8cfaa] dark:text-emerald-950">
            AX
          </div>
          <p className="text-sm font-medium text-emerald-900/70 dark:text-[#d8cfaa]">Axiss Nav</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-100">
            回到你的个人导航工作台
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            登录后可以添加、编辑、重新分析和整理收藏链接。
          </p>
        </div>

        <div className="axiss-panel rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">登录</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">使用管理员账户继续。</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                disabled={loading}
                className="bg-white/58 dark:bg-emerald-950/24"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
