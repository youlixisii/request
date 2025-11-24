/**
 * 请求库入口文件
 * 
 * 使用示例：
 * 
 * ```ts
 * import { setupRequest, get, post } from '@/request';
 * 
 * // 初始化请求库
 * setupRequest();
 * 
 * // 发送请求
 * const data = await get('/api/users');
 * const result = await post('/api/users', { name: 'John' });
 * ```
 */

// 导出核心功能
export * from './core';

// 导出实现
export * from './implementations';

// 导出业务层
export * from './business';

// 导入依赖
import { inject } from './core';
import { axiosRequestor } from './implementations';
import { initBusinessRequestor, businessConfig } from './business';

/**
 * 初始化请求库
 */
export function setupRequest(config?: Partial<typeof businessConfig>): void {
  // 合并配置
  if (config) {
    Object.assign(businessConfig, config);
  }

  // 注入 axios 实现
  inject(axiosRequestor);

  // 初始化业务请求器
  initBusinessRequestor(axiosRequestor);

  console.log('Request library initialized successfully');
}
