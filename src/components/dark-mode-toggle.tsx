"use client"

import { Button } from "@/components/ui/button"
import { useDarkMode } from "@/components/dark-mode-provider"

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDarkMode}
      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
      title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
    >
      {isDarkMode ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </Button>
  )
} 