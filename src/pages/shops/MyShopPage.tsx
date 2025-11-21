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

import type { ProductListItem } from '../../api/types';
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
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '18px',
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!shop) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            background: '#f8f9fa',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            🏬
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '20px',
            }}
          >
            Shop của tôi
          </h1>
          {error && (
            <div
              style={{
                color: '#dc2626',
                marginBottom: '16px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Bạn chưa có shop.
          </p>
          <Link
            to="/shops/register"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: '#667eea',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Đăng ký shop ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          background: '#f8f9fa',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            🏬
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Shop của tôi
          </h1>
        </div>

        {error && (
          <div
            style={{
              color: '#dc2626',
              marginBottom: '16px',
              padding: '12px',
              background: '#fee2e2',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              color: '#16a34a',
              marginBottom: '16px',
              padding: '12px',
              background: '#dcfce7',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {successMsg}
          </div>
        )}

        <section
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '15px',
            marginBottom: '24px',
            background: '#fff',
          }}
        >
          {!editing && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Tên shop:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.name}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Slug:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.slug}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Trạng thái:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.status}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Email:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.email || '-'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Mô tả:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.description || '-'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Địa chỉ:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.shopAddress || '-'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Toạ độ:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.shopLat && shop.shopLng
                      ? `${shop.shopLat}, ${shop.shopLng}`
                      : '-'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    Place ID:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.shopPlaceId || '-'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>
                    SĐT:
                  </strong>
                  <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                    {shop.shopPhone || '-'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                Chỉnh sửa
              </button>
            </>
          )}

          {editing && form && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Tên shop
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Địa chỉ / Vị trí trên bản đồ
                </label>
                <div
                  style={{
                    borderRadius: '15px',
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                  }}
                >
                  <LocationPicker
                    address={form.shopAddress}
                    lat={form.shopLat}
                    lng={form.shopLng}
                    onChange={({ address, lat, lng }) => {
                      setForm((prev) => {
                        if (!prev) return prev;

                        return {
                          ...prev,
                          shopAddress: address ?? prev.shopAddress,
                          shopLat: lat ?? prev.shopLat,
                          shopLng: lng ?? prev.shopLng,
                        };
                      });
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#555',
                      fontWeight: '500',
                    }}
                  >
                    Vĩ độ (lat)
                  </label>
                  <input
                    type="number"
                    name="shopLat"
                    step="0.0000001"
                    value={form.shopLat}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '25px',
                      border: '1px solid #ddd',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                    onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#555',
                      fontWeight: '500',
                    }}
                  >
                    Kinh độ (lng)
                  </label>
                  <input
                    type="number"
                    name="shopLng"
                    step="0.0000001"
                    value={form.shopLng}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '25px',
                      border: '1px solid #ddd',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                    onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Google Place ID
                </label>
                <input
                  type="text"
                  name="shopPlaceId"
                  value={form.shopPlaceId}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="shopPhone"
                  value={form.shopPhone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </section>

        <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <section
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '15px',
            background: '#fff',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '20px',
            }}
          >
            Sản phẩm của shop
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowCreateProduct((prev) => !prev)}
              style={{
                padding: '12px 24px',
                background: showCreateProduct ? '#9ca3af' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
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
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  name="title"
                  value={createForm.title}
                  onChange={handleCreateInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Giá (VND)
                </label>
                <input
                  type="number"
                  name="price"
                  value={createForm.price}
                  onChange={handleCreateInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Tồn kho ban đầu
                </label>
                <input
                  type="number"
                  name="stock"
                  value={createForm.stock}
                  onChange={handleCreateInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateInputChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '15px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#555',
                    fontWeight: '500',
                  }}
                >
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
                style={{
                  width: '100%',
                  padding: '14px',
                  background: creatingProduct ? '#9ca3af' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: creatingProduct ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {creatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}
              </button>
            </form>
          )}

          {productsLoading && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
              }}
            >
              Đang tải sản phẩm...
            </div>
          )}
          {productsError && (
            <div
              style={{
                color: '#dc2626',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {productsError}
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
              }}
            >
              Chưa có sản phẩm nào.
            </div>
          )}

          {products.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: '#fff',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      Tên
                    </th>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      Ảnh
                    </th>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      Giá
                    </th>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      Trạng thái
                    </th>
                    <th
                      style={{
                        borderBottom: '2px solid #e5e7eb',
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        background: '#f9fafb',
                      }}
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {p.id}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {p.title}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                        }}
                      >
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: '#999' }}>
                            Không có ảnh
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {p.price} {p.currency}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {p.status}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/me/products/${p.id}/variants`)}
                          style={{
                            padding: '8px 16px',
                            background: '#667eea',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
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
