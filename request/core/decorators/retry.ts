import type { Requestor, RetryOptions, RequestConfig } from '../types';
import { useRequestor } from '../requestor';

/**
 * 标准化重试配置
 */
function normalizeRetryOptions(options?: RetryOptions): Required<RetryOptions> {
  return {
    maxCount: options?.maxCount ?? 3, // 最大重试次数，默认3
    delay: options?.delay ?? 1000, // 每次重试延迟，默认1000ms

    // 判断是否要重试，默认规则：网络错误或 5xx 错误
    shouldRetry: options?.shouldRetry || ((error, count) => {
      // 默认只重试网络错误和5xx错误
      if (!error.response) return true; // // 网络错误就重试
      const status = error.response.status;
      return status >= 500 && status < 600; // 5xx错误重试
    }),
  };
}

/**
 * 延迟函数
 */
//返回一个 Promise，在 ms 毫秒后完成
// 用来在重试之间等待
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建带重试功能的请求器
 */
export function createRetryRequestor(retryOptions?: RetryOptions): Requestor {
  const options = normalizeRetryOptions(retryOptions);
  const req = useRequestor();

  // 创建一个代理请求器
  const proxyRequestor: Requestor = {
    async get(url, reqOptions) {
      return this.request({ url, method: 'GET', ...reqOptions });
    },
    async post(url, data, reqOptions) {
      return this.request({ url, method: 'POST', data, ...reqOptions });
    },
    async put(url, data, reqOptions) {
      return this.request({ url, method: 'PUT', data, ...reqOptions });
    },
    async delete(url, reqOptions) {
      return this.request({ url, method: 'DELETE', ...reqOptions });
    },
    async patch(url, data, reqOptions) {
      return this.request({ url, method: 'PATCH', data, ...reqOptions });
    },
    async request(config) {
      let lastError: any;
      let retryCount = 0;

      while (retryCount <= options.maxCount) {
        try {
          const response = await req.request(config);
          return response;
        } catch (error) {
          lastError = error;
          
          // 达到最大次数就停止
          if (retryCount >= options.maxCount) {
            break;
          }

          const shouldRetry = options.shouldRetry(error, retryCount);
          if (!shouldRetry) {// 不满足重试条件也停止
            break;
          }

          retryCount++;
          console.log(`Retrying request (${retryCount}/${options.maxCount})...`);
          
          // 延迟后重试
          await delay(options.delay * retryCount);
        }
      }

      throw lastError;// 所有重试失败，抛出最后一次错误
    },
    on(event, handler) {
      req.on(event, handler);
    },
    off(event, handler) {
      req.off(event, handler);
    },
    emit(event, ...args) {
      req.emit(event, ...args);
    },
  };

  return proxyRequestor;
}
