import type { CacheStore } from '../types';
import { createMemoryStore } from './memory-store';
import { createStorageStore } from './storage-store';

/**
 * 根据配置获取缓存存储实例
 */
export function useCacheStore(isPersist: boolean, prefix?: string): CacheStore {
  if (!isPersist) {
    return createMemoryStore();
  } else {
    return createStorageStore(prefix);
  }
}

export { createMemoryStore, createStorageStore };
export type { CacheStore };
