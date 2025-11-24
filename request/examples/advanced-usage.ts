/**
 * 高级功能使用示例
 */

import {
  inject,
  createCacheRequestor,
  createRetryRequestor,
  createParallelRequestor,
  createIdempotentRequestor,
} from '../index';
import { axiosRequestor } from '../implementations';

// 1. 请求缓存示例
export function cacheExample() {
  // 注入基础请求器
  inject(axiosRequestor);

  // 创建带缓存的请求器
  const cachedReq = createCacheRequestor({
    persist: false, // 内存缓存
    duration: 1000 * 60 * 5, // 5分钟
    key: (config) => `${config.method}:${config.url}`, // 自定义缓存键
    isValid: (_key, config) => {
      // 自定义缓存有效性检查
      // 例如：只缓存 GET 请求
      return config.method === 'GET';
    },
  });

  // 使用缓存请求器
  async function fetchData() {
    // 第一次请求会发送网络请求
    const data1 = await cachedReq.get('/api/users');
    console.log('第一次请求:', data1);

    // 第二次请求会使用缓存
    const data2 = await cachedReq.get('/api/users');
    console.log('第二次请求（使用缓存）:', data2);
  }

  return fetchData;
}

// 2. 请求重试示例
export function retryExample() {
  inject(axiosRequestor);

  // 创建带重试的请求器
  const retryReq = createRetryRequestor({
    maxCount: 3, // 最多重试3次
    delay: 1000, // 每次重试延迟1秒
    shouldRetry: (error, _count) => {
      // 只重试服务器错误（5xx）
      if (error.response) {
        const status = error.response.status;
        return status >= 500 && status < 600;
      }
      // 网络错误也重试
      return true;
    },
  });

  // 使用重试请求器
  async function fetchDataWithRetry() {
    try {
      const data = await retryReq.get('/api/unstable-endpoint');
      console.log('请求成功:', data);
    } catch (error) {
      console.error('请求失败（已重试3次）:', error);
    }
  }

  return fetchDataWithRetry;
}

// 3. 并发控制示例
export function parallelExample() {
  inject(axiosRequestor);

  // 创建并发控制的请求器
  const parallelReq = createParallelRequestor({
    maxCount: 4, // 最多同时4个请求
  });

  // 批量请求
  async function batchFetch() {
    const userIds = Array.from({ length: 20 }, (_, i) => i + 1);

    // 虽然有20个请求，但最多只会同时发送4个
    const promises = userIds.map((id) =>
      parallelReq.get(`/api/users/${id}`)
    );

    const results = await Promise.all(promises);
    console.log('批量请求结果:', results);
  }

  return batchFetch;
}

// 4. 请求幂等示例
export function idempotentExample() {
  inject(axiosRequestor);

  // 创建幂等请求器
  const idempotentReq = createIdempotentRequestor({
    genKey: (config) => {
      // 自定义幂等键生成规则
      // 对于 POST 请求，使用 URL + 请求体生成键
      if (config.data) {
        return `${config.method}:${config.url}:${JSON.stringify(config.data)}`;
      }
      return `${config.method}:${config.url}`;
    },
  });

  // 防止重复提交
  async function submitOrder() {
    const orderData = {
      productId: 1,
      quantity: 2,
      price: 99.99,
    };

    // 即使多次调用，相同的订单只会提交一次
    const order1 = await idempotentReq.post('/api/orders', orderData);
    console.log('第一次提交:', order1);

    // 这次会使用缓存结果，不会真正发送请求
    const order2 = await idempotentReq.post('/api/orders', orderData);
    console.log('第二次提交（使用缓存）:', order2);
  }

  return submitOrder;
}

// 5. 组合使用示例
export function combinedExample() {
  inject(axiosRequestor);

  // 先应用并发控制
  let req = createParallelRequestor({ maxCount: 4 });

  // 再应用重试机制
  inject(req);
  req = createRetryRequestor({ maxCount: 3 });

  // 最后应用缓存
  inject(req);
  req = createCacheRequestor({ duration: 1000 * 60 * 5 });

  // 现在这个请求器同时具有：并发控制、重试、缓存功能
  async function fetchWithAllFeatures() {
    const data = await req.get('/api/users');
    console.log('组合功能请求结果:', data);
  }

  return fetchWithAllFeatures;
}

// 6. 持久化缓存示例
export function persistCacheExample() {
  inject(axiosRequestor);

  // 创建持久化缓存的请求器
  const persistReq = createCacheRequestor({
    persist: true, // 使用 localStorage 持久化
    duration: 1000 * 60 * 60 * 24, // 缓存1天
  });

  // 使用持久化缓存
  async function fetchWithPersistCache() {
    // 即使刷新页面，缓存仍然有效
    const data = await persistReq.get('/api/config');
    console.log('配置数据:', data);
  }

  return fetchWithPersistCache;
}
