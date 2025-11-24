# 快速开始指南

## 5分钟上手请求库

### 第一步：初始化

在你的应用入口文件（如 `main.tsx` 或 `index.tsx`）中初始化请求库：

```tsx
import { setupRequest } from '@/request';

// 使用默认配置
setupRequest();

// 或者自定义配置
setupRequest({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  enableCache: true,
  enableRetry: true,
  retryCount: 3,
  enableParallel: true,
  maxParallel: 6,
});
```

### 第二步：发送请求

```tsx
import { get, post, put, del } from '@/request';

// GET 请求
const users = await get('/users');
const user = await get('/users/1');
const searchResults = await get('/users', { keyword: 'john' });

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

### 第三步：在 React 组件中使用

```tsx
import React, { useEffect, useState } from 'react';
import { get, post } from '@/request';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await get('/users');
      setUsers(data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const newUser = await post('/users', userData);
      setUsers([...users, newUser]);
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 高级功能

### 1. 使用缓存（避免重复请求）

```tsx
import { createCacheRequestor, inject } from '@/request';
import { axiosRequestor } from '@/request/implementations';

// 初始化
inject(axiosRequestor);

// 创建缓存请求器
const cachedReq = createCacheRequestor({
  duration: 1000 * 60 * 5, // 缓存5分钟
});

// 使用
const data1 = await cachedReq.get('/api/config'); // 发送请求
const data2 = await cachedReq.get('/api/config'); // 使用缓存
```

### 2. 自动重试（网络不稳定时）

```tsx
import { createRetryRequestor, inject } from '@/request';
import { axiosRequestor } from '@/request/implementations';

inject(axiosRequestor);

const retryReq = createRetryRequestor({
  maxCount: 3, // 最多重试3次
  delay: 1000, // 每次延迟1秒
});

// 失败时会自动重试
const data = await retryReq.get('/api/users');
```

### 3. 防止重复提交（支付、下单等）

```tsx
import { createIdempotentRequestor, inject } from '@/request';
import { axiosRequestor } from '@/request/implementations';

inject(axiosRequestor);

const idempotentReq = createIdempotentRequestor();

// 即使多次点击，也只会提交一次
const handlePay = async () => {
  const order = await idempotentReq.post('/api/orders', {
    productId: 1,
    amount: 99.99,
  });
};
```

### 4. 并发控制（批量请求）

```tsx
import { createParallelRequestor, inject } from '@/request';
import { axiosRequestor } from '@/request/implementations';

inject(axiosRequestor);

const parallelReq = createParallelRequestor({
  maxCount: 4, // 最多同时4个请求
});

// 批量请求，自动控制并发
const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const promises = userIds.map(id => 
  parallelReq.get(`/api/users/${id}`)
);
const results = await Promise.all(promises);
```

## 使用 React Hooks

创建自定义 Hook 简化使用：

```tsx
// hooks/useRequest.ts
import { useState, useEffect } from 'react';
import { get } from '@/request';

export function useGet<T>(url: string, params?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await get<T>(url, params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url, JSON.stringify(params)]);

  return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
  const { data: user, loading, error } = useGet(`/users/${userId}`);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  
  return <div>{user?.name}</div>;
}
```

## 常见问题

### Q: 如何设置全局请求头（如 Token）？

A: 在业务层的拦截器中自动处理，Token 会从 localStorage 读取：

```tsx
// 登录后保存 token
localStorage.setItem('token', 'your-token');

// 之后的所有请求都会自动带上 Authorization 头
const data = await get('/api/protected-resource');
```

### Q: 如何处理错误？

A: 使用 try-catch：

```tsx
try {
  const data = await get('/api/users');
} catch (error) {
  if (error.response) {
    // 服务器返回错误
    console.error('状态码:', error.response.status);
    console.error('错误信息:', error.response.data);
  } else {
    // 网络错误
    console.error('网络错误:', error.message);
  }
}
```

### Q: 如何取消请求？

A: 当前版本暂不支持，将在 v1.1.0 中添加。

### Q: 如何上传文件？

A: 使用 FormData：

```tsx
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'avatar');

const result = await post('/api/upload', formData);
```

## 下一步

- 查看 [完整文档](./README.md)
- 查看 [使用示例](./examples/)
- 查看 [更新日志](./CHANGELOG.md)

## 需要帮助？

如有问题，请联系开发团队或查看项目文档。
