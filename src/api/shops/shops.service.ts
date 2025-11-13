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
    try {
      const res = await api.post('/shops', data);
      const shop = res.data.data;
      // Lưu shop id vào localStorage sau khi tạo thành công
      if (shop && shop.id) {
        localStorage.setItem('myShopId', String(shop.id));
      }
      return shop;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể tạo shop';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
  async getMine(userId?: number): Promise<ShopItem | null> {
    try {
      const res = await api.get('/shops/me');
      const shop = res.data?.data;
      if (shop && shop.id) {
        // Lưu shop id vào localStorage để dùng sau này
        localStorage.setItem('myShopId', String(shop.id));
        return shop;
      }
      return null;
    } catch (error: any) {
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error?.message || '';
      
      console.log('🔍 getMine error:', { status, errorData, errorMessage });
      
      // Chỉ coi 404 là "chưa có shop"
      if (status === 404) {
        console.log('ℹ️ 404 - User chưa có shop');
        localStorage.removeItem('myShopId');
        return null;
      }
      
      // 500 là lỗi server - thử workaround: dùng shop id từ localStorage
      if (status === 500) {
        console.log('⚠️ 500 - Thử workaround: dùng shop id từ localStorage...');
        const savedShopId = localStorage.getItem('myShopId');
        if (savedShopId) {
          try {
            const shop = await this.getById(Number(savedShopId));
            // Kiểm tra shop có thuộc về user không
            if (shop && shop.ownerId === userId) {
              console.log('✅ Workaround thành công! Tìm thấy shop từ localStorage');
              return shop;
            } else {
              // Shop không thuộc về user này, xóa id cũ
              localStorage.removeItem('myShopId');
            }
          } catch (idError) {
            console.log('❌ Không tìm thấy shop với id từ localStorage:', savedShopId);
            localStorage.removeItem('myShopId');
          }
        }
        
        // Nếu không có shop id trong localStorage, thử tìm từ danh sách
        if (userId) {
          console.log('⚠️ Thử tìm shop từ danh sách...');
          try {
            const shopsRes = await api.get('/shops', { params: { limit: 1000 } });
            const shops = shopsRes.data?.data?.items || [];
            const myShop = shops.find((s: ShopItem) => s.ownerId === userId);
            if (myShop && myShop.id) {
              console.log('✅ Tìm thấy shop từ danh sách');
              localStorage.setItem('myShopId', String(myShop.id));
              return myShop;
            }
          } catch (workaroundError) {
            console.log('❌ Workaround thất bại:', workaroundError);
          }
        }
      }
      
      // Nếu vẫn lỗi, throw error
      const msg = errorMessage || 'Lỗi server khi lấy thông tin shop. Vui lòng thử lại.';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
  
  async getMineWithFallback(userRole?: string): Promise<ShopItem | null> {
    try {
      return await this.getMine();
    } catch (error: any) {
      // Nếu user có role SELLER, có thể đã có shop
      // Nhưng không thể lấy được do lỗi backend
      if (userRole === 'SELLER') {
        console.log('⚠️ User là SELLER nhưng không lấy được shop - Có thể backend có bug');
        // Không throw error, để UI có thể xử lý
        return null;
      }
      throw error;
    }
  },
  async getById(id: number): Promise<ShopItem> {
    try {
      const res = await api.get(`/shops/${id}`);
      return res.data.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể lấy thông tin shop';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
  async checkName(name: string): Promise<{ exists: boolean }> {
    try {
      const res = await api.get('/shops/check-name', { params: { name } });
      return res.data.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể kiểm tra tên shop';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
  async update(id: number, data: Partial<CreateShopDto>): Promise<ShopItem> {
    try {
      const res = await api.patch(`/shops/${id}`, data);
      return res.data.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể cập nhật shop';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/shops/${id}`);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể xóa shop';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : msg);
    }
  },
};



