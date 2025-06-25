// 测试获取网站favicon的功能
const fetch = require('node-fetch');

async function getFaviconAsBase64(url) {
  try {
    // 尝试多个可能的favicon路径
    const faviconUrls = [
      `${new URL(url).origin}/favicon.ico`,
      `${new URL(url).origin}/favicon.png`,
      `${new URL(url).origin}/apple-touch-icon.png`,
      `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
    ];
    
    for (const faviconUrl of faviconUrls) {
      try {
        console.log(`尝试获取: ${faviconUrl}`);
        const response = await fetch(faviconUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/x-icon';
          const result = `data:${mimeType};base64,${base64}`;
          console.log(`✅ 成功获取，长度: ${result.length} 字符`);
          return result;
        }
      } catch (error) {
        console.log(`❌ 失败: ${error.message}`);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取favicon失败:', error);
    return null;
  }
}

// 测试几个网站
async function testFavicons() {
  const testUrls = [
    'https://www.baidu.com/',
    'https://github.com/',
    'https://www.bilibili.com/',
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔄 测试: ${url}`);
    const favicon = await getFaviconAsBase64(url);
    if (favicon) {
      console.log(`✅ 成功获取 ${url} 的favicon`);
      console.log(`   类型: ${favicon.split(';')[0]}`);
      console.log(`   大小: ${Math.round(favicon.length / 1024 * 100) / 100} KB`);
    } else {
      console.log(`❌ 无法获取 ${url} 的favicon`);
    }
  }
}

testFavicons().catch(console.error); 