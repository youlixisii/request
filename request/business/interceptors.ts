import type { RequestConfig, Response } from '../core/types';
import { ResponseCode, type BusinessResponse } from './config';

/**
 * 请求拦截器 - 添加通用请求头
 */
export function requestInterceptor(config: RequestConfig): RequestConfig {
  // 添加 token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // 添加时间戳（防止缓存）
  if (config.method === 'GET') {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }

  return config;
}

/**
 * 响应拦截器 - 处理业务响应
 */
export function responseInterceptor<T>(response: Response<BusinessResponse<T>>): T {
  const { data } = response;

  // 检查业务状态码
  if (data.code === ResponseCode.SUCCESS) {
    return data.data;
  }

  // 处理特殊错误码
  switch (data.code) {
    case ResponseCode.UNAUTHORIZED:
      // 未授权，跳转到登录页
      console.error('未授权，请重新登录');
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;
    case ResponseCode.FORBIDDEN:
      console.error('无权限访问');
      break;
    case ResponseCode.NOT_FOUND:
      console.error('请求的资源不存在');
      break;
    case ResponseCode.SERVER_ERROR:
      console.error('服务器错误');
      break;
    default:
      console.error(`请求失败: ${data.message}`);
  }

  // 抛出业务错误
  const error = new Error(data.message || '请求失败');
  (error as any).code = data.code;
  (error as any).response = response;
  throw error;
}

/**
 * 错误拦截器
 */
export function errorInterceptor(error: any): never {
  if (error.response) {
    // 服务器返回了错误响应
    const status = error.response.status;
    switch (status) {
      case 401:
        console.error('认证失败，请重新登录');
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        console.error('没有权限访问该资源');
        break;
      case 404:
        console.error('请求的资源不存在');
        break;
      case 500:
        console.error('服务器内部错误');
        break;
      default:
        console.error(`请求失败: ${error.message}`);
    }
  } else if (error.request) {
    // 请求已发送但没有收到响应
    console.error('网络错误，请检查网络连接');
  } else {
    // 其他错误
    console.error(`请求错误: ${error.message}`);
  }

  throw error;
}
