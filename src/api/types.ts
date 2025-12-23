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
}

// Login / register / refresh response
export interface LoginResponse {
  access_token: string; // JWT 15m
  refresh_token: string; // JWT 7d (nhưng nằm trong cookie httpOnly)
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  email: string;
  otp?: string; // dev mode có thể nhận OTP
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

  // --- THÊM 2 DÒNG NÀY ---
  logoUrl?: string | null;
  coverUrl?: string | null;
  // -----------------------

  shopAddress: string | null;
  shopLat: string | null;
  shopLng: string | null;
  shopPlaceId: string | null;
  shopPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

// ================== PRODUCT ==================

// Trạng thái sản phẩm
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

// [MỚI] Định nghĩa cấu trúc Option Schema (Fix lỗi implicit any)
export interface ProductOptionSchema {
  name: string; // Ví dụ: "Màu sắc"
  values: string[]; // Ví dụ: ["Đỏ", "Xanh"]
}

// Item trong list /products
export interface ProductListItem {
  id: number;
  title: string;
  slug: string;
  price: string; // "150000.00"
  currency: string; // "VND"
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;

  // Danh sách ảnh của sản phẩm (BE trả về từ product_images)
  images?: ProductImage[];

  // URL ảnh chính/thumbnail của sản phẩm (deprecated - dùng images với isMain thay thế)
  thumbnailUrl?: string | null;
}

// [CẬP NHẬT] Chi tiết 1 sản phẩm
export interface ProductDetail {
  id: number;
  shopId: number;
  title: string;
  slug: string;
  description: string | null;

  // Đã sửa type từ 'any' sang mảng cụ thể
  optionSchema?: ProductOptionSchema[] | null;

  price: string; // "150000.00"

  // Thêm trường giá gốc (gạch ngang)
  compareAtPrice?: string | null;

  currency: string; // "VND"
  stock: number;

  // Thêm trường số lượng đã bán
  sold: number;

  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];

  // Có thể dùng nếu BE trả về mainImageUrl riêng
  mainImageUrl?: string | null;
}

// ================== VARIANTS ==================

export interface ProductVariantOption {
  option: string; // "Màu"
  value: string; // "Trắng"
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  name: string; // "Trắng / S"
  price: string; // "150000.00"
  stock: number;
  imageId: number | null;
  options?: ProductVariantOption[];
  createdAt?: string;
  updatedAt?: string;
}

// Định nghĩa option để generate variants
export interface ProductOptionDefinition {
  name: string; // "Màu"
  values: string[]; // ["Trắng", "Đen"]
}

export type GenerateVariantsMode = 'replace' | 'add';

export interface GenerateVariantsPayload {
  options: ProductOptionDefinition[];
  mode: GenerateVariantsMode;
}

// ================== DTO FE GỬI LÊN ==================

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

  // ✅ BE mới: bắt buộc phải có variant
  variantId: number;

  title: string;
  variantName: string | null;
  sku: string | null;

  imageId: number | null;
  imageUrl?: string | null;

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

  // ✅ bắt buộc
  variantId: number;

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
export type PaymentMethod = 'COD' | 'VNPAY';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type ShippingStatus =
  | 'PENDING'
  | 'PICKED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELED';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  // giữ thêm các status cũ nếu nơi khác còn dùng:
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: number;
  productVariantId: number | null;

  nameSnapshot: string;
  imageSnapshot: string | null;

  price: string;
  quantity: number;
  totalLine: string;

  value1: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null;
  value5: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId?: string | null;
  lat?: string | null;
  lng?: string | null;
}

export interface Order {
  id: string;
  userId: number;
  code: string;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  paymentMethod: PaymentMethod;

  paymentRef: string | null;
  paymentMeta: any | null;

  addressSnapshot: AddressSnapshot;

  subtotal: string;
  discount: string;
  shippingFee: string;
  total: string;

  note: string | null;
  createdAt: string;
  updatedAt: string;

  items?: OrderItem[];
}

// Preview
export interface PreviewOrderDto {
  addressId?: number;
  itemIds?: number[];
}

export interface PreviewOrderResponse {
  address: {
    id: number;
    fullName: string;
    phone: string;
    formattedAddress: string;
  };
  orders: Array<{
    product: { id: number; title: string };
    items: Array<{
      id: number;
      variantId: number | null;
      name: string;
      imageUrl: string | null;
      price: number;
      quantity: number;
      totalLine: number;
    }>;
    distanceKm: number;
    subtotal: number;
    shippingFee: number;
    total: number;
  }>;
  summary: { subtotal: number; shippingFee: number; total: number };
}

// Create
export interface CreateOrderDto {
  paymentMethod: PaymentMethod;
  addressId?: number;
  itemIds?: number[];
  note?: string;
}

export type CreateOrderResponse =
  | {
      orders: Array<{ orderId: string; code: string; total: number }>;
    }
  | {
      session: { code: string; amount: number; status: string };
      paymentUrl: string;
    };