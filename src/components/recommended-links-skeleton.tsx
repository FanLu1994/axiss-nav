import { Skeleton } from "@/components/ui/skeleton"

export function RecommendedLinksSkeleton() {
  return (
    <div className="w-full mb-8">
      {/* 标题区域 skeleton */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
          <Skeleton className="w-3 h-3 rounded" />
          <Skeleton className="w-8 h-3 rounded" />
          <Skeleton className="w-3 h-3 rounded" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
        </div>
      </div>
      
      {/* 链接列表 skeleton */}
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-1">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
