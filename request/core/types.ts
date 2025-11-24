/**
 * 请求配置选项
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  [key: string]: any;
}

/**
 * 请求配置
 */
export interface RequestConfig extends RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
}

/**
 * 响应数据
 */
export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  toPlain(): any;
}

/**
 * 请求器接口
 */
export interface Requestor {
  get<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  delete<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  request<T = any>(config: RequestConfig): Promise<Response<T>>;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, ...args: any[]): void;
}

/**
 * 事件处理器类型
 */
export type EventHandler = (...args: any[]) => void | Promise<void>;

/**
 * 缓存存储接口
 */
export interface CacheStore {
  has(key: string): Promise<boolean>;
  set<T>(key: string, value: T, expireTime?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  key?: (config: RequestConfig) => string;
  persist?: boolean;
  duration?: number;
  isValid?: (key: string, config: RequestConfig) => boolean | Promise<boolean>;
}

/**
 * 重试配置选项
 */
export interface RetryOptions {
  maxCount?: number;
  delay?: number;
  shouldRetry?: (error: any, count: number) => boolean;
}

/**
 * 并发配置选项
 */
export interface ParallelOptions {
  maxCount?: number;
}

/**
 * 幂等配置选项
 */
export interface IdempotentOptions {
  genKey?: (config: RequestConfig) => string;
}
