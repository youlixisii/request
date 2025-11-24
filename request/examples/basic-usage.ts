/**
 * 基础使用示例
 */

import { setupRequest, get, post, put, del } from '../index';

// 1. 初始化请求库
export function initRequest() {
  setupRequest({
    baseURL: '/api',
    timeout: 30000,
    enableCache: true,
    enableRetry: true,
    retryCount: 3,
    enableParallel: true,
    maxParallel: 6,
  });
}

// 2. 定义数据类型
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

// 3. 封装 API 方法
export const userApi = {
  // 获取用户列表
  async getUsers(params?: { page?: number; size?: number }): Promise<User[]> {
    return get<User[]>('/users', params);
  },

  // 获取单个用户
  async getUser(id: number): Promise<User> {
    return get<User>(`/users/${id}`);
  },

  // 创建用户
  async createUser(data: CreateUserDto): Promise<User> {
    return post<User>('/users', data);
  },

  // 更新用户
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return put<User>(`/users/${id}`, data);
  },

  // 删除用户
  async deleteUser(id: number): Promise<void> {
    return del<void>(`/users/${id}`);
  },
};

// 4. 使用示例
export async function exampleUsage() {
  try {
    // 获取用户列表
    const users = await userApi.getUsers({ page: 1, size: 10 });
    console.log('用户列表:', users);

    // 创建新用户
    const newUser = await userApi.createUser({
      name: 'John Doe',
      email: 'john@example.com',
    });
    console.log('新用户:', newUser);

    // 更新用户
    const updatedUser = await userApi.updateUser(newUser.id, {
      name: 'Jane Doe',
    });
    console.log('更新后的用户:', updatedUser);

    // 删除用户
    await userApi.deleteUser(newUser.id);
    console.log('用户已删除');
  } catch (error) {
    console.error('请求失败:', error);
  }
}
