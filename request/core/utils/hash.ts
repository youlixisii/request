// 把一个请求的配置（url、method、headers、data、params）变成一个“可作为缓存 key 的字符串”

import type { RequestConfig } from '../types';

/**
 * 简单的字符串哈希函数
 * 把长字符串压缩成一个短且较稳定的 key。
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);   //取字符的 Unicode 编码
    hash = (hash << 5) - hash + char;   //常见的哈希公式：hash * 31 + char
    hash = hash & hash; // Convert to 32bit integer
  }
  //变成正整数 → 再转成 36 进制字符串（更短，例如“3f4a1”）
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
  //headers（按字典序排序，保证顺序一致）
  if (config.headers) {
    const sortedHeaders = Object.keys(config.headers).sort();
    //使用 key:value 的形式加入 parts
    for (const key of sortedHeaders) {
      parts.push(`${key}:${config.headers[key]}`);
    }
  }
  
  // 添加请求体
  if (config.data) {
    try {
      //尝试序列化请求体
      parts.push(JSON.stringify(config.data));
    } catch (error) {
      //如果请求体里有循环引用，JSON.stringify 会报错 → fallback 用 String()
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
  
  //组合所有 parts
  const combined = parts.join('|');
  return simpleHash(combined);
}

/**
 * 生成默认的缓存键
 * 简单版 key，只用 method + 路径
 */
//传给函数的参数必须是一个 RequestConfig 类型对象
export function generateCacheKey(config: RequestConfig): string {
  const url = new URL(config.url, window.location.origin); //允许 config.url 是相对路径
  const pathname = url.pathname; //例如 /api/user
  const search = url.search; //例如 ?page=1
  const method = config.method;  //例如 GET
  
  //最终返回：GET:/api/user?page=1
  return `${method}:${pathname}${search}`;
}
