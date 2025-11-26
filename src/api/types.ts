// src/api/types.ts

// ================== COMMON ==================

// Response chuẩn của BE
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  error?: string; // ví dụ "Bad Request", "Unauthorized"
}

// Kết quả phân trang chung
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// ================== AUTH ==================

// Kiểu User cơ bản trong phần auth
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  isVerified: boolean;
  createdAt?: string;
  // có thể thêm lastLoginAt, updatedAt... sau nếu BE trả về
}

// Login / register / refresh response
export interface LoginResponse {
  access_token: string;     // JWT 15m
  refresh_token: string;    // JWT 7d (nhưng nằm trong cookie httpOnly)
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  email: string;
  otp?: string;        // dev mode có thể nhận OTP
  expiresAt?: string;
}

export interface RequestVerifyResponse {
  email: string;
  otp?: string;
  expiresAt?: string;
  isVerified?: boolean;
}

export interface ResetPasswordResponse {
  reset: boolean;
}

export interface LogoutResponse {
  loggedOut: boolean;
}

// ================== USER ==================

export type UserRole = 'USER' | 'SELLER' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  birthday: string | null; // YYYY-MM-DD
  gender: Gender | null;
  otp: string | null;
  timeOtp: string | null;
  isVerified: boolean;
  role: UserRole;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  gender?: Gender;
  isVerified?: boolean;
  sortBy?: 'createdAt' | 'name' | 'lastLoginAt' | 'deletedAt';
  sortOrder?: 'ASC' | 'DESC';
}

// ================== SHOP ==================

export type ShopStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface Shop {
  id: number;
  userId: number;
  name: string;
  slug: string;
  email: string | null;
  description: string | null;
  status: ShopStatus;
  shopAddress: string | null;
  shopLat: string | null;      // BE trả về string như ví dụ
  shopLng: string | null;
  shopPlaceId: string | null;
  shopPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

// ================== PRODUCT ==================

// Trạng thái sản phẩm — có thể mở rộng thêm nếu BE có thêm enum
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | string;

// Ảnh sản phẩm
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  position: number;
  isMain: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Item trong list /products
export interface ProductListItem {
  id: number;
  title: string;
  slug: string;
  price: string;      // "150000.00"
  currency: string;   // "VND"
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;

  // Danh sách ảnh của sản phẩm (BE trả về từ product_images)
  images?: ProductImage[];
  
  // URL ảnh chính/thumbnail của sản phẩm (deprecated - dùng images với isMain thay thế)
  thumbnailUrl?: string | null;
}
// Chi tiết 1 sản phẩm
export interface ProductDetail {
  id: number;
  shopId: number;
  title: string;
  slug: string;
  description: string | null;
  optionSchema: any | null; // nếu BE có type cụ thể thì sửa lại cho chặt
  price: string;            // "150000.00"
  currency: string;         // "VND"
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
}

// ========== VARIANTS ==========

export interface ProductVariantOption {
  option: string; // "Màu"
  value: string;  // "Trắng"
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  name: string;     // "Trắng / S"
  price: string;    // "150000.00"
  stock: number;
  imageId: number | null;
  options?: ProductVariantOption[];
  createdAt?: string;
  updatedAt?: string;
}

// Định nghĩa option để generate variants
export interface ProductOptionDefinition {
  name: string;      // "Màu"
  values: string[];  // ["Trắng", "Đen"]
}

export type GenerateVariantsMode = 'replace' | 'add';

export interface GenerateVariantsPayload {
  options: ProductOptionDefinition[];
  mode: GenerateVariantsMode;
}

// ========== DTO FE GỬI LÊN ==========

// Tạo product – JSON body (Cách B)
export interface CreateProductJsonDto {
  title: string;
  description?: string;
  price: number;
  stock?: number;
  slug?: string;
  images?: string[]; // URL ảnh nếu dùng JSON
}

// Update product
export interface UpdateProductDto {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
}

// Update 1 variant
export interface UpdateVariantDto {
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  imageId?: number | null;
}

// ================== CART ==================

// Cart Item (dòng trong giỏ hàng)
export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  title: string;
  variantName: string | null;
  sku: string | null;
  imageId: number | null;
  price: string; // "150000.00"
  quantity: number;
  value1: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null;
  value5: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Cart (giỏ hàng)
export interface Cart {
  id: number;
  currency: string; // "VND"
  itemsCount: number; // số lượng dòng items
  itemsQuantity: number; // tổng số lượng sản phẩm
  subtotal: string; // "150000.00"
  items: CartItem[];
}

// DTO để thêm item vào cart
export interface AddItemDto {
  productId: number;
  variantId?: number;
  quantity?: number; // mặc định 1
}

// DTO để cập nhật item trong cart
export interface UpdateItemDto {
  quantity: number; // 0 = xóa item
}

// ================== ADDRESSES ==================

// Address (địa chỉ)
export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId: string | null;
  lat: string | null; // decimal từ DB trả về dạng string
  lng: string | null; // decimal từ DB trả về dạng string
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// DTO để tạo địa chỉ mới
export interface CreateAddressDto {
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

// DTO để cập nhật địa chỉ
export interface UpdateAddressDto {
  fullName?: string;
  phone?: string;
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

// ================== ORDERS ==================

// Order Status
export type OrderStatus =
  | 'PENDING' // Chờ xử lý
  | 'CONFIRMED' // Đã xác nhận
  | 'PROCESSING' // Đang xử lý
  | 'SHIPPING' // Đang giao hàng
  | 'DELIVERED' // Đã giao hàng
  | 'CANCELLED' // Đã hủy
  | 'REFUNDED'; // Đã hoàn tiền

// Order Item (sản phẩm trong đơn hàng)
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId: number | null;
  title: string;
  variantName: string | null;
  sku: string | null;
  imageId: number | null;
  price: string; // "150000.00"
  quantity: number;
  value1: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null;
  value5: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Order (đơn hàng)
export interface Order {
  id: number;
  userId: number;
  orderNumber: string; // Mã đơn hàng (unique)
  status: OrderStatus;
  addressId: number | null; // ID địa chỉ giao hàng
  fullName: string;
  phone: string;
  formattedAddress: string;
  itemsCount: number;
  itemsQuantity: number;
  subtotal: string; // "150000.00"
  shippingFee: string; // "30000.00"
  total: string; // "180000.00"
  currency: string; // "VND"
  notes: string | null;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// DTO để tạo đơn hàng từ giỏ hàng
export interface CreateOrderDto {
  addressId: number; // ID địa chỉ giao hàng
  notes?: string; // Ghi chú đơn hàng
}

// DTO để cập nhật trạng thái đơn hàng
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
