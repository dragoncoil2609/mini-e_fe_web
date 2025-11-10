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
  async getById(id: number): Promise<ShopItem> {
    const res = await api.get(`/shops/${id}`);
    return res.data.data;
  },
};


