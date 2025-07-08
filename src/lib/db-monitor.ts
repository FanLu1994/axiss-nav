import { prisma } from './prisma'

// 数据库性能监控工具
export class DatabaseMonitor {
  
  // 检查数据库连接
  static async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('数据库连接失败:', error)
      return false
    }
  }

  // 获取表大小信息
  static async getTableSizes() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      ` as Array<{
        schemaname: string
        tablename: string
        size: string
        size_bytes: bigint
      }>
      
      return result
    } catch (error) {
      console.error('获取表大小失败:', error)
      return []
    }
  }

  // 获取慢查询信息
  static async getSlowQueries() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 10
      ` as Array<{
        query: string
        calls: number
        total_time: number
        mean_time: number
        rows: number
      }>
      
      return result
    } catch (error) {
      console.error('获取慢查询失败 (需要安装pg_stat_statements扩展):', error)
      return []
    }
  }

  // 获取索引使用情况
  static async getIndexUsage() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      ` as Array<{
        schemaname: string
        tablename: string
        indexname: string
        idx_scan: number
        idx_tup_read: number
        idx_tup_fetch: number
      }>
      
      return result
    } catch (error) {
      console.error('获取索引使用情况失败:', error)
      return []
    }
  }

  // 获取数据库统计信息
  static async getDatabaseStats() {
    try {
      const [connection, tables, indexes] = await Promise.all([
        this.checkConnection(),
        this.getTableSizes(),
        this.getIndexUsage()
      ])

      return {
        connection,
        tables,
        indexes,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('获取数据库统计信息失败:', error)
      return {
        connection: false,
        tables: [],
        indexes: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  // 优化建议
  static async getOptimizationSuggestions() {
    const suggestions: string[] = []

    try {
      // 检查是否有未使用的索引
      const unusedIndexes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public' AND idx_scan = 0
      ` as Array<{
        schemaname: string
        tablename: string
        indexname: string
      }>

      if (unusedIndexes.length > 0) {
        suggestions.push(`发现 ${unusedIndexes.length} 个未使用的索引，考虑删除以提高写入性能`)
      }

      // 检查表大小
      const tables = await this.getTableSizes()
      const largeTables = tables.filter(t => Number(t.size_bytes) > 100 * 1024 * 1024) // 100MB以上

      if (largeTables.length > 0) {
        suggestions.push(`发现 ${largeTables.length} 个大表，考虑分区或归档历史数据`)
      }

      return suggestions
    } catch (error) {
      console.error('获取优化建议失败:', error)
      return ['无法获取优化建议，请检查数据库连接']
    }
  }
}

// 创建监控API端点可以使用的函数
export async function getDbHealthCheck() {
  const stats = await DatabaseMonitor.getDatabaseStats()
  const suggestions = await DatabaseMonitor.getOptimizationSuggestions()
  
  return {
    status: stats.connection ? 'healthy' : 'error',
    stats,
    suggestions,
    timestamp: new Date().toISOString()
  }
} 