"use client";

import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/components/dark-mode-provider";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDarkMode}
      className="border-slate-950/10 bg-white/52 text-slate-600 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white/76 hover:text-slate-950 dark:border-white/10 dark:bg-white/7 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-[#b7e4dc]"
      title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{isDarkMode ? "切换到浅色模式" : "切换到深色模式"}</span>
    </Button>
  );
}
