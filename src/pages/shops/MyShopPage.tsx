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
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  if (!shop) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Shop của tôi</h1>
        {error && (
          <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
        )}
        <p>Bạn chưa có shop.</p>
        <Link to="/shops/register">Đăng ký shop ngay</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Shop của tôi</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
      )}
      {successMsg && (
        <div style={{ color: 'green', marginBottom: 12 }}>
          {successMsg}
        </div>
      )}

      {/* Thông tin shop */}
      {!editing && (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>Tên shop:</strong> {shop.name}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Slug:</strong> {shop.slug}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Trạng thái:</strong> {shop.status}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Email:</strong> {shop.email || '-'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Mô tả:</strong> {shop.description || '-'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Địa chỉ:</strong> {shop.shopAddress || '-'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Toạ độ:</strong>{' '}
            {shop.shopLat && shop.shopLng
              ? `${shop.shopLat}, ${shop.shopLng}`
              : '-'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Place ID:</strong> {shop.shopPlaceId || '-'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>SĐT:</strong> {shop.shopPhone || '-'}
          </div>

          <button onClick={() => setEditing(true)}>Chỉnh sửa</button>
        </>
      )}

      {/* Form edit shop */}
      {editing && form && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label>
              Tên shop
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Địa chỉ / Vị trí trên bản đồ
              <LocationPicker
                address={form.shopAddress}
                lat={form.shopLat}
                lng={form.shopLng}
                onChange={({ address, lat, lng }) => {
                  setForm((prev) => {
                    if (!prev) return prev; // vẫn là null nếu chưa có form

                    return {
                      ...prev,
                      shopAddress: address ?? prev.shopAddress,
                      shopLat: lat ?? prev.shopLat,
                      shopLng: lng ?? prev.shopLng,
                    };
                  });
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label>
                Vĩ độ (lat)
                <input
                  type="number"
                  name="shopLat"
                  step="0.0000001"
                  value={form.shopLat}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8 }}
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Kinh độ (lng)
                <input
                  type="number"
                  name="shopLng"
                  step="0.0000001"
                  value={form.shopLng}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8 }}
                />
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Google Place ID
              <input
                type="text"
                name="shopPlaceId"
                value={form.shopPlaceId}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Số điện thoại
              <input
                type="text"
                name="shopPhone"
                value={form.shopPhone}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Lưu thay đổi</button>
            <button type="button" onClick={() => setEditing(false)}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* =================================================== */}
      {/* SẢN PHẨM CỦA SHOP */}
      {/* =================================================== */}

      <hr style={{ margin: '24px 0' }} />
      <h2>Sản phẩm của shop</h2>

      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() =>
            setShowCreateProduct((prev) => !prev)
          }
        >
          {showCreateProduct ? 'Đóng form thêm sản phẩm' : '+ Thêm sản phẩm'}
        </button>
      </div>

      {showCreateProduct && (
        <form
          onSubmit={handleCreateProductSubmit}
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid #ccc',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label>
              Tên sản phẩm
              <input
                type="text"
                name="title"
                value={createForm.title}
                onChange={handleCreateInputChange}
                style={{ width: '100%', padding: 8 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Giá (VND)
              <input
                type="number"
                name="price"
                value={createForm.price}
                onChange={handleCreateInputChange}
                style={{ width: '100%', padding: 8 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Tồn kho ban đầu
              <input
                type="number"
                name="stock"
                value={createForm.stock}
                onChange={handleCreateInputChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Mô tả
              <textarea
                name="description"
                value={createForm.description}
                onChange={handleCreateInputChange}
                rows={3}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Ảnh sản phẩm (tối đa 10 ảnh)
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCreateImagesChange}
              />
            </label>
          </div>

          <button type="submit" disabled={creatingProduct}>
            {creatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
        </form>
      )}

      {productsLoading && <div>Đang tải sản phẩm...</div>}
      {productsError && (
        <div style={{ color: 'red' }}>{productsError}</div>
      )}

      {!productsLoading && products.length === 0 && (
        <div>Chưa có sản phẩm nào.</div>
      )}

      {products.length > 0 && (
  <table
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: 8,
    }}
  >
    <thead>
      <tr>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>ID</th>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Tên</th>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Ảnh</th>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Giá</th>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Trạng thái</th>
        <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Hành động</th>
      </tr>
    </thead>
    <tbody>
      {products.map((p) => (
        <tr key={p.id}>
          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{p.id}</td>
          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{p.title}</td>

          {/* Cột ảnh */}
          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
            {p.thumbnailUrl ? (
              <img
                src={p.thumbnailUrl}
                alt={p.title}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
            ) : (
              <span style={{ fontSize: 12, color: '#999' }}>Không có ảnh</span>
            )}
          </td>

          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
            {p.price} {p.currency}
          </td>
          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{p.status}</td>
          <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
            <button
              type="button"
              onClick={() => navigate(`/me/products/${p.id}/variants`)}
            >
              Quản lý biến thể
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

    </div>
  );
};

export default MyShopPage;
