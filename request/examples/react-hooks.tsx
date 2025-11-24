/**
 * React Hooks 集成示例
 */

import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../index';

/**
 * 通用请求 Hook
 */
export function useRequest<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * GET 请求 Hook
 */
export function useGet<T>(url: string, params?: any) {
  return useRequest<T>(() => get<T>(url, params), [url, JSON.stringify(params)]);
}

/**
 * POST 请求 Hook（手动触发）
 */
export function usePost<T, D = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (postData: D) => {
      setLoading(true);
      setError(null);
      try {
        const result = await post<T>(url, postData);
        setData(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { data, loading, error, execute };
}

/**
 * 使用示例组件
 */

// 示例1：获取用户列表
export function UserListExample() {
  const { data: users, loading, error, refetch } = useGet<any[]>('/api/users');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>刷新</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

// 示例2：创建用户
export function CreateUserExample() {
  const { data, loading, error, execute } = usePost<any>('/api/users');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await execute({ name, email });
      alert('用户创建成功！');
      setName('');
      setEmail('');
    } catch (err) {
      alert('创建失败');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <button type="submit" disabled={loading}>
        {loading ? '提交中...' : '创建用户'}
      </button>
      {error && <div>错误: {error.message}</div>}
      {data && <div>创建成功: {JSON.stringify(data)}</div>}
    </form>
  );
}

// 示例3：带缓存的数据获取
export function CachedDataExample() {
  const { data, loading, error } = useGet<any>('/api/config');

  // 这个请求会被缓存，多次访问该组件不会重复请求

  if (loading) return <div>加载配置中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <h3>系统配置</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
