// 性能监控工具
export class PerformanceMonitor {
  private startTime: number
  private checkpoints: Map<string, number> = new Map()
  private requestId: string

  constructor(requestId?: string) {
    this.startTime = performance.now()
    this.requestId = requestId || Math.random().toString(36).substring(2, 15)
    this.checkpoint('start')
  }

  checkpoint(name: string) {
    const now = performance.now()
    this.checkpoints.set(name, now)
    const elapsed = now - this.startTime
    console.log(`[${this.requestId}] ⏱️ ${name}: ${elapsed.toFixed(2)}ms`)
  }

  measure(name: string, fn: () => Promise<any> | any) {
    return async (...args: any[]) => {
      const start = performance.now()
      try {
        const result = await fn(...args)
        const end = performance.now()
        const duration = end - start
        console.log(`[${this.requestId}] ⏱️ ${name}: ${duration.toFixed(2)}ms`)
        return result
      } catch (error) {
        const end = performance.now()
        const duration = end - start
        console.log(`[${this.requestId}] ⏱️ ${name} (ERROR): ${duration.toFixed(2)}ms`)
        throw error
      }
    }
  }

  end() {
    const totalTime = performance.now() - this.startTime
    console.log(`[${this.requestId}] 🏁 总耗时: ${totalTime.toFixed(2)}ms`)
    
    // 打印各阶段耗时
    const checkpoints = Array.from(this.checkpoints.entries())
    for (let i = 1; i < checkpoints.length; i++) {
      const [name, time] = checkpoints[i]
      const [prevName, prevTime] = checkpoints[i - 1]
      const stageTime = time - prevTime
      console.log(`[${this.requestId}] 📊 ${prevName} → ${name}: ${stageTime.toFixed(2)}ms`)
    }
  }
}

// 创建性能监控实例的工厂函数
export function createPerformanceMonitor(requestId?: string) {
  return new PerformanceMonitor(requestId)
}
