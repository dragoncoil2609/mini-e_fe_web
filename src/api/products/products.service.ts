import api from '../index';

export interface CreateProductInput {
  title: string;
  price: number;
  description?: string;
  stock?: number;
  slug?: string;
  images?: File[];
}

export interface ProductItem {
  id: number;
  title: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
  images?: Array<{ url: string }>;
  shop?: { name: string };
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price?: number | null;
  stock: number;
  imageId?: number | null;
  image?: { url: string } | null;
  value1?: string | null;
  value2?: string | null;
  value3?: string | null;
  value4?: string | null;
  value5?: string | null;
}

export interface UpdateVariantInput {
  price?: number;
  stock?: number;
  imageId?: number;
}

export const productsApi = {
  async getAll(page = 1, limit = 20): Promise<{ items: ProductItem[]; total: number; page: number; limit: number }> {
    const res = await api.get('/products', { params: { page, limit } });
    return res.data.data;
  },

  async create(data: CreateProductInput): Promise<ProductItem> {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('price', String(data.price));
    if (data.description) fd.append('description', data.description);
    if (data.stock !== undefined) fd.append('stock', String(data.stock));
    if (data.slug) fd.append('slug', data.slug);
    (data.images || []).forEach((f) => fd.append('images', f));

    const res = await api.post('/products', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async generateVariants(productId: number, options: VariantOption[], mode: 'replace' | 'add' = 'replace'): Promise<ProductVariant[]> {
    const res = await api.post(`/products/${productId}/variants/generate`, {
      options,
      mode,
    });
    return res.data.data;
  },

  async listVariants(productId: number): Promise<ProductVariant[]> {
    const res = await api.get(`/products/${productId}/variants`);
    return res.data.data;
  },

  async updateVariant(productId: number, variantId: number, data: UpdateVariantInput): Promise<ProductVariant> {
    const res = await api.patch(`/products/${productId}/variants/${variantId}`, data);
    return res.data.data;
  },
};


