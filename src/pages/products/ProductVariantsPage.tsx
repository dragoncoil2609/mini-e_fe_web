import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  generateProductVariants,
  getProductVariants,
  updateProductVariant,
  getManageProductDetail,
} from '../../api/products.api';
import './style/ProductVariantsPage.css';

type GenerateMode = 'add' | 'replace';

interface EditableVariant {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: string;
  imageId: string;
}

type ProductImageLike = {
  id: number;
  url?: string;
  imageUrl?: string;
  isMain?: boolean;
  is_main?: boolean;
};

interface OptionRow {
  key: string;
  name: string;
  values: string;
}

const uuid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const ProductVariantsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : 0;

  const [mode, setMode] = useState<GenerateMode>('add');
  const [options, setOptions] = useState<OptionRow[]>([
    { key: uuid(), name: 'Màu', values: 'Trắng,Đen' },
    { key: uuid(), name: 'Size', values: 'M,L' },
  ]);

  const [productImages, setProductImages] = useState<ProductImageLike[]>([]);
  const [variants, setVariants] = useState<EditableVariant[]>([]);

  const [loadingVariants, setLoadingVariants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const unwrap = <T,>(res: any): T => {
    if (res && typeof res === 'object') {
      if ('success' in res) return res.data as T;
      if ('data' in res) return res.data as T;
    }
    return res as T;
  };

  const extractImages = (detail: any): ProductImageLike[] => {
    const arr = detail?.images ?? detail?.productImages ?? detail?.product_images;
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
    const main = productImages.find((x) => x.isMain || x.is_main);
    return (main?.url || main?.imageUrl) ?? (productImages[0]?.url || productImages[0]?.imageUrl);
  }, [productImages]);

  const loadProductImages = async () => {
    if (!productId) return;
    try {
      const res = await getManageProductDetail(productId);
      const detail = unwrap<any>(res);
      setProductImages(extractImages(detail));
    } catch (e) {
      console.error(e);
    }
  };

  const loadVariants = async () => {
    if (!productId) return;
    setLoadingVariants(true);
    setError(null);

    try {
      const res = await getProductVariants(productId);
      const data = unwrap<any[]>(res) || [];
      const vs: EditableVariant[] = (data as any[]).map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: String(v.price ?? ''),
        stock: String(v.stock ?? 0),
        imageId: v.imageId !== null && v.imageId !== undefined ? String(v.imageId) : '',
      }));
      setVariants(vs);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không lấy được danh sách biến thể.');
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    if (productId) {
      void loadProductImages();
      void loadVariants();
    }
  }, [productId]);

  const normalizeOptionsPayload = () => {
    return options
      .map((o) => ({
        name: o.name.trim(),
        values: o.values
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }))
      .filter((o) => o.name && o.values.length > 0);
  };

  const handleGenerate = async () => {
    if (!productId) return;

    const normalized = normalizeOptionsPayload();
    if (normalized.length === 0) {
      setError('Vui lòng thêm ít nhất 1 option hợp lệ.');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = { options: normalized, mode };
      const res = await generateProductVariants(productId, payload);
      const data = unwrap<any[]>(res) || [];

      const vs: EditableVariant[] = (data as any[]).map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: String(v.price ?? ''),
        stock: String(v.stock ?? 0),
        imageId: v.imageId !== null && v.imageId !== undefined ? String(v.imageId) : '',
      }));

      setVariants(vs);
      setSuccessMsg('Sinh biến thể thành công.');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError('Tổ hợp biến thể đang bị trùng.');
      } else {
        setError(err?.response?.data?.message || 'Sinh biến thể thất bại.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleVariantFieldChange = (
    index: number,
    field: keyof EditableVariant,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? ({ ...v, [field]: value } as EditableVariant) : v)),
    );
  };

  const handleSaveAll = async () => {
    if (!productId || variants.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      for (const v of variants) {
        const body = {
          price: Number(v.price),
          stock: Number(v.stock),
          imageId: v.imageId ? Number(v.imageId) : null,
        };
        await updateProductVariant(productId, v.id, body);
      }

      setSuccessMsg('Lưu tất cả biến thể thành công.');
      await loadVariants();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cập nhật biến thể thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    if (options.length >= 5) return;
    setOptions((prev) => [...prev, { key: uuid(), name: '', values: '' }]);
  };

  const removeOption = (key: string) => {
    setOptions((prev) => prev.filter((o) => o.key !== key));
  };

  const updateOption = (key: string, patch: Partial<OptionRow>) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  };

  const handleOptionInputChange =
    (key: string, field: keyof OptionRow) => (e: ChangeEvent<HTMLInputElement>) => {
      updateOption(key, { [field]: e.target.value } as Partial<OptionRow>);
    };

  if (!productId) {
    return (
      <div className="variants-page">
        <div className="variants-card">Thiếu productId trên URL.</div>
      </div>
    );
  }

  return (
    <div className="variants-page">
      <div className="variants-card">
        <div className="variants-header">
          <div className="variants-avatar">
            {mainImageUrl ? <img src={mainImageUrl} alt="" /> : <span>📦</span>}
          </div>
          <h1 className="variants-title">Quản lý biến thể sản phẩm #{productId}</h1>
        </div>

        <div className="variants-links">
          <Link to="/me/products" className="variants-link">
            « Quản lý sản phẩm
          </Link>
          <Link to={`/me/products/${productId}/edit`} className="variants-link">
            « Sửa sản phẩm
          </Link>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {successMsg && <div className="alert-success">{successMsg}</div>}

        {productImages.length > 0 && (
          <section className="variants-section">
            <div className="variants-section-header">
              <h2 className="variants-section-title">Ảnh sản phẩm</h2>
              <div className="variants-section-subtitle">
                Chọn imageId cho từng biến thể nếu cần
              </div>
            </div>

            <div className="variants-images-grid">
              {productImages.map((img) => {
                const url = img.url || img.imageUrl || '';
                return (
                  <div key={img.id} className="variants-image-card">
                    {url && <img src={url} alt="" />}
                    <div className="variants-image-card-meta">
                      <span>ID: {img.id}</span>
                      {(img.isMain || img.is_main) && (
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>Main</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="variants-section">
          <div className="variants-section-header">
            <h2 className="variants-section-title">Sinh biến thể</h2>
            <button type="button" className="btn-main" onClick={addOption}>
              + Thêm option
            </button>
          </div>

          <p className="variants-section-subtitle">
            add: chỉ thêm tổ hợp mới. replace: xoá toàn bộ biến thể cũ và tạo lại.
          </p>

          <div className="variants-options-list">
            {options.map((opt, idx) => (
              <div className="variants-option-card" key={opt.key}>
                <div className="variants-option-header">
                  <div className="variants-option-title">Option #{idx + 1}</div>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => removeOption(opt.key)}
                    disabled={options.length <= 1}
                  >
                    Xoá option
                  </button>
                </div>

                <div className="variants-option-grid">
                  <div>
                    <label className="variants-label">Name</label>
                    <input
                      value={opt.name}
                      onChange={handleOptionInputChange(opt.key, 'name')}
                      placeholder="VD: Màu"
                      className="variants-input"
                    />
                  </div>

                  <div>
                    <label className="variants-label">Values</label>
                    <input
                      value={opt.values}
                      onChange={handleOptionInputChange(opt.key, 'values')}
                      placeholder="VD: Trắng, Đen"
                      className="variants-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="variants-mode">
            <span>Mode:</span>

            <label style={{ marginRight: 14, cursor: 'pointer' }}>
              <input
                type="radio"
                name="mode"
                value="add"
                checked={mode === 'add'}
                onChange={() => setMode('add')}
                style={{ marginRight: 4 }}
              />
              add
            </label>

            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                style={{ marginRight: 4 }}
              />
              replace
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="btn-main"
          >
            {generating ? 'Đang sinh biến thể...' : 'Sinh biến thể'}
          </button>
        </section>

        <section className="variants-section">
          <div className="variants-section-header">
            <h2 className="variants-section-title">Danh sách biến thể</h2>
            <button
              type="button"
              className="btn-main"
              onClick={() => {
                setSuccessMsg(null);
                setError(null);
                void loadVariants();
              }}
            >
              ↻ Reload
            </button>
          </div>

          {loadingVariants && <div className="variants-loading">Đang tải biến thể...</div>}

          {!loadingVariants && variants.length === 0 && (
            <div className="variants-loading">Chưa có biến thể nào.</div>
          )}

          {variants.length > 0 && (
            <>
              <div className="variants-table-wrapper">
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên</th>
                      <th>SKU</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, index) => {
                      const img =
                        productImages.find((x) => String(x.id) === String(v.imageId)) || null;
                      const imgUrl = img?.url || img?.imageUrl || '';

                      return (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td>{v.name}</td>
                          <td>{v.sku}</td>

                          <td>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) =>
                                handleVariantFieldChange(index, 'price', e.target.value)
                              }
                              className="variants-table-input"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantFieldChange(index, 'stock', e.target.value)
                              }
                              className="variants-table-input"
                            />
                          </td>

                          <td>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              {productImages.length > 0 ? (
                                <select
                                  value={v.imageId}
                                  onChange={(e) =>
                                    handleVariantFieldChange(index, 'imageId', e.target.value)
                                  }
                                  className="variants-table-select"
                                >
                                  <option value="">(Không chọn)</option>
                                  {productImages.map((img2) => (
                                    <option key={img2.id} value={String(img2.id)}>
                                      {img2.id} {(img2.isMain || img2.is_main) && '• Main'}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="number"
                                  value={v.imageId}
                                  onChange={(e) =>
                                    handleVariantFieldChange(index, 'imageId', e.target.value)
                                  }
                                  placeholder="imageId"
                                  className="variants-table-input"
                                />
                              )}

                              <div className="variants-table-image-preview">
                                {imgUrl && <img src={imgUrl} alt="" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="variants-save-btn"
              >
                {saving ? 'Đang lưu...' : 'Lưu tất cả biến thể'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductVariantsPage;