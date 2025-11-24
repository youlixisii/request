import type { Requestor } from '../core/types';
import {
  createCacheRequestor,
  createRetryRequestor,
  createParallelRequestor,
  createIdempotentRequestor,
} from '../core';
import { businessConfig } from './config';
import { requestInterceptor, responseInterceptor, errorInterceptor } from './interceptors';

/**
 * 业务请求器实例
 */
let businessRequestor: Requestor | null = null;

/**
 * 初始化业务请求器
 */
export function initBusinessRequestor(baseRequestor: Requestor): void {
  let requestor = baseRequestor;

  // 应用并发控制
  if (businessConfig.enableParallel) {
    requestor = createParallelRequestor({
      maxCount: businessConfig.maxParallel,
    });
  }

  // 应用重试机制
  if (businessConfig.enableRetry) {
    requestor = createRetryRequestor({
      maxCount: businessConfig.retryCount,
      delay: 1000,
    });
  }

  businessRequestor = requestor;
}

/**
 * 获取业务请求器
 */
export function getBusinessRequestor(): Requestor {
  if (!businessRequestor) {
    throw new Error('Business requestor not initialized. Please call initBusinessRequestor() first.');
  }
  return businessRequestor;
}

/**
 * 创建带缓存的请求器
 */
export function createCachedRequest(duration?: number): Requestor {
  return createCacheRequestor({
    persist: false,
    duration: duration || 1000 * 60 * 5, // 默认5分钟
  });
}

/**
 * 创建幂等请求器
 */
export function createIdempotentRequest(): Requestor {
  return createIdempotentRequestor();
}

/**
 * 通用请求方法
 */
export async function request<T = any>(
  config: Parameters<Requestor['request']>[0]
): Promise<T> {
  try {
    const requestor = getBusinessRequestor();
    
    // 应用请求拦截器
    const processedConfig = requestInterceptor(config);// 请求前加工
    
    // 发送请求
    const response = await requestor.request(processedConfig);// 真正请求
    
    // 应用响应拦截器
    return responseInterceptor<T>(response);// 处理返回值
  } catch (error) {
    return errorInterceptor(error);
  }
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    params,
  });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data,
  });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
    params,
  });
}

/**
 * PATCH 请求
 */
export function patch<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'PATCH',
    data,
  });
}
