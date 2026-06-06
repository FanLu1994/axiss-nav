import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DarkModeProvider } from "@/components/dark-mode-provider";

export const metadata: Metadata = {
  title: "Axiss Nav",
  description: "安静、清晰、适合高频使用的个人导航工作台。",
  icons: {
    icon: "/icon.svg",
  },
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
