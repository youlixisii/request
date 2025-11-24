import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Requestor, RequestOptions, RequestConfig, Response, EventHandler } from '../core/types';

/**
 * 事件发射器
 * 给你的请求系统加上「钩子」能力，让外部可以监听一些事件
 */
class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }
}

/**
 * 将 Axios 响应转换为标准响应格式
 */
function transformResponse<T>(axiosResponse: AxiosResponse<T>, config: RequestConfig): Response<T> {
  return {
    data: axiosResponse.data,
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: axiosResponse.headers as Record<string, string>,
    config,
    toPlain() {
      return {
        data: this.data,
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      };
    },
  };
}

/**
 * 将标准请求配置转换为 Axios 配置
 */
function toAxiosConfig(config: RequestConfig): AxiosRequestConfig {
  return {
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
    headers: config.headers,
    timeout: config.timeout,
    ...config,
  };
}

/**
 * 创建基于 Axios 的请求器
 */
export function createAxiosRequestor(axiosConfig?: AxiosRequestConfig): Requestor {
  const instance: AxiosInstance = axios.create(axiosConfig);
  const emitter = new EventEmitter();

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      emitter.emit('beforeRequest', config);
      return config;
    },
    (error) => {
      emitter.emit('requestError', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      emitter.emit('response', response);
      emitter.emit('responseBody', response.config, response);
      return response;
    },
    (error) => {
      emitter.emit('responseError', error);
      return Promise.reject(error);
    }
  );

  const requestor: Requestor = {
    async get<T = any>(url: string, options?: RequestOptions): Promise<Response<T>> {
      return this.request<T>({ url, method: 'GET', ...options });
    },

    async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>> {
      return this.request<T>({ url, method: 'POST', data, ...options });
    },

    async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>> {
      return this.request<T>({ url, method: 'PUT', data, ...options });
    },

    async delete<T = any>(url: string, options?: RequestOptions): Promise<Response<T>> {
      return this.request<T>({ url, method: 'DELETE', ...options });
    },

    async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>> {
      return this.request<T>({ url, method: 'PATCH', data, ...options });
    },

    async request<T = any>(config: RequestConfig): Promise<Response<T>> {
      try {
        const axiosConfig = toAxiosConfig(config);
        const axiosResponse = await instance.request<T>(axiosConfig);
        return transformResponse(axiosResponse, config);
      } catch (error: any) {
        // 转换 Axios 错误
        if (error.response) {
          const response = transformResponse(error.response, config);
          const enhancedError = new Error(error.message);
          (enhancedError as any).response = response;
          (enhancedError as any).config = config;
          throw enhancedError;
        }
        throw error;
      }
    },

    on(event: string, handler: EventHandler): void {
      emitter.on(event, handler);
    },

    off(event: string, handler: EventHandler): void {
      emitter.off(event, handler);
    },

    emit(event: string, ...args: any[]): void {
      emitter.emit(event, ...args);
    },
  };

  return requestor;
}

/**
 * 默认的 Axios 请求器实例
 */
export const axiosRequestor = createAxiosRequestor({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
