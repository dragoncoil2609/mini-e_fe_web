import api from '../index';

export interface CreateShopDto {
  name: string;
  email: string;
  description: string;
  logoUrl?: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description?: string;
  address?: string;
  logoUrl?: string;
  ownerId: number;
  createdAt?: string;
}

export const shopsApi = {
  async create(data: CreateShopDto): Promise<ShopItem> {
    const res = await api.post('/shops/register', data);
    return res.data.data;
  },
  async getMine(): Promise<ShopItem | null> {
    const res = await api.get('/shops/me');
    return res.data.data || null;
  },
  async getById(id: number): Promise<ShopItem> {
    const res = await api.get(`/shops/${id}`);
    return res.data.data;
  },
  async checkName(name: string): Promise<{ exists: boolean }> {
    const res = await api.get('/shops/check-name', { params: { name } });
    return res.data.data;
  },
};


