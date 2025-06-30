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
const SYSTEM_PROMPT = `你是一个互联网百事通，协助我生成网站的信息提取。
当我输入一个url，你应该以json的形式返回给我以下数据。
- 网站名称
- 网站描述
- 网站标签，每个标签带上emoj
保证以中文回答问题，回答格式限制为纯json，不要用markdown。
例如：
输入：https://www.v2ex.com/
输出：
{
"title": "V2EX",
"description": "V2EX 是一个创意工作者社区，分享和探索各种技术、生活、游戏、动漫等话题。",
 "tags": [
    {"name": "工具", "emoji": "🔧"},
    {"name": "技术", "emoji": "💻"},
    {"name": "教程", "emoji": "📚"}
  ],
}`

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