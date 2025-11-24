import type { Requestor } from './types';

/**
 * 全局请求器实例
 */
let globalRequestor: Requestor | null = null;

/**
 * 注入请求器实现
 */
export function inject(requestor: Requestor): void {
  globalRequestor = requestor;
}

/**
 * 获取请求器实例
 */
export function useRequestor(): Requestor {
  if (!globalRequestor) {
    throw new Error('Requestor not injected. Please call inject() first.');
  }
  return globalRequestor;
}

/**
 * 检查是否已注入请求器
 */
export function hasRequestor(): boolean {
  return globalRequestor !== null;
}
