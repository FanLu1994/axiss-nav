// AI服务模块 - 用于智能解析URL链接

interface LinkAnalysis {
  title: string;
  description: string;
  tags: Array<{name: string; emoji: string}>;
}

interface AIProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

// AI提供商配置
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY || '',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo'
  },
  deepseek: {
    name: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  },
  claude: {
    name: 'Claude',
    apiKey: process.env.CLAUDE_API_KEY || '',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229'
  },
  gemini: {
    name: 'Gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  }
} as const;

// 预设提示词
const SYSTEM_PROMPT = `你是一个专业的网站内容分析师，负责为网站生成精准的中文描述信息。

**重要要求：**
1. 必须使用中文回答
2. 标签必须凝练、高度概括，避免相似重复
3. 标签要泛化而非具体化，覆盖网站的核心领域
4. 每个网站最多3-5个标签，优先选择最具代表性的

**标签分类参考（选择最匹配的，不要全部使用）：**
- 内容类型：资讯、教程、文档、博客、论坛、百科
- 技术领域：前端、后端、AI、数据、设计、运维
- 行业分类：教育、商业、娱乐、工具、社交、媒体
- 功能特征：开发、学习、创作、管理、分析、协作

当我提供URL信息时，请以JSON格式返回：
{
  "title": "网站名称（简洁版）",
  "description": "一句话概括网站功能和特色（20-50字）",
  "tags": [
    {"name": "核心领域", "emoji": "适合的emoji"},
    {"name": "功能类型", "emoji": "适合的emoji"},
    {"name": "目标用户", "emoji": "适合的emoji"}
  ]
}

**示例：**
输入：GitHub相关信息
输出：
{
  "title": "GitHub",
  "description": "全球最大的代码托管和协作开发平台",
  "tags": [
    {"name": "开发", "emoji": "💻"},
    {"name": "协作", "emoji": "🤝"},
    {"name": "开源", "emoji": "🌍"}
  ]
}

**注意：**
- 避免"技术"、"工具"、"平台"等过于宽泛的词汇
- 同一回答中不要出现意思相近的标签
- 优先使用行业术语和专业词汇
- 确保标签具有区分度和概括性`

// 获取当前可用的AI提供商
function getAvailableProvider(): AIProvider | null {
  for (const provider of Object.values(AI_PROVIDERS)) {
    if (provider.apiKey) {
      return provider;
    }
  }
  return null;
}

// 获取网页内容
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // 简单提取标题和meta信息
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    
    let content = `URL: ${url}\n`;
    if (titleMatch) content += `标题: ${titleMatch[1]}\n`;
    if (descMatch) content += `描述: ${descMatch[1]}\n`;
    if (keywordsMatch) content += `关键词: ${keywordsMatch[1]}\n`;
    
    // 提取body中的文本内容（简化版）
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
      content += `内容摘要: ${bodyText}`;
    }
    
    return content;
  } catch (error) {
    console.error('获取URL内容失败:', error);
    return `URL: ${url}\n无法获取网页内容`;
  }
}

// 调用OpenAI API
async function callOpenAI(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.choices[0]?.message?.content;

  try {
    return JSON.parse(result);
  } catch {
    throw new Error('AI响应格式解析失败');
  }
}

// 调用DeepSeek API
async function callDeepSeek(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content }
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: {
        type: 'json_object'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.choices[0]?.message?.content;
  console.log(result)
  try {
    return JSON.parse(result);
  } catch {
    throw new Error('AI响应格式解析失败');
  }
}

// 调用Claude API
async function callClaude(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${SYSTEM_PROMPT}\n\n${content}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.content[0]?.text;
  
  try {
    return JSON.parse(result);
  } catch {
    throw new Error('AI响应格式解析失败');
  }
}

// 调用Gemini API
async function callGemini(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${content}`
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.candidates[0]?.content?.parts[0]?.text;
  
  try {
    return JSON.parse(result);
  } catch {
    throw new Error('AI响应格式解析失败');
  }
}

// 主要的URL解析函数
export async function analyzeUrl(url: string): Promise<LinkAnalysis> {
  const provider = getAvailableProvider();
  
  if (!provider) {
    throw new Error('没有可用的AI提供商，请检查环境变量中的API密钥配置');
  }

  try {
    // 获取网页内容
    const content = await fetchUrlContent(url);
    
    // 根据提供商调用相应的API
    switch (provider.name) {
      case 'OpenAI':
        return await callOpenAI(provider, content);
      case 'DeepSeek':
        return await callDeepSeek(provider, content);
      case 'Claude':
        return await callClaude(provider, content);
      case 'Gemini':
        return await callGemini(provider, content);
      default:
        throw new Error('不支持的AI提供商');
    }
  } catch (error) {
    console.error('URL分析失败:', error);
    
    // 返回基础信息作为备用方案
    const urlObj = new URL(url);
    return {
      title: urlObj.hostname,
      description: `来自 ${urlObj.hostname} 的链接`,
      tags: [{name: urlObj.hostname.split('.')[0], emoji: '🔗'}]
    };
  }
}

// 检查AI服务是否可用
export function isAIServiceAvailable(): boolean {
  return getAvailableProvider() !== null;
}

// 获取当前使用的AI提供商名称
export function getCurrentProvider(): string | null {
  const provider = getAvailableProvider();
  return provider ? provider.name : null;
} 