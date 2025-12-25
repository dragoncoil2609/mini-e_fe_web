// ================== COMMON ==================

// Response chuẩn của BE
export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
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
  email: string | null;
  phone: string | null;
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
  // Backward compatible: BE cũ trả email
  email?: string | null;

  // Luồng mới: có thể gửi qua phone hoặc email
  phone?: string | null;
  via?: 'email' | 'phone';
  target?: string;

  otp?: string; // dev mode có thể nhận OTP
  expiresAt?: string;
}

export interface RequestVerifyResponse {
  // Backward compatible: BE cũ trả email
  email?: string | null;

  // Luồng mới: có thể gửi OTP qua SMS nếu có phone
  phone?: string | null;
  via?: 'email' | 'phone';
  target?: string;

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
  email: string | null;
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

  logoUrl?: string | null;
  coverUrl?: string | null;

  shopAddress: string | null;
  shopLat: string | null;
  shopLng: string | null;
  shopPlaceId: string | null;
  shopPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

// ================== CATEGORIES ==================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description?: string | null;

  sortOrder?: number;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // nếu BE trả dạng tree
  children?: Category[];
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
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

  // ✅ category
  categoryId?: number | null;
  category?: Category | null;

  // Danh sách ảnh của sản phẩm (BE trả về từ product_images)
  images?: ProductImage[];

  // URL ảnh chính/thumbnail của sản phẩm (deprecated - dùng images với isMain thay thế)
  thumbnailUrl?: string | null;
}

// [CẬP NHẬT] Chi tiết 1 sản phẩm
export interface ProductDetail {
  id: number;
  shopId: number;

  // ✅ category
  categoryId?: number | null;
  category?: Category | null;

  title: string;
  slug: string;
  description: string | null;

  optionSchema?: ProductOptionSchema[] | null;

  price: string; // "150000.00"
  compareAtPrice?: string | null;

  currency: string; // "VND"
  stock: number;
  sold: number;

  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];

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

  // ✅ category
  categoryId?: number | null;

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

  // ✅ category
  categoryId?: number | null;
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

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;

  variantId: number;

  title: string;
  variantName: string | null;
  sku: string | null;

  imageId: number | null;
  imageUrl?: string | null;

  price: string;
  quantity: number;

  value1: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null;
  value5: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: number;
  currency: string;
  itemsCount: number;
  itemsQuantity: number;
  subtotal: string;
  items: CartItem[];
}

export interface AddItemDto {
  productId: number;
  variantId: number;
  quantity?: number;
}

export interface UpdateItemDto {
  quantity: number;
}

// ================== ADDRESSES ==================

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId: string | null;
  lat: string | null;
  lng: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressDto {
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

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


// ================== REVIEWS ==================

export interface ReviewUserPublic {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface ProductReview {
  id: string;
  orderId: string;
  userId: number;
  productId: number;
  rating: number; // 1..5
  comment: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUserPublic | null;
}

export interface CreateProductReviewDto {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface ProductReviewsList {
  summary: { count: number; avg: number };
  items: ProductReview[];
  page: number;
  limit: number;
  total: number;
}