import api from '../index';

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number };
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt?: string;
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  birthday?: string | null;
  avatarUrl?: string | null;
}

export const usersApi = {
  async getMe(): Promise<UserItem> {
    const res = await api.get('/users/me');
    return res.data.data;
  },
  async getById(id: number): Promise<UserItem> {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },
  async updateMe(data: Partial<Omit<UserItem, 'id' | 'role' | 'isVerified' | 'createdAt'>>): Promise<UserItem> {
    const res = await api.patch('/users/me', data);
    return res.data.data;
  },
  async getAll(params?: { page?: number; limit?: number; q?: string }): Promise<Paginated<UserItem>> {
    const res = await api.get('/users', { params });
    return res.data.data;
  },
};


