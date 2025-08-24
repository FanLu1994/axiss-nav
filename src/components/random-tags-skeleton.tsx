import { Skeleton } from "@/components/ui/skeleton"

export function RandomTagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton 
          key={index} 
          className="h-8 w-20 rounded-full" 
        />
      ))}
    </div>
  )
}
