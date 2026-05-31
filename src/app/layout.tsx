import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { DarkModeProvider } from "@/components/dark-mode-provider"

export const metadata: Metadata = {
  title: "Axiss的导航站",
  description: "你的专属网址导航站"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <DarkModeProvider>
          <Toaster position="top-center" />
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
