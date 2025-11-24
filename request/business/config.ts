/**
 * 业务配置
 */
export const businessConfig = {
  // API 基础路径
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  
  // 超时时间
  timeout: 30000,
  
  // 是否启用请求缓存
  enableCache: true,
  
  // 是否启用请求重试
  enableRetry: true,
  
  // 重试次数
  retryCount: 3,
  
  // 是否启用并发控制
  enableParallel: true,
  
  // 最大并发数
  maxParallel: 6,
};

/**
 * 响应码定义
 */
export enum ResponseCode {
  SUCCESS = 0,
  ERROR = -1,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

/**
 * 业务响应格式
 */
export interface BusinessResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}
