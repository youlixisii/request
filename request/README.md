# 请求库文档

## 概述

这是一个基于分层架构设计的前端请求库，提供了丰富的上层功能，包括请求缓存、请求重试、请求幂等、请求并发控制等。

## 架构设计

```
┌─────────────────────────────────────┐
│         request-bus (业务层)         │
│   - 业务接口 API                      │
│   - 协议规范                          │
│   - 拦截器                            │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      request-core (核心层)           │
│   - 请求缓存                          │
│   - 请求重试                          │
│   - 请求幂等                          │
│   - 并发控制                          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   request-implementation (实现层)    │
│   - Axios 实现                        │
│   - Fetch 实现 (可扩展)               │
└─────────────────────────────────────┘
```

## 快速开始

### 1. 初始化

在应用入口文件中初始化请求库：

```ts
import { setupRequest } from '@/request';

// 使用默认配置初始化
setupRequest();

// 或者自定义配置
setupRequest({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  enableCache: true,
  enableRetry: true,
  retryCount: 3,
});
```

### 2. 发送请求

```ts
import { get, post, put, del } from '@/request';

// GET 请求
const users = await get('/users', { page: 1, size: 10 });

// POST 请求
const newUser = await post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT 请求
const updatedUser = await put('/users/1', {
  name: 'Jane Doe',
});

// DELETE 请求
await del('/users/1');
```

## 核心功能

### 1. 请求缓存

创建带缓存的请求，避免重复请求：

```ts
import { createCacheRequestor } from '@/request';

const cachedReq = createCacheRequestor({
  persist: false, // 是否持久化到 localStorage
  duration: 1000 * 60 * 5, // 缓存时间 5 分钟
  key: (config) => config.url, // 自定义缓存键
  isValid: (key, config) => true, // 自定义缓存有效性检查
});

// 第一次请求会发送网络请求
const data1 = await cachedReq.get('/api/users');

// 第二次请求会使用缓存
const data2 = await cachedReq.get('/api/users');
```

### 2. 请求重试

创建带重试功能的请求：

```ts
import { createRetryRequestor } from '@/request';

const retryReq = createRetryRequestor({
  maxCount: 3, // 最大重试次数
  delay: 1000, // 重试延迟（毫秒）
  shouldRetry: (error, count) => {
    // 自定义重试条件
    return error.response?.status >= 500;
  },
});

// 请求失败时会自动重试
const data = await retryReq.get('/api/users');
```

### 3. 请求幂等

创建幂等请求，防止重复提交：

```ts
import { createIdempotentRequestor } from '@/request';

const idempotentReq = createIdempotentRequestor({
  genKey: (config) => {
    // 自定义幂等键生成规则
    return `${config.method}:${config.url}`;
  },
});

// 相同的请求在短时间内只会发送一次
await idempotentReq.post('/api/orders', { productId: 1 });
await idempotentReq.post('/api/orders', { productId: 1 }); // 使用缓存结果
```

### 4. 并发控制

创建带并发控制的请求：

```ts
import { createParallelRequestor } from '@/request';

const parallelReq = createParallelRequestor({
  maxCount: 4, // 最大并发数
});

// 同时发送多个请求，但最多只有 4 个并发
const promises = Array.from({ length: 10 }, (_, i) =>
  parallelReq.get(`/api/users/${i}`)
);

const results = await Promise.all(promises);
```

## 业务层功能

### 1. 统一响应格式

业务层会自动处理统一的响应格式：

```ts
interface BusinessResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}
```

### 2. 自动错误处理

业务层会自动处理常见错误：

- `401` - 未授权，自动跳转登录页
- `403` - 无权限访问
- `404` - 资源不存在
- `500` - 服务器错误

### 3. 请求拦截器

自动添加通用请求头（如 Token）：

```ts
// 会自动从 localStorage 读取 token 并添加到请求头
const data = await get('/api/users');
```

## 扩展实现

### 添加 Fetch 实现

如果需要使用 Fetch API 替代 Axios：

```ts
// src/request/implementations/fetch-impl.ts
import type { Requestor } from '../core/types';

export function createFetchRequestor(): Requestor {
  return {
    async get(url, options) {
      const response = await fetch(url, {
        method: 'GET',
        ...options,
      });
      // 处理响应...
    },
    // 实现其他方法...
  };
}
```

然后在初始化时使用：

```ts
import { inject } from '@/request/core';
import { createFetchRequestor } from '@/request/implementations/fetch-impl';

const fetchRequestor = createFetchRequestor();
inject(fetchRequestor);
```

## API 参考

### 核心 API

- `inject(requestor)` - 注入请求器实现
- `useRequestor()` - 获取当前请求器实例
- `createCacheRequestor(options)` - 创建缓存请求器
- `createRetryRequestor(options)` - 创建重试请求器
- `createParallelRequestor(options)` - 创建并发控制请求器
- `createIdempotentRequestor(options)` - 创建幂等请求器

### 业务 API

- `setupRequest(config)` - 初始化请求库
- `get(url, params)` - GET 请求
- `post(url, data)` - POST 请求
- `put(url, data)` - PUT 请求
- `del(url, params)` - DELETE 请求
- `patch(url, data)` - PATCH 请求
- `request(config)` - 通用请求方法

## 最佳实践

1. **在应用入口初始化**：确保在应用启动时调用 `setupRequest()`
2. **使用缓存优化性能**：对于不常变化的数据使用缓存请求器
3. **合理设置重试策略**：只对幂等的 GET 请求和特定错误码启用重试
4. **控制并发数量**：避免同时发送过多请求导致浏览器卡顿
5. **使用幂等请求防止重复提交**：对于支付、下单等关键操作使用幂等请求器

## 许可证

MIT
