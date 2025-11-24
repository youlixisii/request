import type { CacheStore } from '../types';

interface StorageItem<T> {
  value: T;
  expireTime?: number;
}

/**
 * 持久化缓存存储（基于 localStorage）
 */
export class StorageStore implements CacheStore {
  private prefix: string;

  constructor(prefix = 'request_cache_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async has(key: string): Promise<boolean> {
    try {
      const storageKey = this.getKey(key);
      const itemStr = localStorage.getItem(storageKey);
      
      if (!itemStr) {
        return false;
      }

      const item: StorageItem<any> = JSON.parse(itemStr);
      
      // 检查是否过期
      if (item.expireTime && Date.now() > item.expireTime) {
        localStorage.removeItem(storageKey);
        return false;
      }

      return true;
    } catch (error) {
      console.error('StorageStore.has error:', error);
      return false;
    }
  }

  async set<T>(key: string, value: T, expireTime?: number): Promise<void> {
    try {
      const storageKey = this.getKey(key);
      const item: StorageItem<T> = {
        value,
        expireTime: expireTime ? Date.now() + expireTime : undefined,
      };
      localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.error('StorageStore.set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!(await this.has(key))) {
        return null;
      }

      const storageKey = this.getKey(key);
      const itemStr = localStorage.getItem(storageKey);
      
      if (!itemStr) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(itemStr);
      return item.value;
    } catch (error) {
      console.error('StorageStore.get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('StorageStore.delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('StorageStore.clear error:', error);
    }
  }
}

/**
 * 创建持久化存储实例
 */
export function createStorageStore(prefix?: string): CacheStore {
  return new StorageStore(prefix);
}
