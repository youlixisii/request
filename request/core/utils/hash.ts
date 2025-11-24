import type { RequestConfig } from '../types';

/**
 * 简单的字符串哈希函数
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 对请求配置进行哈希
 */
export function hashRequest(config: RequestConfig): string {
  const parts: string[] = [];
  
  // 添加 URL
  parts.push(config.url);
  
  // 添加方法
  parts.push(config.method);
  
  // 添加请求头
  if (config.headers) {
    const sortedHeaders = Object.keys(config.headers).sort();
    for (const key of sortedHeaders) {
      parts.push(`${key}:${config.headers[key]}`);
    }
  }
  
  // 添加请求体
  if (config.data) {
    try {
      parts.push(JSON.stringify(config.data));
    } catch (error) {
      parts.push(String(config.data));
    }
  }
  
  // 添加查询参数
  if (config.params) {
    try {
      parts.push(JSON.stringify(config.params));
    } catch (error) {
      parts.push(String(config.params));
    }
  }
  
  const combined = parts.join('|');
  return simpleHash(combined);
}

/**
 * 生成默认的缓存键
 */
export function generateCacheKey(config: RequestConfig): string {
  const url = new URL(config.url, window.location.origin);
  const pathname = url.pathname;
  const search = url.search;
  const method = config.method;
  
  return `${method}:${pathname}${search}`;
}
