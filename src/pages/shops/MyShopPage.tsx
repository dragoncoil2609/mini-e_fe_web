import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyShop,
  updateShop,
  uploadShopLogo,
  uploadShopCover,
} from '../../api/shop.api';
import { getProductsByShop } from '../../api/products.api';
import { OrdersApi } from '../../api/orders.api';
import type { Shop, ProductListItem, Order, ShippingStatus } from '../../api/types';
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

const MyShopPage = () => {
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  // --- STATE LOADING UPLOAD ---
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // ================== SHOP ORDERS (NEW) ==================
  const [shopOrders, setShopOrders] = useState<Order[]>([]);
  const [shopOrdersLoading, setShopOrdersLoading] = useState(false);
  const [shopOrdersError, setShopOrdersError] = useState<string | null>(null);
  const [shopOrdersPage, setShopOrdersPage] = useState(1);
  const [shopOrdersLimit] = useState(10);
  const [shopOrdersTotal, setShopOrdersTotal] = useState(0);

  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const unwrap = <T,>(res: any): T => {
    if (res && typeof res === 'object') {
      if ('success' in res) return res.data as T;
      if ('data' in res) return res.data as T;
    }
    return res as T;
  };

  const loadProducts = async (shopId: number) => {
    setProductsLoading(true);
    try {
      const res = await getProductsByShop(shopId, { page: 1, limit: 10 });
      const payload = unwrap<any>(res);
      const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
      setProducts(items);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadMyShop = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyShop();
      const data = unwrap<ShopWithStats>(res);
      if (!data?.id) {
        setError('Bạn chưa có shop hoặc lỗi tải shop.');
        setShop(null);
        return;
      }
      setShop(data);
      setForm({
        name: data.name,
        email: data.email || '',
        description: data.description || '',
        shopAddress: data.shopAddress || '',
        shopLat: data.shopLat || '',
        shopLng: data.shopLng || '',
        shopPlaceId: data.shopPlaceId || '',
        shopPhone: data.shopPhone || '',
      });
      void loadProducts(data.id);
      void loadShopOrders(1); // ✅ load đơn hàng shop luôn
    } catch (err: any) {
      console.error(err);
      setError('Bạn chưa có shop hoặc lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const loadShopOrders = async (page = shopOrdersPage) => {
    setShopOrdersLoading(true);
    setShopOrdersError(null);
    try {
      const res = await OrdersApi.getMyShopOrders({ page, limit: shopOrdersLimit });
      if (!res.success) {
        setShopOrdersError(res.message || 'Không tải được đơn hàng của shop');
        return;
      }
      setShopOrders(res.data.items || []);
      setShopOrdersTotal(res.data.total || 0);
      setShopOrdersPage(page);
    } catch (e: any) {
      setShopOrdersError(e?.response?.data?.message || 'Không tải được đơn hàng của shop');
    } finally {
      setShopOrdersLoading(false);
    }
  };

  const labelShipping = (s: ShippingStatus) => {
    const map: Record<string, string> = {
      PENDING: 'Đã nhận đơn',
      IN_TRANSIT: 'Đang giao',
      DELIVERED: 'Đã giao',
      CANCELED: 'Đã huỷ',
      // dữ liệu cũ
      PICKED: 'Đã nhận đơn',
      RETURNED: 'Hoàn hàng',
    };
    return map[s] || s;
  };

  const nextShippingOptions = (current: ShippingStatus): ShippingStatus[] => {
    const map: Record<string, ShippingStatus[]> = {
      // shop chỉ đi theo 3 trạng thái: đã nhận đơn -> đang giao -> đã giao
      PENDING: ['IN_TRANSIT', 'CANCELED'],
      PICKED: ['IN_TRANSIT', 'CANCELED'],
      IN_TRANSIT: ['DELIVERED', 'CANCELED'],
      DELIVERED: [],
      RETURNED: [],
      CANCELED: [],
    };
    return map[String(current)] || [];
  };

  const updateShipping = async (orderId: string, next: ShippingStatus) => {
    try {
      const res = await OrdersApi.updateMyShopOrderShippingStatus(orderId, next);
      if (!res.success) {
        alert(res.message || 'Cập nhật thất bại');
        return;
      }
      setSuccessMsg(`Đã cập nhật trạng thái: ${next}`);
      setShopOrders((prev) => prev.map((o) => (o.id === orderId ? ({ ...o, ...res.data } as any) : o)));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Lỗi cập nhật trạng thái đơn');
    }
  };

  const openOrderDetail = async (orderId: string) => {
    setOrderDetailOpen(true);
    setOrderDetailLoading(true);
    setOrderDetail(null);
    try {
      const res = await OrdersApi.getMyShopOrderDetail(orderId);
      if (!res.success) {
        alert(res.message || 'Không tải được chi tiết đơn');
        return;
      }
      setOrderDetail(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Không tải được chi tiết đơn');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadMyShop();
  }, []);

  // --- HANDLE UPLOAD LOGO ---
  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shop) return;

    setLogoUploading(true);
    setSuccessMsg(null);

    try {
      const res = await uploadShopLogo(file);
      const payload = unwrap<any>(res);
      if (payload?.logoUrl) {
        setShop((prev) => (prev ? { ...prev, logoUrl: payload.logoUrl } : null));
        setSuccessMsg('Đã cập nhật Logo thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload logo. Vui lòng thử lại.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // --- HANDLE UPLOAD COVER ---
  const handleCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shop) return;

    setCoverUploading(true);
    setSuccessMsg(null);

    try {
      const res = await uploadShopCover(file);
      const payload = unwrap<any>(res);
      if (payload?.coverUrl) {
        setShop((prev) => (prev ? { ...prev, coverUrl: payload.coverUrl } : null));
        setSuccessMsg('Đã cập nhật Ảnh bìa thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload ảnh bìa. Vui lòng thử lại.');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // --- HANDLE EDIT FORM ---
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop || !form) return;

    try {
      const payload: any = { ...form };
      if (form.shopLat) payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng) payload.shopLng = parseFloat(form.shopLng);

      const res = await updateShop(shop.id, payload);
      const data = unwrap<ShopWithStats>(res);
      if (data?.id) {
        setShop(data);
        setSuccessMsg('Cập nhật thông tin shop thành công!');
        setEditing(false);
      } else {
        alert((res as any)?.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật thông tin shop.');
    }
  };

  // --- RENDER LOADING / EMPTY ---
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
          Bạn chưa có shop. Hãy đăng ký mở shop trước.
        </div>
      </div>
    );
  }

  const shopOrdersTotalPages = Math.max(1, Math.ceil(shopOrdersTotal / shopOrdersLimit));

  // --- RENDER CHÍNH ---
  return (
    <div className="myshop-page-root">
      <div className="myshop-container">
        {/* Top bar */}
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

        {/* Hidden file inputs */}
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

        {/* HEADER: Cover + Logo + Tên shop */}
        <div className="myshop-header-section">
          {/* Ảnh bìa */}
          <div
            className={`myshop-cover ${!shop.coverUrl ? 'empty-cover' : ''} ${
              coverUploading ? 'loading' : ''
            }`}
            style={shop.coverUrl ? { backgroundImage: `url(${shop.coverUrl})` } : {}}
            onClick={() => !editing && !coverUploading && coverInputRef.current?.click()}
          >
            {!shop.coverUrl && (
              <span className="myshop-cover-placeholder">Chưa có ảnh bìa</span>
            )}

            {!editing && !coverUploading && <div className="btn-upload-icon">📷</div>}

            {coverUploading && (
              <div className="upload-loading-overlay">
                <div className="spinner" />
              </div>
            )}
          </div>

          {/* Logo + Tên + Trạng thái */}
          <div className="myshop-avatar-container">
            <div
              className={`myshop-avatar ${logoUploading ? 'loading' : ''}`}
              onClick={() => !editing && !logoUploading && logoInputRef.current?.click()}
            >
              {shop.logoUrl ? <img src={shop.logoUrl} alt="Logo" /> : <span>Logo</span>}

              {!editing && !logoUploading && <div className="btn-upload-icon">📷</div>}

              {logoUploading && (
                <div className="upload-loading-overlay">
                  <div className="spinner" />
                </div>
              )}
            </div>

            <div className="myshop-name-block">
              <h1 className="myshop-name">{shop.name}</h1>
              <span className={`status-badge status-${shop.status.toLowerCase()}`}>
                {shop.status}
              </span>
            </div>
          </div>
        </div>

        {/* STATS */}
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

        {/* INFO / EDIT FORM */}
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
                <span className="info-val">{shop.shopPhone || '(Chưa cập nhật)'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Email:</span>
                <span className="info-val">{shop.email || '(Chưa cập nhật)'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Link Shop:</span>
                <span className="info-val">@{shop.slug}</span>
              </div>
            </div>

            <div className="info-column">
              <h3>Chi tiết Shop</h3>
              <div className="info-row">
                <span className="info-key">Mô tả:</span>
                <span className="info-val">{shop.description || 'Chưa có mô tả.'}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Địa chỉ:</span>
                <span className="info-val" style={{ lineHeight: '1.4' }}>
                  {shop.shopAddress || 'Chưa cập nhật địa chỉ'}
                </span>
              </div>
            </div>
          </div>
        )}

        {editing && form && (
          <div className="edit-form-wrapper">
            <h2 className="edit-form-title">Chỉnh sửa thông tin Shop</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="edit-form-row">
                <label className="form-label">Tên Shop</label>
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
                <label className="form-label">Địa chỉ hành chính</label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) =>
                    setForm((p) => (p ? { ...p, shopAddress: full } : null))
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((p) => (p ? { ...p, shopLat: lat, shopLng: lng } : null))
                  }
                />
              </div>

              <div className="edit-form-row">
                <label className="form-label">Ghim vị trí trên bản đồ</label>
                <div className="edit-map-wrapper">
                  <LocationPicker
                    address={form.shopAddress}
                    lat={form.shopLat}
                    lng={form.shopLng}
                    onChange={({ lat, lng }) =>
                      setForm((p) =>
                        p
                          ? {
                              ...p,
                              shopLat: lat || '',
                              shopLng: lng || '',
                            }
                          : null,
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
                  onClick={() => setEditing(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ✅ NEW: QUẢN LÝ ĐƠN HÀNG */}
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

          {shopOrdersLoading && <p className="myshop-products-loading">Đang tải đơn hàng...</p>}
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
                            <span style={{ fontSize: 12, opacity: 0.7 }}>{o.addressSnapshot?.phone || '-'}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 340 }}>
                          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
                            {o.addressSnapshot?.formattedAddress || '-'}
                          </div>
                        </td>
                        <td className="shop-table-price">
                          {new Intl.NumberFormat('vi-VN').format(Number(o.total))} VND
                        </td>
                        <td>
                          <span className="shop-status-pill" data-status={o.shippingStatus}>
                            {labelShipping(o.shippingStatus)}
                          </span>
                        </td>
                        <td>
                          {nextShippingOptions(o.shippingStatus).length === 0 ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn-secondary btn-secondary--small"
                                onClick={() => void openOrderDetail(o.id)}
                              >
                                Xem
                              </button>
                              <button type="button" className="btn-secondary btn-secondary--small" disabled>
                                Đã kết thúc
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                                  const v = e.target.value as ShippingStatus;
                                  if (v) void updateShipping(o.id, v);
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    className="btn-secondary btn-secondary--small"
                    disabled={shopOrdersPage <= 1}
                    onClick={() => loadShopOrders(Math.max(1, shopOrdersPage - 1))}
                  >
                    ← Trang trước
                  </button>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Trang {shopOrdersPage}/{shopOrdersTotalPages}
                  </div>
                  <button
                    className="btn-secondary btn-secondary--small"
                    disabled={shopOrdersPage >= shopOrdersTotalPages}
                    onClick={() => loadShopOrders(Math.min(shopOrdersTotalPages, shopOrdersPage + 1))}
                  >
                    Trang sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        <div className="myshop-products-section">
          <div className="action-bar">
            <h2 className="section-title">Danh sách sản phẩm</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/me/products')}
            >
              Quản lý sản phẩm
            </button>
          </div>

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
                        Chưa có sản phẩm nào.
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
                                alt=""
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
                            onClick={() => navigate(`/me/products/${p.id}/edit`)}
                            style={{ marginRight: 8 }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-secondary--small"
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
                <div className="shop-order-modal-subtitle">{orderDetail?.code ? `Mã: ${orderDetail.code}` : ''}</div>
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
                    <b>Khách:</b> {orderDetail.addressSnapshot?.fullName || '-'} • {orderDetail.addressSnapshot?.phone || '-'}
                  </div>
                  <div>
                    <b>Địa chỉ:</b> {orderDetail.addressSnapshot?.formattedAddress || '-'}
                  </div>
                  <div>
                    <b>Trạng thái:</b> {labelShipping(orderDetail.shippingStatus)}
                  </div>
                  <div>
                    <b>Tổng:</b> {new Intl.NumberFormat('vi-VN').format(Number(orderDetail.total))} VND
                  </div>
                </div>

                <div style={{ marginTop: 12, fontWeight: 800 }}>Sản phẩm</div>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {(orderDetail.items || []).map((it) => (
                    <div key={it.id} className="shop-order-item-row">
                      <div className="shop-order-item-img">
                        {it.imageSnapshot ? (
                          <img src={it.imageSnapshot} alt="" />
                        ) : (
                          <div className="shop-order-item-img-ph">📦</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{it.nameSnapshot}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
                          {new Intl.NumberFormat('vi-VN').format(Number(it.price))} VND × {it.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {new Intl.NumberFormat('vi-VN').format(Number(it.totalLine))} VND
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
