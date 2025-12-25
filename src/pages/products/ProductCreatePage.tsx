import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductMultipart } from '../../api/products.api';
import { getPublicCategories } from '../../api/categories.api';
import type { Category, ApiResponse } from '../../api/types';
import './style/ProductCreatePage.css';

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<{
    title: string;
    price: string;
    stock: string;
    description: string;
    categoryId: string; // '' = chưa chọn
    images: FileList | null;
  }>({
    title: '',
    price: '',
    stock: '',
    description: '',
    categoryId: '',
    images: null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const res = await getPublicCategories({ isActive: true });
        const ok = (res as any)?.success ?? true;
        const data = ok ? (res as ApiResponse<Category[]>).data : [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        // không block tạo product, chỉ không có danh mục
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const previewUrls = useMemo(() => {
    if (!form.images) return [];
    return Array.from(form.images).map((f) => URL.createObjectURL(f));
  }, [form.images]);

  const handleChangeInput =
    (field: 'title' | 'price' | 'stock' | 'description') =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, categoryId: e.target.value }));
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, images: e.target.files }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('price', form.price);
      fd.append('stock', form.stock || '0');
      fd.append('description', form.description);

      // ✅ categoryId (FormData chỉ nhận string|Blob)
      if (form.categoryId) {
        fd.append('categoryId', String(form.categoryId));
      }

      if (form.images) {
        Array.from(form.images).forEach((f) => fd.append('images', f));
      }

      const res = await createProductMultipart(fd);
      const ok = (res as any)?.success ?? true;
      if (!ok) throw new Error((res as any)?.message || 'CREATE_PRODUCT_FAILED');

      const created = (res as any)?.data ?? (res as any);
      const id = Number(created?.id);
      if (!id) throw new Error('Không nhận được id sản phẩm.');

      navigate(`/me/products/${id}/variants`, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Tạo sản phẩm thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const sortedCats = useMemo(() => {
    // nếu BE có sortOrder thì ưu tiên, không có thì sort theo name
    return [...categories].sort((a, b) => {
      const soA = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (soA !== 0) return soA;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [categories]);

  return (
    <div className="product-create-page">
      <div className="product-create-card">
        {/* Top bar */}
        <div className="product-create-topbar">
          <button type="button" className="pc-btn-ghost" onClick={() => navigate('/me/products')}>
            ← Quản lý sản phẩm
          </button>
          <button type="button" className="pc-btn-ghost" onClick={() => navigate('/shops/me')}>
            Về shop của tôi
          </button>
        </div>

        {/* Header */}
        <div className="product-create-header">
          <div className="product-create-icon">✨</div>
          <h1 className="product-create-title">Tạo sản phẩm mới</h1>
        </div>

        {error && <div className="pc-error">{error}</div>}

        <form className="product-create-form" onSubmit={handleSubmit}>
          <div className="pc-field">
            <label className="pc-label">Tên sản phẩm</label>
            <input value={form.title} onChange={handleChangeInput('title')} required className="pc-input" />
          </div>

          {/* ✅ Category */}
          <div className="pc-field">
            <label className="pc-label">Danh mục</label>
            <select
              className="pc-input"
              value={form.categoryId}
              onChange={handleCategoryChange}
              disabled={loadingCats}
            >
              <option value="">{loadingCats ? 'Đang tải danh mục...' : '— Chọn danh mục —'}</option>
              {sortedCats.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.parentId ? `— ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pc-row-grid">
            <div className="pc-field">
              <label className="pc-label">Giá</label>
              <input
                type="number"
                value={form.price}
                onChange={handleChangeInput('price')}
                min={0}
                required
                className="pc-input"
              />
            </div>

            <div className="pc-field">
              <label className="pc-label">Tồn kho</label>
              <input
                type="number"
                value={form.stock}
                onChange={handleChangeInput('stock')}
                min={0}
                className="pc-input"
              />
            </div>
          </div>

          <div className="pc-field">
            <label className="pc-label">Mô tả</label>
            <textarea
              value={form.description}
              onChange={handleChangeInput('description')}
              rows={3}
              className="pc-textarea"
            />
          </div>

          <div className="pc-field">
            <label className="pc-label">Ảnh (có thể chọn nhiều)</label>
            <input type="file" multiple accept="image/*" onChange={handleImagesChange} />
          </div>

          {previewUrls.length > 0 && (
            <div className="pc-field">
              <div className="pc-images-preview-title">Preview ảnh đã chọn</div>
              <div className="pc-images-preview-grid">
                {previewUrls.map((u) => (
                  <div key={u} className="pc-images-preview-item">
                    <img src={u} alt="" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="product-create-submit">
            {saving ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>

          <div className="pc-note">
            Sau khi tạo xong, hệ thống sẽ tự chuyển bạn sang trang tạo biến thể (ProductVariantsPage).
          </div>
        </form>
      </div>
    </div>
  );
}
