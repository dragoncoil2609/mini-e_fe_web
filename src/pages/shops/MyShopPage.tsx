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
import {
  getProductsByShop,
  createProductMultipart,
} from '../../api/products.api';
import type { Shop, ProductListItem } from '../../api/types';
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

interface CreateProductFormState {
  title: string;
  price: string;
  stock: string;
  description: string;
  images: FileList | null;
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

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductFormState>({
    title: '',
    price: '',
    stock: '',
    description: '',
    images: null,
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const loadProducts = async (shopId: number) => {
    setProductsLoading(true);
    try {
      const res = await getProductsByShop(shopId, { page: 1, limit: 20 });
      if (res.success) {
        setProducts(res.data.items);
      }
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
      if (res.success) {
        const data = res.data as unknown as ShopWithStats;
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
      } else {
        setError(res.message || 'Lỗi tải shop.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Bạn chưa có shop hoặc lỗi kết nối.');
    } finally {
      setLoading(false);
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
      if (res.success) {
        setShop((prev) =>
          prev ? { ...prev, logoUrl: res.data.logoUrl } : null,
        );
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
      if (res.success) {
        setShop((prev) =>
          prev ? { ...prev, coverUrl: res.data.coverUrl } : null,
        );
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
      if (res.success) {
        setShop(res.data as unknown as ShopWithStats);
        setSuccessMsg('Cập nhật thông tin shop thành công!');
        setEditing(false);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật thông tin shop.');
    }
  };

  // --- HANDLE CREATE PRODUCT ---
  const handleCreateProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setCreatingProduct(true);
    try {
      const fd = new FormData();
      fd.append('title', createForm.title);
      fd.append('price', createForm.price);
      fd.append('stock', createForm.stock);
      fd.append('description', createForm.description);
      if (createForm.images) {
        Array.from(createForm.images).forEach((f) =>
          fd.append('images', f),
        );
      }
      const res = await createProductMultipart(fd);
      if (res.success) {
        alert('Tạo sản phẩm thành công!');
        setShowCreateProduct(false);
        setCreateForm({
          title: '',
          price: '',
          stock: '',
          description: '',
          images: null,
        });
        void loadProducts(shop.id);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo sản phẩm.');
    } finally {
      setCreatingProduct(false);
    }
  };

  // --- RENDER LOADING / EMPTY ---
  if (loading) {
    return (
      <div className="myshop-page-root">
        <div className="myshop-loading-card">
          Đang tải dữ liệu shop...
        </div>
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

        {successMsg && (
          <div className="myshop-success">{successMsg}</div>
        )}
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
            className={`myshop-cover ${
              !shop.coverUrl ? 'empty-cover' : ''
            } ${coverUploading ? 'loading' : ''}`}
            style={
              shop.coverUrl
                ? { backgroundImage: `url(${shop.coverUrl})` }
                : {}
            }
            onClick={() =>
              !editing &&
              !coverUploading &&
              coverInputRef.current?.click()
            }
          >
            {!shop.coverUrl && (
              <span className="myshop-cover-placeholder">
                Chưa có ảnh bìa
              </span>
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

          {/* Logo + Tên + Trạng thái */}
          <div className="myshop-avatar-container">
            <div
              className={`myshop-avatar ${
                logoUploading ? 'loading' : ''
              }`}
              onClick={() =>
                !editing &&
                !logoUploading &&
                logoInputRef.current?.click()
              }
            >
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt="Logo" />
              ) : (
                <span>Logo</span>
              )}

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
              <span
                className={`status-badge status-${shop.status.toLowerCase()}`}
              >
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
              <div className="stat-value">
                {formatCurrency(shop.totalRevenue)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Đơn hàng</div>
              <div className="stat-value">
                {shop.totalOrders || 0}
              </div>
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
                <span className="info-key">Địa chỉ:</span>
                <span className="info-val">
                  {shop.shopAddress || '(Chưa cập nhật)'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">SĐT:</span>
                <span className="info-val">
                  {shop.shopPhone || '(Chưa cập nhật)'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Email:</span>
                <span className="info-val">
                  {shop.email || '(Chưa cập nhật)'}
                </span>
              </div>
            </div>
            <div className="info-column">
              <h3>Chi tiết Shop</h3>
              <div className="info-row">
                <span className="info-key">Mô tả:</span>
                <span className="info-val">
                  {shop.description || 'Chưa có mô tả.'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Slug:</span>
                <span className="info-val">@{shop.slug}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Toạ độ:</span>
                <span className="info-val">
                  {shop.shopLat
                    ? `${shop.shopLat}, ${shop.shopLng}`
                    : 'Chưa định vị'}
                </span>
              </div>
            </div>
          </div>
        )}

        {editing && form && (
          <div className="edit-form-wrapper">
            <h2 className="edit-form-title">
              Chỉnh sửa thông tin Shop
            </h2>
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
                  <label className="form-label">
                    Số điện thoại
                  </label>
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
                <label className="form-label">
                  Địa chỉ hành chính
                </label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) =>
                    setForm((p) =>
                      p ? { ...p, shopAddress: full } : null,
                    )
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((p) =>
                      p
                        ? {
                            ...p,
                            shopLat: lat,
                            shopLng: lng,
                          }
                        : null,
                    )
                  }
                />
              </div>

              <div className="edit-form-row">
                <label className="form-label">
                  Ghim vị trí trên bản đồ
                </label>
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

        {/* DANH SÁCH SẢN PHẨM */}
        <div className="myshop-products-section">
          <div className="action-bar">
            <h2 className="section-title">Danh sách sản phẩm</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                setShowCreateProduct(!showCreateProduct)
              }
            >
              {showCreateProduct ? 'Đóng form' : '+ Thêm sản phẩm'}
            </button>
          </div>

          {showCreateProduct && (
            <form
              onSubmit={handleCreateProductSubmit}
              className="create-product-form"
            >
              <h4 className="create-product-title">
                Thêm sản phẩm mới
              </h4>

              <div className="edit-form-row">
                <label className="form-label">Tên sản phẩm</label>
                <input
                  className="form-input"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="edit-form-row edit-form-row--2col">
                <div className="edit-form-col">
                  <label className="form-label">Giá</label>
                  <input
                    type="number"
                    className="form-input"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        price: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="edit-form-col">
                  <label className="form-label">Kho</label>
                  <input
                    type="number"
                    className="form-input"
                    value={createForm.stock}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        stock: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="edit-form-row">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="edit-form-row">
                <label className="form-label">Ảnh</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      images: e.target.files,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={creatingProduct}
              >
                {creatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}
              </button>
            </form>
          )}

          {productsLoading ? (
            <p className="myshop-products-loading">
              Đang tải sản phẩm...
            </p>
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
                          <span
                            className="shop-status-pill"
                            data-status={p.status}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-secondary btn-secondary--small"
                            onClick={() =>
                              navigate(
                                `/me/products/${p.id}/variants`,
                              )
                            }
                          >
                            Chi tiết
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
    </div>
  );
};

export default MyShopPage;
