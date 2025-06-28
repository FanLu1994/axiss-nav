"use client"

import { useState, useEffect } from "react"

interface ResponsiveConfig {
  xs: number  // < 640px
  sm: number  // >= 640px
  md: number  // >= 768px
  lg: number  // >= 1024px
  xl: number  // >= 1280px
}

const defaultConfig: ResponsiveConfig = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
}

export function useResponsiveColumns(config: Partial<ResponsiveConfig> = {}) {
  const [columns, setColumns] = useState(1)
  const finalConfig = { ...defaultConfig, ...config }

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      
      if (width >= 1280) {
        setColumns(finalConfig.xl)
      } else if (width >= 1024) {
        setColumns(finalConfig.lg)
      } else if (width >= 768) {
        setColumns(finalConfig.md)
      } else if (width >= 640) {
        setColumns(finalConfig.sm)
      } else {
        setColumns(finalConfig.xs)
      }
    }

    updateColumns()
    
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [finalConfig])

  return columns
} 