// AI服务模块 - 用于智能解析URL链接

interface LinkAnalysis {
  title: string;
  description: string;
  tags: Array<{ name: string; emoji: string }>;
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
    name: "OpenAI",
    apiKey: process.env.OPENAI_API_KEY || "",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-3.5-turbo",
  },
  deepseek: {
    name: "DeepSeek",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
  },
  claude: {
    name: "Claude",
    apiKey: process.env.CLAUDE_API_KEY || "",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-sonnet-20240229",
  },
  gemini: {
    name: "Gemini",
    apiKey: process.env.GEMINI_API_KEY || "",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    model: "gemini-pro",
  },
} as const;

// 预设提示词
const SYSTEM_PROMPT = `
# Role: 网站内容分析师

## Profile
- language: 中文
- description: 专业分析网站内容并生成精准中文描述信息的专家，擅长提炼核心特征和标签分类
- background: 具有多年网站内容分析和SEO优化经验，熟悉各类网站结构和内容特征
- personality: 严谨、精准、高效、注重细节
- expertise: 网站内容分析、标签分类、信息提炼、语义概括
- target_audience: 网站运营者、SEO优化师、内容创作者、产品经理

## Skills

1. 内容分析技能
   - 网站特征识别: 快速识别网站的核心功能和特色
   - 语义概括: 用简洁语言准确描述网站内容
   - 标签分类: 基于标准分类体系进行精准标签匹配
   - 去重优化: 避免相似标签重复，确保标签独特性

2. 技术处理技能
   - JSON格式化: 严格按照指定格式输出结构化数据
   - 长度控制: 精确控制描述文字在20-50字范围内
   - Emoji匹配: 为每个标签匹配合适的表情符号
   - 术语标准化: 使用行业专业术语，避免宽泛词汇

## Rules

1. 内容质量原则：
   - 准确性: 所有描述必须基于网站实际内容，准确反映网站特征
   - 简洁性: 描述文字精炼，标签数量严格控制在3-5个
   - 专业性: 优先使用行业术语，避免通用宽泛词汇
   - 区分度: 确保每个标签具有明确的区分度和代表性

2. 格式规范准则：
   - 语言要求: 必须使用中文进行所有分析和输出
   - 结构要求: 严格按照JSON格式输出，包含title、description、tags三个字段
   - 标签规范: tags数组包含name和emoji两个属性，emoji必须与标签内容匹配
   - 长度限制: description字段严格控制在20-50个汉字

3. 处理限制条件：
   - 标签数量: 每个网站最多3个标签，最少1个标签
   - 分类参考: 必须从提供的分类参考中选择最匹配的标签
   - 避免重复: 同一回答中不能出现意思相近的标签
   - 泛化要求: 标签要具有泛化特征，覆盖网站核心领域而非具体功能

## Workflows

- 目标: 为输入的URL生成精准的中文网站描述信息
- 步骤 1: 分析网站内容，识别核心功能和特色特征
- 步骤 2: 基于分类参考体系，选择3-5个最具代表性的标签
- 步骤 3: 生成20-50字的简洁描述，并匹配合适的emoji
- 步骤 4: 按照指定JSON格式输出分析结果
- 预期结果: 获得准确、简洁、专业的网站描述信息和标签分类

## Initialization
作为网站内容分析师，你必须遵守上述Rules，按照Workflows执行任务。
`;

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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // 简单提取标题和meta信息
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    const keywordsMatch = html.match(
      /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i
    );

    let content = `URL: ${url}\n`;
    if (titleMatch) content += `标题: ${titleMatch[1]}\n`;
    if (descMatch) content += `描述: ${descMatch[1]}\n`;
    if (keywordsMatch) content += `关键词: ${keywordsMatch[1]}\n`;

    // 提取body中的文本内容（简化版）
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 500);
      content += `内容摘要: ${bodyText}`;
    }

    return content;
  } catch (error) {
    console.error("获取URL内容失败:", error);
    return `URL: ${url}\n无法获取网页内容`;
  }
}

// 调用OpenAI API
async function callOpenAI(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.choices[0]?.message?.content;

  try {
    return JSON.parse(result);
  } catch {
    throw new Error("AI响应格式解析失败");
  }
}

// 调用DeepSeek API
async function callDeepSeek(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.choices[0]?.message?.content;
  console.log(result);
  try {
    return JSON.parse(result);
  } catch {
    throw new Error("AI响应格式解析失败");
  }
}

// 调用Claude API
async function callClaude(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPT}\n\n${content}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.content[0]?.text;

  try {
    return JSON.parse(result);
  } catch {
    throw new Error("AI响应格式解析失败");
  }
}

// 调用Gemini API
async function callGemini(provider: AIProvider, content: string): Promise<LinkAnalysis> {
  const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${content}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API调用失败: ${response.status}`);
  }

  const data = await response.json();
  const result = data.candidates[0]?.content?.parts[0]?.text;

  try {
    return JSON.parse(result);
  } catch {
    throw new Error("AI响应格式解析失败");
  }
}

// 主要的URL解析函数
export async function analyzeUrl(url: string): Promise<LinkAnalysis> {
  const provider = getAvailableProvider();

  if (!provider) {
    throw new Error("没有可用的AI提供商，请检查环境变量中的API密钥配置");
  }

  try {
    // 获取网页内容
    const content = await fetchUrlContent(url);

    // 根据提供商调用相应的API
    switch (provider.name) {
      case "OpenAI":
        return await callOpenAI(provider, content);
      case "DeepSeek":
        return await callDeepSeek(provider, content);
      case "Claude":
        return await callClaude(provider, content);
      case "Gemini":
        return await callGemini(provider, content);
      default:
        throw new Error("不支持的AI提供商");
    }
  } catch (error) {
    console.error("URL分析失败:", error);

    // 返回基础信息作为备用方案
    const urlObj = new URL(url);
    return {
      title: urlObj.hostname,
      description: `来自 ${urlObj.hostname} 的链接`,
      tags: [{ name: urlObj.hostname.split(".")[0], emoji: "🔗" }],
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
