import type { Requestor, CacheOptions } from '../types';
import { useRequestor } from '../requestor';
import { useCacheStore } from '../stores';
import { generateCacheKey } from '../utils/hash';

/**
 * 标准化缓存配置
 */
function normalizeCacheOptions(options?: CacheOptions): Required<CacheOptions> {
  return {
    key: options?.key || generateCacheKey,    //用来生成缓存 key（默认用 generateCacheKey 自动算）
    persist: options?.persist ?? false,   //是否持久化（比如保存在 localStorage / 小程序 storage）
    duration: options?.duration ?? 1000 * 60 * 5,   // 缓存有效期，默认5分钟
    isValid: options?.isValid || (() => true),    //判断缓存是否有效的函数（默认永远有效）
  };
}

/**
 * 创建带缓存的请求器
 */
export function createCacheRequestor(cacheOptions?: CacheOptions): Requestor {
  const options = normalizeCacheOptions(cacheOptions);
  const store = useCacheStore(options.persist);
  const req = useRequestor();

  // 创建一个代理请求器
  const proxyRequestor: Requestor = {
    async get(url, reqOptions) {
      return this.request({ url, method: 'GET', ...reqOptions });
    },
    async post(url, data, reqOptions) {
      return this.request({ url, method: 'POST', data, ...reqOptions });
    },
    async put(url, data, reqOptions) {
      return this.request({ url, method: 'PUT', data, ...reqOptions });
    },
    async delete(url, reqOptions) {
      return this.request({ url, method: 'DELETE', ...reqOptions });
    },
    async patch(url, data, reqOptions) {
      return this.request({ url, method: 'PATCH', data, ...reqOptions });
    },
    async request(config) {
      const key = options.key(config);
      
      // 检查缓存
      const hasCache = await store.has(key);
      if (hasCache) {
        const isValid = await options.isValid(key, config);
        if (isValid) {
          const cachedData = await store.get<any>(key);
          if (cachedData) {
            // 返回缓存的响应
            return {
              data: cachedData.data,
              status: cachedData.status,
              statusText: cachedData.statusText,
              headers: cachedData.headers,
              config,
              toPlain: () => cachedData,
            };
          }
        }
      }

      // 发送请求
      const response = await req.request(config);
      
      // 缓存响应
      await store.set(
        key,
        {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        },
        options.duration
      );

      return response;
    },
    on(event, handler) {
      req.on(event, handler);
    },
    off(event, handler) {
      req.off(event, handler);
    },
    emit(event, ...args) {
      req.emit(event, ...args);
    },
  };

  return proxyRequestor;
}
