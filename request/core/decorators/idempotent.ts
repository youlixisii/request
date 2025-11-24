import type { Requestor, IdempotentOptions, RequestConfig } from '../types';
import { createCacheRequestor } from './cache';
import { hashRequest } from '../utils/hash';

/**
 * 创建幂等请求器
 * 幂等请求器确保相同的请求不会重复发送
 */
export function createIdempotentRequestor(options?: IdempotentOptions): Requestor {
  const genKey = options?.genKey;
  
  return createCacheRequestor({
    key: (config: RequestConfig) => genKey ? genKey(config) : hashRequest(config),
    persist: false,
    duration: 1000 * 60, // 默认1分钟内的相同请求视为重复
  });
}
