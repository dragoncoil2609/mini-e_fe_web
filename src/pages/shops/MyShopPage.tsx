// src/pages/shops/MyShopPage.tsx
import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyShop, updateShop } from '../../api/shop.api';
import {
  getPublicProducts,
  createProductMultipart,
} from '../../api/products.api';
import type { Shop } from '../../api/types';
import LocationPicker from '../../components/LocationPicker';
import VietnamAddressSelector from '../../components/VietnamAddressSelector';

import type { ProductListItem } from '../../api/types';
import './MyShopPage.css';

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
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductFormState>({
    title: '',
    price: '',
    stock: '',
    description: '',
    images: null,
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  const navigate = useNavigate();

  // ================= SHOP =================

  const loadMyShop = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyShop();
      if (res.success) {
        setShop(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email || '',
          description: res.data.description || '',
          shopAddress: res.data.shopAddress || '',
          shopLat: res.data.shopLat || '',
          shopLng: res.data.shopLng || '',
          shopPlaceId: res.data.shopPlaceId || '',
          shopPhone: res.data.shopPhone || '',
        });

        // sau khi có shop → load products của shop
        void loadProducts(res.data.id);
      } else {
        setError(res.message || 'Không lấy được thông tin shop.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Bạn chưa có shop hoặc có lỗi xảy ra.';
      setError(msg);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyShop();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop || !form) return;

    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {};
      if (form.name.trim() && form.name.trim() !== shop.name) {
        payload.name = form.name.trim();
      }
      payload.email = form.email.trim() || null;
      payload.description = form.description.trim() || null;
      payload.shopAddress = form.shopAddress.trim() || null;
      payload.shopPlaceId = form.shopPlaceId.trim() || null;
      payload.shopPhone = form.shopPhone.trim() || null;

      payload.shopLat = form.shopLat.trim()
        ? parseFloat(form.shopLat)
        : null;
      payload.shopLng = form.shopLng.trim()
        ? parseFloat(form.shopLng)
        : null;

      const res = await updateShop(shop.id, payload);
      if (res.success) {
        setShop(res.data);
        setSuccessMsg('Cập nhật shop thành công!');
        setEditing(false);
      } else {
        setError(res.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Cập nhật thất bại. Vui lòng thử lại.',
      );
    }
  };

  // ================= PRODUCTS CỦA SHOP =================

  const loadProducts = async (shopId: number) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      // gọi GET /products?page=1&limit=50&shopId=...
      const res = await getPublicProducts({
        page: 1,
        limit: 50,
        shopId,
      });
      if (res.success) {
        setProducts(res.data.items as any);
      } else {
        setProductsError(res.message || 'Không lấy được sản phẩm.');
      }
    } catch (err: any) {
      setProductsError(
        err?.response?.data?.message ||
          'Không lấy được danh sách sản phẩm.',
      );
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCreateInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateImagesChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    setCreateForm((prev) => ({
      ...prev,
      images: files,
    }));
  };

  const handleCreateProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setError(null);
    setSuccessMsg(null);
    setCreatingProduct(true);

    try {
      const fd = new FormData();
      fd.append('title', createForm.title.trim());
      fd.append('price', createForm.price.trim());
      if (createForm.stock.trim()) {
        fd.append('stock', createForm.stock.trim());
      }
      if (createForm.description.trim()) {
        fd.append('description', createForm.description.trim());
      }

      if (createForm.images && createForm.images.length > 0) {
        Array.from(createForm.images).forEach((file) => {
          fd.append('images', file);
        });
      }

      const res = await createProductMultipart(fd);
      if (res.success) {
        const newProduct = res.data;
        setSuccessMsg('Tạo sản phẩm thành công!');

        // reload list sản phẩm của shop
        void loadProducts(shop.id);

        // reset form
        setCreateForm({
          title: '',
          price: '',
          stock: '',
          description: '',
          images: null,
        });
        setShowCreateProduct(false);

        // CHUYỂN SANG TRANG QUẢN LÝ BIẾN THỂ
        navigate(`/me/products/${newProduct.id}/variants`);
      } else {
        setError(res.message || 'Tạo sản phẩm thất bại.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Tạo sản phẩm thất bại. Vui lòng thử lại.',
      );
    } finally {
      setCreatingProduct(false);
    }
  };

  // ================= RENDER =================

  if (loading) {
    return (
      <div className="shop-page-loading">
        Đang tải...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="shop-page-no-shop-container">
        <div className="shop-page-no-shop-card">
          <div className="shop-header-icon">🏬</div>
          <h1 className="shop-header-title">Shop của tôi</h1>
          {error && <div className="shop-message-error">{error}</div>}
          <p className="shop-empty-text">Bạn chưa có shop.</p>
          <Link to="/shops/register" className="shop-link-button">
            Đăng ký shop ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page-container">
      <div className="shop-page-card">
        <div className="shop-header">
          <div className="shop-header-icon">🏬</div>
          <h1 className="shop-header-title">Shop của tôi</h1>
        </div>

        {error && <div className="shop-message-error">{error}</div>}
        {successMsg && <div className="shop-message-success">{successMsg}</div>}

        <section className="shop-section">
          {!editing && (
            <>
              <div className="shop-grid-info">
                <div>
                  <strong className="shop-info-label">Tên shop:</strong>
                  <div className="shop-info-value">{shop.name}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Slug:</strong>
                  <div className="shop-info-value">{shop.slug}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Trạng thái:</strong>
                  <div className="shop-info-value">{shop.status}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Email:</strong>
                  <div className="shop-info-value">{shop.email || '-'}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Mô tả:</strong>
                  <div className="shop-info-value">{shop.description || '-'}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Địa chỉ:</strong>
                  <div className="shop-info-value">{shop.shopAddress || '-'}</div>
                </div>
                <div>
                  <strong className="shop-info-label">Toạ độ:</strong>
                  <div className="shop-info-value">
                    {shop.shopLat && shop.shopLng
                      ? `${shop.shopLat}, ${shop.shopLng}`
                      : '-'}
                  </div>
                </div>
                <div>
                  <strong className="shop-info-label">Place ID:</strong>
                  <div className="shop-info-value">{shop.shopPlaceId || '-'}</div>
                </div>
                <div>
                  <strong className="shop-info-label">SĐT:</strong>
                  <div className="shop-info-value">{shop.shopPhone || '-'}</div>
                </div>
              </div>

              <button onClick={() => setEditing(true)} className="shop-primary-button">
                Chỉnh sửa
              </button>
            </>
          )}

          {editing && form && (
            <form onSubmit={handleSubmit}>
              <div className="shop-register-form-group">
                <label className="shop-form-label">Tên shop</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="shop-input"
                />
              </div>

              <div className="shop-register-form-group">
                <label className="shop-form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="shop-input"
                />
              </div>

              {/* Địa chỉ 3 cấp + địa chỉ cụ thể */}
              <div className="shop-register-form-group">
                <label className="shop-form-label">Địa chỉ shop</label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) => {
                    setForm((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        shopAddress: full,
                      };
                    });
                  }}
                />
              </div>

              {/* Map */}
              <div className="shop-register-form-group">
                <label className="shop-form-label">Vị trí trên bản đồ</label>
                <div className="shop-map-wrapper">
                  <LocationPicker
                    address={form.shopAddress}
                    lat={form.shopLat}
                    lng={form.shopLng}
                    onChange={({ address, lat, lng }) => {
                      setForm((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          shopAddress:
                            address ?? prev.shopAddress,
                          shopLat: lat ?? prev.shopLat,
                          shopLng: lng ?? prev.shopLng,
                        };
                      });
                    }}
                  />
                </div>
              </div>

              <div className="shop-row">
                <div className="shop-row-item">
                  <label className="shop-form-label">Vĩ độ (lat)</label>
                  <input
                    type="number"
                    name="shopLat"
                    step="0.0000001"
                    value={form.shopLat}
                    onChange={handleChange}
                    className="shop-input"
                  />
                </div>
                <div className="shop-row-item">
                  <label className="shop-form-label">Kinh độ (lng)</label>
                  <input
                    type="number"
                    name="shopLng"
                    step="0.0000001"
                    value={form.shopLng}
                    onChange={handleChange}
                    className="shop-input"
                  />
                </div>
              </div>

              <div className="shop-register-form-group">
                <label className="shop-form-label">Google Place ID</label>
                <input
                  type="text"
                  name="shopPlaceId"
                  value={form.shopPlaceId}
                  onChange={handleChange}
                  className="shop-input"
                />
              </div>

              <div className="shop-register-form-group">
                <label className="shop-form-label">Số điện thoại</label>
                <input
                  type="text"
                  name="shopPhone"
                  value={form.shopPhone}
                  onChange={handleChange}
                  className="shop-input"
                />
              </div>

              <div className="shop-row">
                <button type="submit" className="shop-primary-button shop-row-item">
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="shop-secondary-button shop-row-item"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </section>

        <hr className="shop-hr" />

        {/* SẢN PHẨM CỦA SHOP */}
        <section className="shop-section">
          <h2 className="shop-section-title">Sản phẩm của shop</h2>

          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() =>
                setShowCreateProduct((prev) => !prev)
              }
              className={
                showCreateProduct
                  ? 'shop-toggle-button shop-toggle-button--secondary'
                  : 'shop-toggle-button'
              }
            >
              {showCreateProduct
                ? 'Đóng form thêm sản phẩm'
                : '+ Thêm sản phẩm'}
            </button>
          </div>

          {showCreateProduct && (
            <form
              onSubmit={handleCreateProductSubmit}
              style={{
                marginBottom: '24px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '15px',
                background: '#f9fafb',
              }}
            >
              <div className="shop-register-form-group">
                <label className="shop-form-label">Tên sản phẩm</label>
                <input
                  type="text"
                  name="title"
                  value={createForm.title}
                  onChange={handleCreateInputChange}
                  required
                  className="shop-input"
                />
              </div>
              <div className="shop-register-form-group">
                <label className="shop-form-label">Giá (VND)</label>
                <input
                  type="number"
                  name="price"
                  value={createForm.price}
                  onChange={handleCreateInputChange}
                  required
                  className="shop-input"
                />
              </div>
              <div className="shop-register-form-group">
                <label className="shop-form-label">Tồn kho ban đầu</label>
                <input
                  type="number"
                  name="stock"
                  value={createForm.stock}
                  onChange={handleCreateInputChange}
                  className="shop-input"
                />
              </div>
              <div className="shop-register-form-group">
                <label className="shop-form-label">Mô tả</label>
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateInputChange}
                  rows={3}
                  className="shop-textarea"
                />
              </div>
              <div className="shop-register-form-group">
                <label className="shop-form-label">
                  Ảnh sản phẩm (tối đa 10 ảnh)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCreateImagesChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '15px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={creatingProduct}
                className="shop-primary-button"
              >
                {creatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}
              </button>
            </form>
          )}

          {productsLoading && (
            <div className="shop-empty-text">
              Đang tải sản phẩm...
            </div>
          )}
          {productsError && (
            <div className="shop-message-error">
              {productsError}
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="shop-empty-text">
              Chưa có sản phẩm nào.
            </div>
          )}

          {products.length > 0 && (
            <div className="shop-table-wrapper">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Ảnh</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.title}</td>
                      <td>
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            className="shop-product-thumb"
                          />
                        ) : (
                          <span className="shop-product-thumb--empty">
                            Không có ảnh
                          </span>
                        )}
                      </td>
                      <td>
                        {p.price} {p.currency}
                      </td>
                      <td>{p.status}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/me/products/${p.id}/variants`,
                            )
                          }
                          className="shop-variants-button"
                        >
                          Quản lý biến thể
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyShopPage;
