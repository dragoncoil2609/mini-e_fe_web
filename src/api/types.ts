// ================== COMMON ==================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserRole = 'USER' | 'SELLER' | 'ADMIN';

// Response chuẩn của BE
export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  data: T;
  message?: string;
  error?: string; // ví dụ "Bad Request", "Unauthorized"
}

// Meta phân trang
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pageCount?: number;
}

// Kết quả phân trang chung (một số API cũ có thể vẫn dùng kiểu này)
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// Kết quả phân trang chuẩn mới của users.service.ts
export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

// ================== AUTH ==================

// Kiểu User cơ bản trong phần auth
export interface AuthUser {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt?: string;
}

// Kiểu User đầy đủ ở module users
export interface User {
  id: number;
  name: string;

  email?: string | null;
  phone?: string | null;

  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: Gender | null;

  isVerified: boolean;
  role: UserRole;

  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Query list user
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?:
    | 'id'
    | 'name'
    | 'email'
    | 'phone'
    | 'role'
    | 'isVerified'
    | 'createdAt'
    | 'updatedAt'
    | 'lastLoginAt'
    | 'deletedAt';
  sortOrder?: 'ASC' | 'DESC';
}

// Login / register / refresh response
export interface LoginResponse {
  access_token?: string;
  refresh_token?: string; // backend hiện có thể vẫn trả, nhưng FE không nên bắt buộc
  user?: AuthUser;

  // user bị soft delete -> cần khôi phục
  needRecover?: true;
  identifier?: string;
  via?: 'email' | 'phone';

  // login thành công nhưng chưa verify
  verify?: {
    required: true;
    via: 'email' | 'phone';
    target: string;
    expiresAt: string;
    sent: boolean;
    cooldownRemaining?: number;
  };
}

export interface RefreshResponse {
  access_token: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  email?: string | null;
  phone?: string | null;
  via?: 'email' | 'phone';
  target?: string;

  otp?: string; // dev mode có thể nhận OTP
  expiresAt?: string;
}

export interface RequestVerifyResponse {
  email?: string | null;
  phone?: string | null;
  via?: 'email' | 'phone';
  target?: string;

  otp?: string;
  expiresAt?: string;
  isVerified?: boolean;

  sent?: boolean;
  cooldownRemaining?: number;
  required?: true;
}

export interface VerifyAccountResponse {
  verified?: boolean;
  isVerified?: boolean;
}

export interface ResetPasswordResponse {
  reset: boolean;
}

export interface LogoutResponse {
  loggedOut: boolean;
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
  parent?: Category | null;
  children?: Category[];

  description?: string | null;

  sortOrder: number;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SearchCategoriesParams {
  q?: string;
  parentId?: number;
  isActive?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface DeleteCategoryResponse {
  id: number;
  deleted: boolean;
}

// ================== PRODUCT ==================

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | string;

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  position: number;
  isMain: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductOptionSchema {
  name: string;
  values: string[];
}

export interface ProductListItem {
  id: number;
  shopId?: number;
  title: string;
  slug: string;

  price: string;
  compareAtPrice?: string | null;
  currency: string;

  stock?: number;
  sold?: number;

  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;

  categoryId?: number | null;
  category?: Category | null;

  images?: ProductImage[];
  thumbnailUrl?: string | null;
  mainImageUrl?: string | null;
}

export interface ProductDetail {
  id: number;
  shopId: number;

  categoryId?: number | null;
  category?: Category | null;

  title: string;
  slug: string;
  description: string | null;

  optionSchema?: ProductOptionSchema[] | null;

  price: string;
  compareAtPrice?: string | null;

  currency: string;
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
  option: string;
  value: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
  imageId: number | null;
  options?: ProductVariantOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductOptionDefinition {
  name: string;
  values: string[];
}

export type GenerateVariantsMode = 'replace' | 'add';

export interface GenerateVariantsPayload {
  options: ProductOptionDefinition[];
  mode: GenerateVariantsMode;
}

// ================== DTO FE GỬI LÊN ==================

export interface CreateProductJsonDto {
  title: string;
  description?: string;
  price: number;
  stock?: number;
  slug?: string;
  categoryId?: number | null;
  images?: string[];
}

export interface UpdateProductDto {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
  categoryId?: number | null;
}

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
  isDefault?: boolean;
}

// ================== ORDERS ==================

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
    shop: {
      id: number;
      name: string;
      slug: string;
    };
    items: Array<{
      id: number;
      variantId: number | null;
      productId: number;
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
  summary: {
    subtotal: number;
    shippingFee: number;
    total: number;
  };
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
  rating: number;
  comment: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUserPublic | null;
}

export interface CreateProductReviewDto {
  orderId: string;
  productId: number;
  rating: number;
  comment?: string;
  content?: string;
  images?: string[];
}

export interface ProductReviewsList {
  summary: {
    count: number;
    avg: number;
  };
  items: ProductReview[];
  page: number;
  limit: number;
  total: number;
}