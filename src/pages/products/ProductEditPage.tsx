import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPublicProductDetail,
  updateProduct,
} from '../../api/products.api';
import type {
  ProductDetail,
  ApiResponse,
  UpdateProductDto,
} from '../../api/types';
import './style/ProductEditPage.css';

type ProductImageLike = {
  id: number;
  url?: string;
  imageUrl?: string;
  isMain?: boolean;
  is_main?: boolean;
};

export default function ProductEditPage() {
  const params = useParams();
  const navigate = useNavigate();
  const productId = params.id ? Number(params.id) : 0;

  const [form, setForm] = useState<{
    title: string;
    description: string;
    price: number;
    stock: number;
    status: string;
  }>({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'ACTIVE',
  });

  const [original, setOriginal] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<ProductImageLike[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const unwrap = <T,>(res: any): T => {
    if (res && typeof res === 'object') {
      if ('success' in res) return res.data as T;
      if ('data' in res) return res.data as T;
    }
    return (res as ApiResponse<T>).data;
  };

  const extractImages = (detail: any): ProductImageLike[] => {
    const arr =
      detail?.images ??
      detail?.productImages ??
      detail?.product_images ??
      detail?.productImages?.items ??
      [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x: any) => ({
        id: Number(x.id),
        url: x.url ?? x.imageUrl ?? x.image_url,
        imageUrl: x.imageUrl ?? x.url ?? x.image_url,
        isMain: Boolean(x.isMain ?? x.is_main),
        is_main: Boolean(x.is_main ?? x.isMain),
      }))
      .filter((x) => x.id && (x.url || x.imageUrl));
  };

  const mainImageUrl = useMemo(() => {
    const main = images.find((x) => x.isMain || x.is_main);
    return (
      (main?.url || main?.imageUrl) ??
      (images[0]?.url || images[0]?.imageUrl)
    );
  }, [images]);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    (async () => {
      try {
        const detailRes = await getPublicProductDetail(productId);
        const detail = unwrap<ProductDetail>(detailRes);

        setOriginal(detail);
        setImages(extractImages(detail));

        setForm({
          title: detail.title,
          description: detail.description || '',
          price: Number(detail.price),
          stock: detail.stock,
          status: detail.status,
        });
      } catch (err) {
        console.error(err);
        setError('Không tải được sản phẩm.');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const body: UpdateProductDto = {
        title: form.title,
        description: form.description,
        price: form.price,
        stock: form.stock,
        status: form.status,
      };

      await updateProduct(productId, body);
      setMessage('Cập nhật sản phẩm thành công.');
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError('Slug/sku/tổ hợp bị trùng (409).');
      } else {
        setError(
          err?.response?.data?.message || 'Lưu sản phẩm thất bại.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const hint = (text?: any) =>
    text !== undefined && text !== null && String(text).trim() !== ''
      ? String(text)
      : '(trống)';

  if (!productId) {
    return (
      <div className="product-edit-page">
        <div className="product-edit-card product-edit-card-small">
          Thiếu productId trên URL.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-edit-page">
        <div className="product-edit-card product-edit-card-small">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="product-edit-page">
      <div className="product-edit-card">
        {/* Top bar */}
        <div className="product-edit-topbar">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/me/products')}
          >
            ← Quản lý sản phẩm
          </button>

          <button
            type="button"
            className="btn-green"
            onClick={() =>
              navigate(`/me/products/${productId}/variants`)
            }
          >
            Quản lý biến thể
          </button>
        </div>

        {/* Header */}
        <div className="product-edit-header">
          <div className="product-edit-icon">✏️</div>
          <h1 className="product-edit-title">
            Sửa sản phẩm #{productId}
          </h1>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {message && <div className="alert-success">{message}</div>}

        {/* Preview ảnh hiện tại */}
        <div className="product-edit-preview">
          <div className="product-edit-preview-image">
            {mainImageUrl && <img src={mainImageUrl} alt="" />}
          </div>
          <div className="product-edit-preview-info">
            <div className="product-edit-preview-name">
              {hint(original?.title)}
            </div>
            <div className="product-edit-preview-meta">
              Ảnh sản phẩm: {images.length || 0} (ảnh chính ưu tiên
              isMain)
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(`/products/${productId}`)}
          >
            Xem public
          </button>
        </div>

        {/* Form chỉnh sửa */}
        <form className="product-edit-form" onSubmit={handleSubmit}>
          <div className="product-edit-field">
            <label className="product-edit-label">Tên sản phẩm</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="product-edit-input"
            />
            <div className="product-edit-hint-old">
              Trước đó: {hint(original?.title)}
            </div>
          </div>

          <div className="product-edit-field">
            <label className="product-edit-label">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="product-edit-textarea"
            />
            <div className="product-edit-hint-old">
              Trước đó: {hint(original?.description)}
            </div>
          </div>

          <div className="product-edit-row-grid">
            <div className="product-edit-field">
              <label className="product-edit-label">Giá</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                min={0}
                className="product-edit-input"
              />
              <div className="product-edit-hint-old">
                Trước đó: {hint((original as any)?.price)}
              </div>
            </div>

            <div className="product-edit-field">
              <label className="product-edit-label">Tồn kho</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                min={0}
                className="product-edit-input"
              />
              <div className="product-edit-hint-old">
                Trước đó: {hint(original?.stock)}
              </div>
            </div>
          </div>

          <div className="product-edit-field">
            <label className="product-edit-label">Trạng thái</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="product-edit-select"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
            <div className="product-edit-hint-old">
              Trước đó: {hint(original?.status)}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="product-edit-submit"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <div className="product-edit-hint">
          Gợi ý: Nếu bạn muốn cập nhật giá/tồn kho theo từng biến thể
          hoặc gán ảnh cho biến thể, hãy vào{' '}
          <button
            type="button"
            className="product-edit-hint-button"
            onClick={() =>
              navigate(`/me/products/${productId}/variants`)
            }
          >
            trang quản lý biến thể
          </button>
          .
        </div>
      </div>
    </div>
  );
}
