"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  columns: number
  renderItem: (item: T, index: number) => React.ReactNode
  gap?: number
  className?: string
  children?: React.ReactNode
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  renderItem,
  gap = 16,
  className = "",
  children
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // 计算显示相关的数值
  const totalRows = Math.ceil(items.length / columns)
  const totalHeight = totalRows * (itemHeight + gap) - gap
  
  // 计算可见范围，增加缓冲区
  const bufferSize = 2
  const visibleRowsCount = Math.ceil(containerHeight / (itemHeight + gap))
  const visibleStart = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - bufferSize)
  const visibleEnd = Math.min(
    visibleStart + visibleRowsCount + bufferSize * 2,
    totalRows
  )

  // 计算实际渲染的项目
  const visibleItems = useMemo(() => {
    const startIndex = visibleStart * columns
    const endIndex = Math.min(visibleEnd * columns, items.length)
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      originalIndex: startIndex + index,
      rowIndex: Math.floor((startIndex + index) / columns),
      colIndex: (startIndex + index) % columns
    }))
  }, [items, visibleStart, visibleEnd, columns])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 监听容器尺寸变化
  useEffect(() => {
    const container = scrollElementRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      // 可以在这里处理容器尺寸变化
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}
      
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          <div
            className="absolute left-0 right-0"
            style={{
              top: visibleStart * (itemHeight + gap),
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {visibleItems.map(({ item, originalIndex, rowIndex, colIndex }) => (
              <div
                key={originalIndex}
                style={{
                  height: itemHeight,
                  gridColumn: colIndex + 1,
                  gridRow: rowIndex - visibleStart + 1,
                }}
              >
                {renderItem(item, originalIndex)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 