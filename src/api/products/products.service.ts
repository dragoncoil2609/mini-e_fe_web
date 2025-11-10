import api from '../index';

export interface CreateProductInput {
  title: string;
  price: number;
  description?: string;
  stock?: number;
  images?: File[];
}

export interface ProductItem {
  id: number;
  title: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
}

export const productsApi = {
  async create(data: CreateProductInput): Promise<ProductItem> {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('price', String(data.price));
    if (data.description) fd.append('description', data.description);
    if (data.stock !== undefined) fd.append('stock', String(data.stock));
    (data.images || []).forEach((f) => fd.append('images', f));

    const res = await api.post('/products', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};


