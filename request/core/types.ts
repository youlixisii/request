/**
 * 请求配置选项，请求的一些辅助选项
 */
export interface RequestOptions {
  //?代表可选
  //请求头
  headers?: Record<string, string>; //一个 对象，键是字符串，值是字符串
  //查询参数
  params?: Record<string, any>;
  //超时时间
  timeout?: number;
  [key: string]: any; //键是字符串，值可以是任意类型
}

/**
 * 请求配置，这是完整的请求配置
 */
export interface RequestConfig extends RequestOptions {
  url: string; //（必填） → 请求的地址
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; //（必填） → 请求方法
  data?: any; //可选） → 请求体（POST/PUT/PATCH 使用）
}

/**
 * 响应数据
 */
export interface Response<T = any> {
  data: T; //实际返回的数据
  //HTTP 状态
  status: number;
  statusText: string;
  //响应头信息
  headers: Record<string, string>;
  //请求配置，方便追踪
  config: RequestConfig;
  //提供一个简化对象，不带方法，方便存缓存或者序列化
  toPlain(): any;
}

/**
 * 请求器接口
 */
// 它规定了你的请求器应该具备哪些方法：get/post/put/delete/patch/request
// on/off/emit：事件系统，方便监听请求生命周期，比如：开始请求 / 请求结束 / 错误
// 你之前看到的 proxyRequestor、useRequestor() 都是实现这个接口的对象

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
//缓存存储的接口，支持读写删清
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
  key?: (config: RequestConfig) => string; //生成缓存 key 的函数
  persist?: boolean; //是否持久化
  duration?: number; //有效期
  isValid?: (key: string, config: RequestConfig) => boolean | Promise<boolean>; //判断缓存是否有效
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
  //genKey 是一个属性名 // ? 表示可选，可以传，也可以不传 // 它的类型是一个函数类型（function type）
  //输入参数，名字叫 config，类型是 RequestConfig
  // => string → 返回值类型是字符串
  genKey?: (config: RequestConfig) => string;
}
