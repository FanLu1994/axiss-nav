import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LinkCardSkeleton() {
  return (
    <Card className="w-80 h-40">
      <CardContent className="p-4 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* 左侧图标占位 */}
            <div className="flex-shrink-0">
              <Skeleton className="w-12 h-12 rounded" />
            </div>

            {/* 右侧内容占位 */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div>
                {/* 标题占位 */}
                <Skeleton className="h-4 w-3/4 mb-2" />
                
                {/* 描述占位 */}
                <div className="space-y-1 mb-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>

              {/* 底部标签和按钮占位 */}
              <div className="flex items-center justify-between">
                {/* 标签占位 */}
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* 按钮占位 */}
                <div className="flex items-center gap-1 ml-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
