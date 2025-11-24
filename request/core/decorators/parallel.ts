import type { Requestor, ParallelOptions, RequestConfig } from '../types';
import { useRequestor } from '../requestor';

/**
 * 请求队列项
 * 队列中的每个请求
 */
interface QueueItem {
  config: RequestConfig;
  //对应 Promise 的回调，用于异步处理请求结果
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

/**
 * 标准化并发配置
 */
function normalizeParallelOptions(options?: ParallelOptions): Required<ParallelOptions> {
  return {
    maxCount: options?.maxCount ?? 4,
  };
}

/**
 * 创建并发控制的请求器
 */
export function createParallelRequestor(parallelOptions?: ParallelOptions): Requestor {
  const options = normalizeParallelOptions(parallelOptions);
  const req = useRequestor();
  
  let runningCount = 0; //保证同时运行的请求数量不会超过 maxCount
  const queue: QueueItem[] = []; //存储等待发送的请求

  /**
   * 执行队列中的下一个请求
   */
  async function processQueue(): Promise<void> {
    //队列为空或者并发已满 → 停止
    if (queue.length === 0 || runningCount >= options.maxCount) {
      return;
    }

    const item = queue.shift(); //取出队列头部请求
    if (!item) return;

    runningCount++; //标记开始执行

    try {
      const response = await req.request(item.config);
      item.resolve(response);
    } catch (error) {
      item.reject(error);
    } finally {
      runningCount--; //执行完毕
      processQueue(); // 递归处理下一个请求
    }
  }

  /**
   * 添加请求到队列
   */
  function enqueue(config: RequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      queue.push({ config, resolve, reject });
      processQueue();
    });
  }

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
      return enqueue(config);
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
