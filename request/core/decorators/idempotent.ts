import type { Requestor, IdempotentOptions, RequestConfig } from '../types';
import { createCacheRequestor } from './cache';
import { hashRequest } from '../utils/hash';

/**
 * 创建幂等请求器
 * 幂等请求器确保相同的请求不会重复发送
 * 核心思路：把幂等请求变成“缓存请求”，短时间内重复请求不会再次发送
 */
export function createIdempotentRequestor(options?: IdempotentOptions): Requestor {
  const genKey = options?.genKey;
  
  return createCacheRequestor({
    //如果用户提供了 genKey，就用它
    // 否则用 hashRequest(config) 根据请求内容生成 hash

    key: (config: RequestConfig) => genKey ? genKey(config) : hashRequest(config),
    persist: false,
    duration: 1000 * 60, // 1 分钟内相同 key 的请求直接返回缓存结果
  });
}
