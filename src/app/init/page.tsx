"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { VisualBackdrop } from "@/components/visual-backdrop";

export default function InitPage() {
  const [checking, setChecking] = useState(true);
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const res = await fetch("/api/init/check");
        const data = await res.json();

        if (!data.needsInitialization) {
          router.push("/");
          return;
        }
        setNeedsInitialization(true);
      } catch (error) {
        console.error("检查初始化状态失败:", error);
      } finally {
        setChecking(false);
      }
    };

    checkInitStatus();
  }, [router]);

  if (checking) {
    return (
      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 text-slate-950 dark:text-slate-100">
        <VisualBackdrop variant="auth" />
        <div className="axiss-panel relative rounded-lg px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
          检查初始化状态中...
        </div>
      </main>
    );
  }

  if (!needsInitialization) {
    return null;
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden px-4 py-6 text-slate-950 dark:text-slate-100">
      <VisualBackdrop variant="auth" />
      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          返回工作台
        </Link>
        <DarkModeToggle />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-5xl items-center gap-10 py-8 lg:grid-cols-[1fr_27rem]">
        <div className="hidden lg:block">
          <div className="axiss-brand-mark mb-8 flex h-14 w-14 items-center justify-center rounded-lg text-base font-semibold">
            AX
          </div>
          <p className="text-sm font-medium text-teal-900/70 dark:text-[#b7e4dc]">环境配置</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-[1.04] tracking-tight text-slate-950 dark:text-slate-100">
            使用环境变量启用唯一管理员
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            当前版本不再通过页面初始化管理员，登录身份由部署配置中的单一管理员账号决定。
          </p>
          <div className="mt-8 grid gap-3">
            {[
              {
                icon: ShieldCheck,
                title: "单管理员模式",
                text: "系统只保留一个预设管理员账户，不提供注册和用户管理。",
              },
              {
                icon: KeyRound,
                title: "三项必要配置",
                text: "请设置 ADMIN_USERNAME、ADMIN_PASSWORD、JWT_SECRET 后再访问主页。",
              },
              {
                icon: Sparkles,
                title: "保留手动整理",
                text: "完成配置后仍可继续添加、编辑、重新分析并确认保存建议。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="axiss-surface-row flex items-start gap-3 rounded-lg px-4 py-3"
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

        <div className="axiss-panel rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">需要配置环境变量</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              配置完成后刷新页面即可进入登录页和主页。
            </p>
          </div>

          <Alert>
            <AlertTitle>示例</AlertTitle>
            <AlertDescription>
              <code className="block whitespace-pre-wrap text-xs leading-6">
                ADMIN_USERNAME=admin{"\n"}
                ADMIN_PASSWORD=your-password{"\n"}
                JWT_SECRET=replace-with-a-long-random-secret
              </code>
            </AlertDescription>
          </Alert>
        </div>
      </section>
    </main>
  );
}
