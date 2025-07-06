"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

interface InfiniteVirtualScrollProps<T> {
  initialItems: T[]
  totalCount: number
  itemHeight: number
  containerHeight: number
  columns: number
  loadMore: (page: number, search?: string) => Promise<{ data: T[], hasMore: boolean }>
  renderItem: (item: T, index: number) => React.ReactNode
  gap?: number
  className?: string
  children?: React.ReactNode
  search?: string
  loading?: boolean
  onLoadingChange?: (loading: boolean) => void
  hideScrollbar?: boolean
}

export function InfiniteVirtualScroll<T>({
  initialItems,
  totalCount,
  itemHeight,
  containerHeight,
  columns,
  loadMore,
  renderItem,
  gap = 16,
  className = "",
  children,
  search = "",
  loading = false,
  onLoadingChange,
  hideScrollbar = false
}: InfiniteVirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [items, setItems] = useState<T[]>(initialItems)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  // 重置数据当搜索条件改变时
  useEffect(() => {
    setItems(initialItems)
    setCurrentPage(1)
    setHasMore(initialItems.length < totalCount)
  }, [initialItems, totalCount, search])

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

  // 加载更多数据
  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || isLoading) return
    
    loadingRef.current = true
    setIsLoading(true)
    onLoadingChange?.(true)
    
    try {
      const nextPage = currentPage + 1
      const result = await loadMore(nextPage, search)
      
      setItems(prev => [...prev, ...result.data])
      setCurrentPage(nextPage)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('加载更多数据失败:', error)
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
      loadingRef.current = false
    }
  }, [currentPage, hasMore, isLoading, loadMore, search, onLoadingChange])

  // 检查是否需要加载更多
  const checkLoadMore = useCallback(() => {
    if (!scrollElementRef.current || !hasMore || isLoading) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElementRef.current
    const threshold = 200 // 距离底部200px时开始加载
    
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      handleLoadMore()
    }
  }, [hasMore, isLoading, handleLoadMore])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
    checkLoadMore()
  }, [checkLoadMore])

  // 监听容器尺寸变化
  useEffect(() => {
    const container = scrollElementRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      checkLoadMore()
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [checkLoadMore])

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}
      
              <div
          ref={scrollElementRef}
          className={`overflow-auto ${hideScrollbar 
            ? 'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
          }`}
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
        <div
          className="relative"
          style={{ height: Math.max(totalHeight, containerHeight) }}
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
          
          {/* 加载更多指示器 */}
          {(isLoading || loading) && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center py-4"
              style={{ top: totalHeight + 20 }}
            >
              <div className="text-gray-500 text-sm">加载中...</div>
            </div>
          )}
          
          {/* 无更多数据指示器 */}
          {!hasMore && items.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center py-4"
              style={{ top: totalHeight + 20 }}
            >
              <div className="text-gray-400 text-sm">已显示全部内容</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 