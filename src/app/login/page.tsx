"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, PlusCircle, ScanSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { VisualBackdrop } from "@/components/visual-backdrop";

const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "authUser";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("用户名和密码不能为空。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        toast.success("登录成功");
        router.push("/");
      } else {
        setError(data.error || "登录失败。");
      }
    } catch {
      setError("登录失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="axiss-motion-shell relative min-h-[100dvh] overflow-hidden px-4 py-6 text-slate-950 dark:text-slate-100">
      <VisualBackdrop variant="auth" />
      <div className="axiss-motion-header relative mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link
          href="/"
          className="axiss-action-lift inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          返回工作台
        </Link>
        <DarkModeToggle />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-5xl items-center gap-10 py-8 lg:grid-cols-[1fr_25rem]">
        <div className="axiss-motion-fade-up hidden lg:block">
          <div className="axiss-brand-mark mb-8 flex h-14 w-14 items-center justify-center rounded-lg text-base font-semibold">
            <Image
              src="/favicon.ico"
              alt="Axiss Nav"
              width={36}
              height={36}
              priority
              unoptimized
              className="h-9 w-9 rounded-sm object-contain"
            />
          </div>
          <p className="text-sm font-medium text-teal-900/70 dark:text-[#b7e4dc]">Axiss Nav</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-[1.04] tracking-tight text-slate-950 dark:text-slate-100">
            回到你的个人导航工作台
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            登录后可以添加、编辑、重新分析和整理收藏链接。
          </p>
          <div className="mt-8 grid gap-3">
            {[
              {
                icon: ScanSearch,
                title: "集中搜索",
                text: "在同一个工作区里查找标题、网址、标签和分类。",
              },
              {
                icon: PlusCircle,
                title: "持续整理",
                text: "添加新链接后可以继续编辑描述、标签和分类。",
              },
              {
                icon: KeyRound,
                title: "统一管理",
                text: "登录状态用于新增、编辑、删除和重新分析操作。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="axiss-motion-fade-up axiss-surface-row flex items-start gap-3 rounded-lg px-4 py-3"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="axiss-motion-side axiss-panel rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">登录</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              使用管理员账户继续管理你的导航工作台。
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">管理员账号</Label>
              <Input
                id="username"
                placeholder="ADMIN_USERNAME"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                className="h-10 bg-white/66 dark:bg-white/7"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                disabled={loading}
                className="h-10 bg-white/66 dark:bg-white/7"
              />
            </div>
            <Button type="submit" className="axiss-action-lift w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
