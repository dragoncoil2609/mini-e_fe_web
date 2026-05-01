import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicCategories } from '../../api/categories.api';
import { createProductMultipart } from '../../api/products.api';
import type { Category } from '../../api/types';
import './style/ProductCreatePage.css';

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const res = await getPublicCategories({ isActive: true });
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const sortA = a.sortOrder ?? 0;
      const sortB = b.sortOrder ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [categories]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Vui lòng nhập tên sản phẩm.');
      return;
    }

    if (Number(price) < 0) {
      setError('Giá sản phẩm không hợp lệ.');
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('price', String(Number(price)));
      if (description.trim()) fd.append('description', description.trim());
      if (categoryId > 0) fd.append('categoryId', String(categoryId));

      files.forEach((file) => {
        fd.append('images', file);
      });

      const res = await createProductMultipart(fd);

      if (!res.success || !res.data?.id) {
        throw new Error(res.message || 'Tạo sản phẩm thất bại.');
      }

      navigate(`/me/products/${res.data.id}/variants`, {
        replace: true,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Tạo sản phẩm thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="product-create-page">
      <div className="product-create-card">
        <div className="product-create-topbar">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/me/products')}
          >
            ← Quay lại
          </button>
        </div>

        <div className="product-create-header">
          <div className="product-create-icon">📦</div>
          <h1 className="product-create-title">Tạo sản phẩm mới</h1>
          <p className="product-create-subtitle">
            Sau khi tạo xong, bạn sẽ được chuyển sang trang tạo biến thể.
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form className="product-create-form" onSubmit={handleSubmit}>
          <div className="product-create-field">
            <label className="product-create-label">Tên sản phẩm</label>
            <input
              className="product-create-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          <div className="product-create-grid-2">
            <div className="product-create-field">
              <label className="product-create-label">Giá</label>
              <input
                className="product-create-input"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="product-create-field">
              <label className="product-create-label">Danh mục</label>
              <select
                className="product-create-input"
                value={String(categoryId)}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                disabled={loadingCats}
              >
                <option value="0">
                  {loadingCats ? 'Đang tải danh mục...' : '— Không chọn —'}
                </option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.parentId ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="product-create-field">
            <label className="product-create-label">Mô tả</label>
            <textarea
              className="product-create-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả sản phẩm"
            />
          </div>

          <div className="product-create-field">
            <label className="product-create-label">Ảnh sản phẩm</label>
            <input
              className="product-create-input"
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />
          </div>

          {previewUrls.length > 0 && (
            <div className="product-create-preview-grid">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="product-create-preview-item">
                  <img src={url} alt={`preview-${idx}`} />
                </div>
              ))}
            </div>
          )}

          <div className="product-create-note">
            Tồn kho sản phẩm sẽ được tự động tính bằng tổng tồn kho của các biến thể.
            Hiện tại sau khi tạo mới, tồn kho sản phẩm sẽ là <b>0</b>.
          </div>

          <div className="product-create-actions">
            <button type="submit" className="btn-green" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo sản phẩm'}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/me/products')}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}