import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyShop,
  updateShop,
  uploadShopCover,
  uploadShopLogo,
} from '../../api/shop.api';
import { getProductsByShop } from '../../api/products.api';
import { OrdersApi } from '../../api/orders.api';
import type {
  Order,
  ProductListItem,
  ShippingStatus,
  Shop,
  ShopStatus,
} from '../../api/types';
import { getMainImageUrl } from '../../utils/productImage';
import LocationPicker from '../../components/LocationPicker';
import VietnamAddressSelector from '../../components/VietnamAddressSelector';
import './MyShopPage.css';

interface ShopWithStats extends Shop {
  productCount?: number;
  totalRevenue?: number;
  totalOrders?: number;
  totalSold?: number;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

interface EditFormState {
  name: string;
  email: string;
  description: string;
  shopAddress: string;
  shopLat: string;
  shopLng: string;
  shopPlaceId: string;
  shopPhone: string;
}

const statusTextMap: Record<ShopStatus, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm khóa',
};

const statusMessageMap: Record<ShopStatus, string> = {
  PENDING:
    'Shop của bạn đang chờ admin phê duyệt. Bạn vẫn có thể chỉnh sửa thông tin shop trong lúc chờ duyệt.',
  ACTIVE:
    'Shop của bạn đã được kích hoạt. Bạn có thể quản lý sản phẩm và xử lý đơn hàng.',
  SUSPENDED:
    'Shop của bạn đang bị tạm khóa. Bạn vẫn có thể xem và cập nhật thông tin shop nhưng chưa thể bán hàng.',
};

const statusBannerStyleMap: Record<ShopStatus, React.CSSProperties> = {
  PENDING: {
    background: '#fef9c3',
    color: '#854d0e',
    border: '1px solid #fde68a',
  },
  ACTIVE: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  SUSPENDED: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
};

