import type { CacheStore } from '../types';

interface CacheItem<T> {
  value: T;
  expireTime?: number;
}

/**
 * 内存缓存存储
 */
export class MemoryStore implements CacheStore {
  private cache: Map<string, CacheItem<any>> = new Map();

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

  async set<T>(key: string, value: T, expireTime?: number): Promise<void> {
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
 */
export function createMemoryStore(): CacheStore {
  return new MemoryStore();
}
