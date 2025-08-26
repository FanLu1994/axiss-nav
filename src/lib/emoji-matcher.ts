// Emoji智能匹配模块

// 分类emoji映射表
const CATEGORY_EMOJI_MAP: Record<string, string[]> = {
  // 开发技术类
  '开发': ['💻', '🔧', '⚙️', '🛠️'],
  '代码': ['👨‍💻', '💻', '📝', '⌨️'],
  '编程': ['⌨️', '💻', '🔧', '📝'],
  '技术': ['🔧', '⚙️', '🛠️', '💡'],
  '框架': ['🏗️', '🔧', '📦', '⚙️'],
  
  // 前端相关
  '前端': ['🎨', '🖼️', '💄', '🎭'],
  'UI': ['🖼️', '🎨', '✨', '💄'],
  'UX': ['👥', '🤝', '❤️', '🎯'],
  '设计': ['🎨', '🎭', '✨', '🖌️'],
  '界面': ['📱', '🖼️', '💻', '📺'],
  '响应式': ['📱', '💻', '📟', '📺'],
  '移动端': ['📱', '📲', '📟', '⌚'],
  
  // 后端相关
  '后端': ['⚙️', '🖥️', '🔧', '🗄️'],
  '服务器': ['🖥️', '🌐', '☁️', '📡'],
  '数据库': ['🗄️', '📊', '💾', '🗃️'],
  'API': ['🔌', '🌐', '📡', '🔗'],
  
  // 编程语言
  'JavaScript': ['🟨', '⚡', '🔥', '💛'],
  'TypeScript': ['🔷', '💙', '📘', '🔹'],
  'Python': ['🐍', '🟢', '📗', '🐲'],
  'Java': ['☕', '🟤', '📕', '🔥'],
  'React': ['⚛️', '🔵', '💙', '🌊'],
  'Vue': ['💚', '🟢', '🌿', '🍃'],
  'Node.js': ['🟢', '⚡', '🚀', '💚'],
  
  // 工具相关
  '工具': ['🔨', '🛠️', '⚙️', '🔧'],
  '效率': ['⚡', '🚀', '💨', '⏰'],
  '自动化': ['🤖', '⚙️', '🔄', '🎯'],
  '测试': ['🧪', '🔬', '🎯', '✅'],
  '部署': ['🚀', '📦', '☁️', '🌐'],
  'Docker': ['🐳', '📦', '🚢', '🌊'],
  'Git': ['📁', '🔄', '🌿', '📝'],
  'GitHub': ['🐙', '📁', '⭐', '🔗'],
  
  // 学习相关
  '文档': ['📖', '📚', '📝', '📋'],
  '教程': ['📚', '🎓', '📖', '👨‍🏫'],
  '学习': ['🎓', '📚', '💡', '🧠'],
  '博客': ['✍️', '📝', '📰', '💭'],
  '资源': ['💎', '📦', '🎁', '⭐'],
  '课程': ['🎯', '📚', '🎓', '👨‍🏫'],
  '指南': ['🧭', '📖', '🗺️', '💡'],
  
  // 社区相关
  '社区': ['👥', '🤝', '🌍', '💬'],
  '论坛': ['💬', '🗣️', '👥', '📢'],
  '问答': ['❓', '💬', '🤔', '💡'],
  '讨论': ['🗣️', '💭', '💬', '🤝'],
  '分享': ['📤', '🤝', '💝', '🎁'],
  '交流': ['💭', '🤝', '📞', '💬'],
  
  // 娱乐相关
  '游戏': ['🎮', '🕹️', '🎯', '🏆'],
  '音乐': ['🎵', '🎶', '🎼', '🎤'],
  '视频': ['📹', '🎬', '📺', '🎥'],
  '电影': ['🎬', '🍿', '🎭', '🎪'],
  '动漫': ['🎭', '🎨', '🌸', '⭐'],
  '娱乐': ['🎪', '🎨', '🎭', '🎉'],
  
  // 商业相关
  '商业': ['💼', '📈', '💰', '🏢'],
  '金融': ['💰', '💳', '📈', '🏦'],
  '投资': ['📈', '💎', '💰', '🚀'],
  '创业': ['🚀', '💡', '🌱', '⭐'],
  '营销': ['📢', '📈', '🎯', '💡'],
  '电商': ['🛒', '💳', '📦', '🛍️'],
  
  // 生活相关
  '生活': ['🏠', '☀️', '🌱', '❤️'],
  '健康': ['🏥', '💊', '🏃', '❤️'],
  '美食': ['🍽️', '🍕', '🍰', '👨‍🍳'],
  '旅行': ['✈️', '🗺️', '🌍', '📸'],
  '购物': ['🛍️', '🛒', '💳', '🎁'],
  '时尚': ['👗', '💄', '✨', '👠'],
  '摄影': ['📷', '📸', '🎨', '🌅'],
  
  // 其他常用
  '链接': ['🔗', '📎', '🌐', '🔄'],
  '收藏': ['⭐', '❤️', '📌', '💖'],
  '网站': ['🌐', '🏠', '📱', '💻'],
  '推荐': ['👍', '⭐', '💖', '🎯'],
  '热门': ['🔥', '⭐', '📈', '🚀'],
  '最新': ['🆕', '✨', '🌟', '⚡'],
  '精选': ['💎', '⭐', '👑', '🏆'],
  '实用': ['🛠️', '💡', '⚙️', '🎯'],
  '免费': ['🆓', '💝', '🎁', '💚'],
  '付费': ['💰', '💳', '💎', '👑']
}