const MyShopPage = () => {
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopWithStats | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [shopOrders, setShopOrders] = useState<Order[]>([]);
  const [shopOrdersLoading, setShopOrdersLoading] = useState(false);
  const [shopOrdersError, setShopOrdersError] = useState<string | null>(null);
  const [shopOrdersPage, setShopOrdersPage] = useState(1);
  const [shopOrdersLimit] = useState(10);
  const [shopOrdersTotal, setShopOrdersTotal] = useState(0);

  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);

  const unwrap = <T,>(res: any): T => {
    if (res && typeof res === 'object') {
      if ('success' in res) return res.data as T;
      if ('data' in res) return res.data as T;
    }
    return res as T;
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    if (Number.isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const canManageSales = shop?.status === 'ACTIVE';

  const resetFormFromShop = (data: ShopWithStats) => {
    setForm({
      name: data.name || '',
      email: data.email || '',
      description: data.description || '',
      shopAddress: data.shopAddress || '',
      shopLat: data.shopLat || '',
      shopLng: data.shopLng || '',
      shopPlaceId: data.shopPlaceId || '',
      shopPhone: data.shopPhone || '',
    });
  };

  const loadProducts = async (shopId: number) => {
    setProductsLoading(true);
    try {
      const res = await getProductsByShop(shopId, { page: 1, limit: 10 });
      const payload = unwrap<any>(res);
      const items = Array.isArray(payload) ? payload : payload?.items ?? [];
      setProducts(items);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadShopOrders = async (page = shopOrdersPage) => {
    if (!shop || shop.status !== 'ACTIVE') {
      setShopOrders([]);
      setShopOrdersError(null);
      setShopOrdersTotal(0);
      return;
    }

    setShopOrdersLoading(true);
    setShopOrdersError(null);

    try {
      const res = await OrdersApi.getMyShopOrders({
        page,
        limit: shopOrdersLimit,
      });

      if (!res.success) {
        setShopOrdersError(res.message || 'Không tải được đơn hàng của shop.');
        return;
      }

      setShopOrders(res.data.items || []);
      setShopOrdersTotal(res.data.total || 0);
      setShopOrdersPage(page);
    } catch (e: any) {
      setShopOrdersError(
        e?.response?.data?.message || 'Không tải được đơn hàng của shop.',
      );
    } finally {
      setShopOrdersLoading(false);
    }
  };

  const loadMyShop = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getMyShop();
      const data = unwrap<ShopWithStats>(res);

      if (!data?.id) {
        setShop(null);
        setError('Bạn chưa có shop.');
        return;
      }

      setShop(data);
      resetFormFromShop(data);
      await loadProducts(data.id);

      if (data.status === 'ACTIVE') {
        await loadShopOrders(1);
      } else {
        setShopOrders([]);
        setShopOrdersError(null);
        setShopOrdersTotal(0);
      }
    } catch (err: any) {
      console.error(err);
      setShop(null);
      setError(err?.response?.data?.message || 'Không tải được dữ liệu shop.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyShop();
  }, []);

  const labelShipping = (status: ShippingStatus) => {
    const map: Record<ShippingStatus, string> = {
      PENDING: 'Đã nhận đơn',
      PICKED: 'Đã nhận đơn',
      IN_TRANSIT: 'Đang giao',
      DELIVERED: 'Đã giao',
      RETURNED: 'Hoàn hàng',
      CANCELED: 'Đã huỷ',
    };
    return map[status] || status;
  };

  const nextShippingOptions = (current: ShippingStatus): ShippingStatus[] => {
    const map: Record<ShippingStatus, ShippingStatus[]> = {
      PENDING: ['IN_TRANSIT', 'CANCELED'],
      PICKED: ['IN_TRANSIT', 'CANCELED'],
      IN_TRANSIT: ['DELIVERED', 'CANCELED'],
      DELIVERED: [],
      RETURNED: [],
      CANCELED: [],
    };
    return map[current] || [];
  };

  const updateShipping = async (orderId: string, next: ShippingStatus) => {
    try {
      const res = await OrdersApi.updateMyShopOrderShippingStatus(orderId, next);

      if (!res.success) {
        setError(res.message || 'Cập nhật trạng thái đơn thất bại.');
        return;
      }

      setSuccessMsg(`Đã cập nhật trạng thái đơn: ${labelShipping(next)}`);
      setShopOrders((prev) =>
        prev.map((o) => (o.id === orderId ? ({ ...o, ...res.data } as Order) : o)),
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Không thể cập nhật trạng thái đơn.',
      );
    }
  };

  const openOrderDetail = async (orderId: string) => {
    setOrderDetailOpen(true);
    setOrderDetailLoading(true);
    setOrderDetail(null);

    try {
      const res = await OrdersApi.getMyShopOrderDetail(orderId);

      if (!res.success) {
        setError(res.message || 'Không tải được chi tiết đơn hàng.');
        return;
      }

      setOrderDetail(res.data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Không tải được chi tiết đơn hàng.',
      );
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shop) return;

    setLogoUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await uploadShopLogo(file);
      const data = unwrap<ShopWithStats>(res);
      setShop((prev) => (prev ? { ...prev, logoUrl: data.logoUrl ?? null } : prev));
      setSuccessMsg('Đã cập nhật logo shop.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload logo thất bại.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shop) return;

    setCoverUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await uploadShopCover(file);
      const data = unwrap<ShopWithStats>(res);
      setShop((prev) => (prev ? { ...prev, coverUrl: data.coverUrl ?? null } : prev));
      setSuccessMsg('Đã cập nhật ảnh bìa shop.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload ảnh bìa thất bại.');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleCancelEdit = () => {
    if (!shop) return;
    resetFormFromShop(shop);
    setEditing(false);
    setError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop || !form) return;

    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
        shopAddress: form.shopAddress.trim() || undefined,
        shopPhone: form.shopPhone.trim() || undefined,
      };

      if (form.shopLat) payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng) payload.shopLng = parseFloat(form.shopLng);
      if (form.shopPlaceId.trim()) payload.shopPlaceId = form.shopPlaceId.trim();

      const res = await updateShop(shop.id, payload);
      const data = unwrap<ShopWithStats>(res);

      if (!data?.id) {
        setError((res as any)?.message || 'Cập nhật shop thất bại.');
        return;
      }

      setShop(data);
      resetFormFromShop(data);
      setEditing(false);
      setSuccessMsg('Đã cập nhật thông tin shop.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cập nhật shop thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="myshop-page-root">
        <div className="myshop-loading-card">Đang tải dữ liệu shop...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="myshop-page-root">
        <div className="myshop-empty-card">
          <div style={{ marginBottom: 12, fontWeight: 700 }}>
            Bạn chưa có shop.
          </div>
          <div style={{ marginBottom: 16 }}>
            Hãy đăng ký mở shop để bắt đầu kinh doanh trên Mini E.
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/shops/register')}
          >
            Đăng ký mở shop
          </button>
        </div>
      </div>
    );
  }

  const shopOrdersTotalPages = Math.max(
    1,
    Math.ceil(shopOrdersTotal / shopOrdersLimit),
  );

  return (
    <div className="myshop-page-root">
      <div className="myshop-container">
        <div className="myshop-topbar">
          <button
            type="button"
            className="myshop-topbar-btn myshop-topbar-btn--ghost"
            onClick={() => navigate('/home')}
          >
            ← Trang chủ
          </button>
        </div>

        {successMsg && <div className="myshop-success">{successMsg}</div>}
        {error && <div className="myshop-error">{error}</div>}

        <div
          style={{
            marginBottom: 16,
            borderRadius: 14,
            padding: '12px 14px',
            lineHeight: 1.6,
            fontSize: 14,
            fontWeight: 500,
            ...statusBannerStyleMap[shop.status],
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>
            Trạng thái shop: {statusTextMap[shop.status]}
          </div>
          <div>{statusMessageMap[shop.status]}</div>
        </div>

        <input
          type="file"
          ref={logoInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleLogoChange}
        />
        <input
          type="file"
          ref={coverInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleCoverChange}
        />

        <div className="myshop-header-section">
          <div
            className={`myshop-cover ${!shop.coverUrl ? 'empty-cover' : ''} ${
              coverUploading ? 'loading' : ''
            }`}
            style={shop.coverUrl ? { backgroundImage: `url(${shop.coverUrl})` } : {}}
            onClick={() =>
              !editing && !coverUploading && coverInputRef.current?.click()
            }
          >
            {!shop.coverUrl && (
              <span className="myshop-cover-placeholder">Chưa có ảnh bìa</span>
            )}

            {!editing && !coverUploading && (
              <div className="btn-upload-icon">📷</div>
            )}

            {coverUploading && (
              <div className="upload-loading-overlay">
                <div className="spinner" />
              </div>
            )}
          </div>

          <div className="myshop-avatar-container">
            <div
              className={`myshop-avatar ${logoUploading ? 'loading' : ''}`}
              onClick={() =>
                !editing && !logoUploading && logoInputRef.current?.click()
              }
            >
              {shop.logoUrl ? <img src={shop.logoUrl} alt="Logo" /> : <span>Logo</span>}

              {!editing && !logoUploading && (
                <div className="btn-upload-icon">📷</div>
              )}

              {logoUploading && (
                <div className="upload-loading-overlay">
                  <div className="spinner" />
                </div>
              )}
            </div>

            <div className="myshop-name-block">
              <h1 className="myshop-name">{shop.name}</h1>
              <span className={`status-badge status-${shop.status.toLowerCase()}`}>
                {statusTextMap[shop.status]}
              </span>
            </div>
          </div>
        </div>

        {!editing && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Sản phẩm</div>
              <div className="stat-value">
                <span className="stat-icon">📄</span>
                {shop.productCount || 0}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Doanh thu</div>
              <div className="stat-value">{formatCurrency(shop.totalRevenue)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Đơn hàng</div>
              <div className="stat-value">{shop.totalOrders || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Đã bán</div>
              <div className="stat-value">
                <span className="stat-icon">📦</span>
                {shop.totalSold || 0}
              </div>
            </div>
          </div>
        )}

        {!editing && (
          <div className="info-container">
            <button
              type="button"
              className="btn-edit-float"
              onClick={() => setEditing(true)}
            >
              ✏️ Chỉnh sửa thông tin
            </button>

            <div className="info-column">
              <h3>Thông tin liên hệ</h3>
              <div className="info-row">
                <span className="info-key">SĐT:</span>
                <span className="info-val">
                  {shop.shopPhone || '(Chưa cập nhật)'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Email:</span>
                <span className="info-val">{shop.email || '(Chưa cập nhật)'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Slug:</span>
                <span className="info-val">@{shop.slug}</span>
              </div>
            </div>

            <div className="info-column">
              <h3>Chi tiết shop</h3>
              <div className="info-row">
                <span className="info-key">Mô tả:</span>
                <span className="info-val">
                  {shop.description || 'Chưa có mô tả.'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Địa chỉ:</span>
                <span className="info-val" style={{ lineHeight: 1.5 }}>
                  {shop.shopAddress || 'Chưa cập nhật địa chỉ.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {editing && form && (
          <div className="edit-form-wrapper">
            <h2 className="edit-form-title">Chỉnh sửa thông tin shop</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="edit-form-row">
                <label className="form-label">Tên shop</label>
                <input
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="edit-form-row edit-form-row--2col">
                <div className="edit-form-col">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    name="email"
                    value={form.email}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="edit-form-col">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    className="form-input"
                    name="shopPhone"
                    value={form.shopPhone}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="edit-form-row">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-input"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleEditChange}
                />
              </div>

              <div className="edit-form-row">
                <label className="form-label">Địa chỉ</label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) =>
                    setForm((prev) => (prev ? { ...prev, shopAddress: full } : prev))
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((prev) =>
                      prev ? { ...prev, shopLat: lat || '', shopLng: lng || '' } : prev,
                    )
                  }
                />
              </div>

              <div className="edit-form-row">
                <label className="form-label">Vị trí trên bản đồ</label>
                <div className="edit-map-wrapper">
                  <LocationPicker
                    address={form.shopAddress}
                    lat={form.shopLat}
                    lng={form.shopLng}
                    onChange={({ lat, lng }) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              shopLat: lat || '',
                              shopLng: lng || '',
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="edit-form-actions">
                <button type="submit" className="btn-primary">
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {canManageSales ? (
          <div className="myshop-products-section" style={{ marginTop: 18 }}>
            <div className="action-bar">
              <h2 className="section-title">Quản lý đơn hàng</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadShopOrders(1)}
              >
                Tải lại
              </button>
            </div>

            {shopOrdersLoading && (
              <p className="myshop-products-loading">Đang tải đơn hàng...</p>
            )}
            {shopOrdersError && <div className="myshop-error">{shopOrdersError}</div>}

            {!shopOrdersLoading && !shopOrdersError && (
              <div className="myshop-table-wrapper">
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách</th>
                      <th>Địa chỉ</th>
                      <th>Tổng</th>
                      <th>Giao hàng</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="shop-table-empty">
                          Chưa có đơn hàng nào.
                        </td>
                      </tr>
                    ) : (
                      shopOrders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <b>{o.code}</b>
                              <span style={{ fontSize: 12, opacity: 0.7 }}>
                                {new Date(o.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{o.addressSnapshot?.fullName || '-'}</span>
                              <span style={{ fontSize: 12, opacity: 0.7 }}>
                                {o.addressSnapshot?.phone || '-'}
                              </span>
                            </div>
                          </td>

                          <td style={{ maxWidth: 340 }}>
                            <div style={{ fontSize: 13, lineHeight: 1.35 }}>
                              {o.addressSnapshot?.formattedAddress || '-'}
                            </div>
                          </td>

                          <td className="shop-table-price">
                            {formatCurrency(o.total)}
                          </td>

                          <td>
                            <span
                              className="shop-status-pill"
                              data-status={o.shippingStatus}
                            >
                              {labelShipping(o.shippingStatus)}
                            </span>
                          </td>

                          <td>
                            {nextShippingOptions(o.shippingStatus).length === 0 ? (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn-secondary btn-secondary--small"
                                  onClick={() => void openOrderDetail(o.id)}
                                >
                                  Xem
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary btn-secondary--small"
                                  disabled
                                >
                                  Đã kết thúc
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn-secondary btn-secondary--small"
                                  onClick={() => void openOrderDetail(o.id)}
                                >
                                  Xem
                                </button>
                                <select
                                  className="shop-status-select"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const value = e.target.value as ShippingStatus;
                                    if (value) void updateShipping(o.id, value);
                                    e.currentTarget.value = '';
                                  }}
                                >
                                  <option value="">Cập nhật...</option>
                                  {nextShippingOptions(o.shippingStatus).map((s) => (
                                    <option key={s} value={s}>
                                      {labelShipping(s)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {shopOrdersTotalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 12,
                    }}
                  >
                    <button
                      className="btn-secondary btn-secondary--small"
                      disabled={shopOrdersPage <= 1}
                      onClick={() =>
                        loadShopOrders(Math.max(1, shopOrdersPage - 1))
                      }
                    >
                      ← Trang trước
                    </button>

                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      Trang {shopOrdersPage}/{shopOrdersTotalPages}
                    </div>

                    <button
                      className="btn-secondary btn-secondary--small"
                      disabled={shopOrdersPage >= shopOrdersTotalPages}
                      onClick={() =>
                        loadShopOrders(
                          Math.min(shopOrdersTotalPages, shopOrdersPage + 1),
                        )
                      }
                    >
                      Trang sau →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              padding: '16px 18px',
              color: '#4b5563',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              Quản lý đơn hàng
            </div>
            <div>
              Phần đơn hàng sẽ mở khi shop được admin duyệt và chuyển sang trạng
              thái hoạt động.
            </div>
          </div>
        )}

        <div className="myshop-products-section">
          <div className="action-bar">
            <h2 className="section-title">Danh sách sản phẩm</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!canManageSales) {
                  setError(
                    'Shop của bạn chưa được kích hoạt nên chưa thể quản lý sản phẩm.',
                  );
                  return;
                }
                navigate('/me/products');
              }}
            >
              Quản lý sản phẩm
            </button>
          </div>

          {!canManageSales && (
            <div
              style={{
                marginBottom: 12,
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              Khi shop được duyệt, bạn sẽ có thể tạo và quản lý sản phẩm tại đây.
            </div>
          )}

          {productsLoading ? (
            <p className="myshop-products-loading">Đang tải sản phẩm...</p>
          ) : (
            <div className="myshop-table-wrapper">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="shop-table-empty">
                        {canManageSales
                          ? 'Chưa có sản phẩm nào.'
                          : 'Shop chưa được duyệt nên chưa có sản phẩm để quản lý.'}
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>
                          <div className="shop-table-product-cell">
                            {getMainImageUrl(p) ? (
                              <img
                                src={getMainImageUrl(p)!}
                                width={48}
                                height={48}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: 4,
                                  border: '1px solid #eee',
                                }}
                                alt={p.title}
                              />
                            ) : (
                              <div className="shop-table-product-placeholder" />
                            )}
                            <span className="shop-table-product-name">
                              {p.title}
                            </span>
                          </div>
                        </td>

                        <td className="shop-table-price">
                          {p.price} {p.currency}
                        </td>

                        <td>
                          <span className="shop-status-pill" data-status={p.status}>
                            {p.status}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn-secondary btn-secondary--small"
                            disabled={!canManageSales}
                            onClick={() => navigate(`/me/products/${p.id}/edit`)}
                            style={{ marginRight: 8 }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-secondary--small"
                            disabled={!canManageSales}
                            onClick={() => navigate(`/me/products/${p.id}/variants`)}
                          >
                            Biến thể
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {orderDetailOpen && (
        <div
          className="shop-order-modal-overlay"
          onClick={() => {
            setOrderDetailOpen(false);
            setOrderDetail(null);
          }}
        >
          <div className="shop-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shop-order-modal-header">
              <div>
                <div className="shop-order-modal-title">Chi tiết đơn hàng</div>
                <div className="shop-order-modal-subtitle">
                  {orderDetail?.code ? `Mã: ${orderDetail.code}` : ''}
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary btn-secondary--small"
                onClick={() => {
                  setOrderDetailOpen(false);
                  setOrderDetail(null);
                }}
              >
                Đóng
              </button>
            </div>

            {orderDetailLoading && <div style={{ padding: 14 }}>Đang tải...</div>}

            {!orderDetailLoading && orderDetail && (
              <div className="shop-order-modal-body">
                <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                  <div>
                    <b>Khách:</b> {orderDetail.addressSnapshot?.fullName || '-'} •{' '}
                    {orderDetail.addressSnapshot?.phone || '-'}
                  </div>
                  <div>
                    <b>Địa chỉ:</b>{' '}
                    {orderDetail.addressSnapshot?.formattedAddress || '-'}
                  </div>
                  <div>
                    <b>Trạng thái giao hàng:</b>{' '}
                    {labelShipping(orderDetail.shippingStatus)}
                  </div>
                  <div>
                    <b>Tổng:</b> {formatCurrency(orderDetail.total)}
                  </div>
                </div>

                <div style={{ marginTop: 12, fontWeight: 800 }}>Sản phẩm</div>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {(orderDetail.items || []).map((it) => (
                    <div key={it.id} className="shop-order-item-row">
                      <div className="shop-order-item-img">
                        {it.imageSnapshot ? (
                          <img src={it.imageSnapshot} alt={it.nameSnapshot} />
                        ) : (
                          <div className="shop-order-item-img-ph">📦</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            lineHeight: 1.2,
                          }}
                        >
                          {it.nameSnapshot}
                        </div>
                        <div
                          style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}
                        >
                          {formatCurrency(it.price)} × {it.quantity}
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {formatCurrency(it.totalLine)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShopPage;