// 性能监控仪表板
export class PerformanceDashboard {
  private static instance: PerformanceDashboard;
  private metrics = {
    totalRequests: 0,
    slowRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    dbQueryTime: 0,
    errors: 0
  };

  private requestTimes: number[] = [];
  private slowQueryThreshold = 1000; // 1秒

  static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard();
    }
    return PerformanceDashboard.instance;
  }

  recordRequest(duration: number, isSlow: boolean = false) {
    this.metrics.totalRequests++;
    this.requestTimes.push(duration);
    
    if (isSlow) {
      this.metrics.slowRequests++;
    }

    // 保持最近1000个请求的时间
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }

    this.updateAverageResponseTime();
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordDbQuery(duration: number) {
    this.metrics.dbQueryTime += duration;
  }

  recordError() {
    this.metrics.errors++;
  }

  private updateAverageResponseTime() {
    if (this.requestTimes.length > 0) {
      this.metrics.averageResponseTime = 
        this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0 
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      slowRequestRate: this.metrics.totalRequests > 0
        ? (this.metrics.slowRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  getSlowQueries() {
    return this.requestTimes.filter(time => time > this.slowQueryThreshold);
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      slowRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbQueryTime: 0,
      errors: 0
    };
    this.requestTimes = [];
  }

  // 生成性能报告
  generateReport(): string {
    const metrics = this.getMetrics();
    const slowQueries = this.getSlowQueries();
    
    return `
📊 性能监控报告
================

📈 请求统计:
- 总请求数: ${metrics.totalRequests}
- 平均响应时间: ${metrics.averageResponseTime.toFixed(2)}ms
- 慢请求数: ${metrics.slowRequests} (${metrics.slowRequestRate})
- 错误数: ${metrics.errors}

💾 缓存统计:
- 缓存命中: ${metrics.cacheHits}
- 缓存未命中: ${metrics.cacheMisses}
- 命中率: ${metrics.cacheHitRate}

🗄️ 数据库统计:
- 总查询时间: ${metrics.dbQueryTime.toFixed(2)}ms
- 平均查询时间: ${metrics.totalRequests > 0 ? (metrics.dbQueryTime / metrics.totalRequests).toFixed(2) : 0}ms

🐌 慢查询分析:
- 超过${this.slowQueryThreshold}ms的查询: ${slowQueries.length}个
- 最慢查询: ${slowQueries.length > 0 ? Math.max(...slowQueries) : 0}ms
    `.trim();
  }
}

// 全局实例
export const dashboard = PerformanceDashboard.getInstance();

// 定期输出性能报告
if (typeof window === 'undefined') { // 只在服务器端运行
  setInterval(() => {
    console.log(dashboard.generateReport());
  }, 300000); // 每5分钟输出一次报告
}