// 关键词匹配权重
const KEYWORD_WEIGHTS = {
  exact: 10,     // 完全匹配
  contains: 7,   // 包含关键词
  similar: 5,    // 相似词汇
  category: 3    // 分类匹配
}

// 相似词汇映射
const SIMILAR_WORDS: Record<string, string[]> = {
  '开发': ['dev', 'develop', 'coding', '编码', '程序'],
  '前端': ['frontend', 'fe', '客户端', 'client'],
  '后端': ['backend', 'be', '服务端', 'server'],
  '数据库': ['database', 'db', '存储', 'storage'],
  '框架': ['framework', 'lib', 'library', '库'],
  '工具': ['tool', 'utils', 'utility', '实用'],
  '文档': ['doc', 'docs', 'documentation', '说明'],
  '教程': ['tutorial', 'guide', 'course', '指南'],
  '社区': ['community', 'forum', '论坛', '群组'],
  '游戏': ['game', 'gaming', '娱乐', 'play'],
  '音乐': ['music', 'audio', '声音', 'sound'],
  '视频': ['video', 'media', '媒体', 'film']
}

/**
 * 智能匹配标签的最佳emoji
 * @param tagName 标签名称
 * @returns 匹配的emoji
 */
export function matchTagEmoji(tagName: string): string {
  if (!tagName || typeof tagName !== 'string') {
    return '🏷️' // 默认标签emoji
  }

  const normalizedTag = tagName.toLowerCase().trim()
  const matchScores: Array<{ emoji: string; score: number }> = []

  // 1. 完全匹配检查
  if (CATEGORY_EMOJI_MAP[tagName]) {
    const emojis = CATEGORY_EMOJI_MAP[tagName]
    matchScores.push({ 
      emoji: emojis[0], 
      score: KEYWORD_WEIGHTS.exact 
    })
  }

  // 2. 包含关键词检查
  for (const [category, emojis] of Object.entries(CATEGORY_EMOJI_MAP)) {
    const normalizedCategory = category.toLowerCase()
    
    if (normalizedTag.includes(normalizedCategory) || normalizedCategory.includes(normalizedTag)) {
      matchScores.push({
        emoji: emojis[0],
        score: KEYWORD_WEIGHTS.contains
      })
    }
  }

  // 3. 相似词汇检查
  for (const [keyword, synonyms] of Object.entries(SIMILAR_WORDS)) {
    const hasMatch = synonyms.some(synonym => 
      normalizedTag.includes(synonym.toLowerCase()) || 
      synonym.toLowerCase().includes(normalizedTag)
    )
    
    if (hasMatch && CATEGORY_EMOJI_MAP[keyword]) {
      matchScores.push({
        emoji: CATEGORY_EMOJI_MAP[keyword][0],
        score: KEYWORD_WEIGHTS.similar
      })
    }
  }

  // 4. 英文关键词特殊处理
  const englishKeywords: Record<string, string> = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'css': '前端',
    'html': '前端',
    'sql': '数据库',
    'api': 'API',
    'ui': 'UI',
    'ux': 'UX'
  }

  for (const [abbr, fullName] of Object.entries(englishKeywords)) {
    if (normalizedTag.includes(abbr) && CATEGORY_EMOJI_MAP[fullName]) {
      matchScores.push({
        emoji: CATEGORY_EMOJI_MAP[fullName][0],
        score: KEYWORD_WEIGHTS.similar
      })
    }
  }

  // 5. 选择最高分的emoji
  if (matchScores.length > 0) {
    // 按分数排序，选择最高分
    matchScores.sort((a, b) => b.score - a.score)
    return matchScores[0].emoji
  }

  // 6. 基于标签首字符的备用方案
  const firstChar = tagName.charAt(0)
  const fallbackEmojis: Record<string, string> = {
    '开': '💻', '前': '🎨', '后': '⚙️', '数': '🗄️', '工': '🔨',
    '学': '📚', '文': '📖', '社': '👥', '游': '🎮', '音': '🎵',
    '视': '📹', '商': '💼', '生': '🏠', '链': '🔗', '网': '🌐'
  }

  return fallbackEmojis[firstChar] || '🏷️'
}

/**
 * 批量匹配标签emoji
 * @param tags 标签数组
 * @returns 带emoji的标签对象数组
 */
export function batchMatchTagEmojis(tags: string[]): Array<{ name: string; emoji: string }> {
  return tags.map(tag => ({
    name: tag,
    emoji: matchTagEmoji(tag)
  }))
}

/**
 * 获取随机emoji（同一标签每次可能返回不同emoji）
 * @param tagName 标签名称
 * @returns 随机选择的emoji
 */
export function getRandomTagEmoji(tagName: string): string {
  if (!tagName || typeof tagName !== 'string') {
    return '🏷️'
  }

  // 尝试从分类中获取多个emoji选项
  if (CATEGORY_EMOJI_MAP[tagName]) {
    const emojis = CATEGORY_EMOJI_MAP[tagName]
    return emojis[Math.floor(Math.random() * emojis.length)]
  }

  // 如果没有直接匹配，使用智能匹配
  return matchTagEmoji(tagName)
}

/**
 * 验证emoji是否有效
 * @param emoji emoji字符
 * @returns 是否为有效emoji
 */
export function isValidEmoji(emoji: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(emoji)
}