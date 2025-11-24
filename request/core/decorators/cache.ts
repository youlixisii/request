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
  const store = useCacheStore(options.persist);   //创建一个缓存存储对象👉 可能是内存缓存，也有可能是 localStorage / 小程序 storage
  const req = useRequestor();   //这是原始的“真实请求器”👉 你可以理解成 axios 实例 或 fetch 包装器

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
    //这里 GET / POST / PUT / DELETE / PATCH 都是包装，最终都走：
    async request(config) {
      //先生成缓存 key
      const key = options.key(config);
      
      // 检查缓存是否存在
      const hasCache = await store.has(key); //判断是否有缓存
      if (hasCache) {
        const isValid = await options.isValid(key, config); //如果用户自定义了校验逻辑，判断缓存是否依然有效
        if (isValid) {
          const cachedData = await store.get<any>(key);
          if (cachedData) { //如果缓存可用 → 直接 return，不发请求
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

      // 无缓存：发送真正的请求
      const response = await req.request(config);
      
      //请求成功后，把结果写进缓存
      //config 不缓存（因为可能包含函数、循环引用等）。
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

      //最后返回响应
      return response;
    },
    //这部分完全转发给原始的 req
    // 说明这个 Requestor 有“事件模型”（比如请求开始、结束、错误）
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
