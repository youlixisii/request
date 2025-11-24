import type { CacheStore } from '../types';

//每一条缓存的数据结构
interface CacheItem<T> {
  value: T; //实际缓存的数据
  expireTime?: number; //过期时间（时间戳，毫秒）
}

/**
 * 内存缓存存储
 */
export class MemoryStore implements CacheStore {
  //用 Map 存储缓存，键是缓存 key，值是 CacheItem
  private cache: Map<string, CacheItem<any>> = new Map();

  //async 的作用是把这个函数 自动包装成 Promise
  // 即使函数内部没有 await，它依然会返回一个 Promise 对象
  //示这个函数返回一个 异步操作的结果
  // Promise<boolean> → 最终 resolve 的值是布尔值（true/false）
  
  async has(key: string): Promise<boolean> {
    if (!this.cache.has(key)) {
      return false;
    }

    const item = this.cache.get(key)!;
    
    // 检查是否过期
    if (item.expireTime && Date.now() > item.expireTime) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  //<T>表示这个函数可以接受任意类型的数据，类型在调用时确定
  //expireTime 可选，如果传了就计算未来过期时间 Date.now() + expireTime
  async set<T>(key: string, value: T, expireTime?: number): Promise<void> {
    //把数据存到 cache Map 中
    this.cache.set(key, {
      value,
      expireTime: expireTime ? Date.now() + expireTime : undefined,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!(await this.has(key))) {
      return null;
    }

    const item = this.cache.get(key)!;
    return item.value as T;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * 创建内存存储实例
 * 工厂函数，返回一个新的 MemoryStore 实例
 */
export function createMemoryStore(): CacheStore {
  return new MemoryStore();
}
