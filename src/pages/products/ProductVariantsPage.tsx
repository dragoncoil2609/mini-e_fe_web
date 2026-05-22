import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  generateProductVariants,
  getProductDetail,
  getProductVariants,
  updateProductVariant,
} from '../../api/products.api';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ProductVariantsPage.css';

type ProductImage = {
  id: number;
  url: string;
  alt?: string | null;
  isMain?: boolean;
};

type ProductView = {
  id: number;
  title?: string;
  name?: string;
  status?: string;
  deletedAt?: string | null;
  images?: ProductImage[];
};

type VariantOption = {
  name: string;
  valuesText: string;
};

type VariantRow = {
  id: number;
  sku?: string;
  name?: string;
  price?: string | number | null;
  stock?: number;
  imageId?: number | null;
  options?: {
    option: string;
    value: string | null;
  }[];
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý biến thể. Vui lòng thử lại.'
  );
}

function splitValues(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMoney(value?: number | string | null) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function getImageUrlById(images: ProductImage[], imageId?: number | null) {
  if (!imageId) return bunnyImg;
  return images.find((image) => image.id === imageId)?.url || bunnyImg;
}

function normalizeVariant(row: VariantRow) {
  return {
    name: row.name?.trim() || undefined,
    sku: row.sku?.trim() || undefined,
    price:
      row.price === '' || row.price === null || row.price === undefined
        ? undefined
        : Number(row.price),
    stock:
      row.stock === undefined || row.stock === null ? undefined : Number(row.stock),
    imageId:
      row.imageId === undefined || row.imageId === null ? null : Number(row.imageId),
  };
}

export default function ProductVariantsPage() {
  const { id } = useParams();
  const productId = Number(id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const [mode, setMode] = useState<'replace' | 'add'>('replace');
  const [options, setOptions] = useState<VariantOption[]>([
    { name: 'Màu', valuesText: 'Hồng, Trắng' },
    { name: 'Size', valuesText: 'S, M, L' },
  ]);

  const [editing, setEditing] = useState<Record<number, VariantRow>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const productImages = product?.images ?? [];
  const isLocked = product?.status === 'LOCKED';
  const isDeleted = Boolean(product?.deletedAt);
  const disabled = isLocked || isDeleted;

  const editedRows = useMemo(() => {
    return Object.values(editing);
  }, [editing]);

  const hasEditing = editedRows.length > 0;

  async function loadData() {
    if (!productId) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const [productResponse, variantsResponse] = await Promise.all([
        getProductDetail(productId),
        getProductVariants(productId),
      ]);

      const productData = unwrapApiData<ProductView>(productResponse);
      const variantData = unwrapApiData<VariantRow[]>(variantsResponse);

      setProduct(productData);
      setVariants(Array.isArray(variantData) ? variantData : []);
      setEditing({});
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateOption(index: number, key: keyof VariantOption, value: string) {
    setOptions((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function addOption() {
    if (options.length >= 5) return;

    setOptions((prev) => [
      ...prev,
      {
        name: '',
        valuesText: '',
      },
    ]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleGenerateVariants(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      setError('Sản phẩm đã bị khóa hoặc đã xóa, không thể chỉnh sửa biến thể.');
      return;
    }

    const cleanOptions = options
      .map((option) => ({
        name: option.name.trim(),
        values: splitValues(option.valuesText),
      }))
      .filter((option) => option.name && option.values.length > 0);

    if (cleanOptions.length === 0) {
      setError('Vui lòng nhập ít nhất 1 option hợp lệ.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await generateProductVariants(productId, {
        mode,
        options: cleanOptions,
      });

      const data = unwrapApiData<VariantRow[]>(response);

      setVariants(Array.isArray(data) ? data : []);
      setEditing({});
      setSuccessMessage('Tạo biến thể thành công.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  function getEditRow(variant: VariantRow) {
    return editing[variant.id] ?? variant;
  }

  function updateEditRow(variant: VariantRow, key: keyof VariantRow, value: any) {
    setEditing((prev) => ({
      ...prev,
      [variant.id]: {
        ...getEditRow(variant),
        [key]: value,
      },
    }));
  }

  function handleResetEditing() {
    setEditing({});
    setError('');
    setSuccessMessage('');
  }

  async function handleSaveAllVariants() {
    if (disabled) {
      setError('Sản phẩm đã bị khóa hoặc đã xóa, không thể chỉnh sửa biến thể.');
      return;
    }

    if (!hasEditing) {
      setSuccessMessage('Chưa có thay đổi nào cần lưu.');
      return;
    }

    setSavingAll(true);
    setError('');
    setSuccessMessage('');

    try {
      await Promise.all(
        editedRows.map((row) =>
          updateProductVariant(productId, row.id, normalizeVariant(row) as any),
        ),
      );

      setSuccessMessage(`Đã lưu ${editedRows.length} biến thể thành công.`);
      await loadData();
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSavingAll(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mochi-page product-variants-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding product-variant-state">
            Đang tải biến thể...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page product-variants-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <Link to="/shops/me/products">Sản phẩm</Link>
          <span>›</span>
          <b>Biến thể</b>
        </div>

        <section className="product-variant-head mochi-card">
          <div>
            <h1>Quản lý biến thể</h1>
            <p>{product?.title || product?.name || `Sản phẩm #${productId}`}</p>
          </div>

          <div className="product-variant-head-actions">
            <Link
              to={`/shops/me/products/${productId}/edit`}
              className="mochi-btn mochi-btn-outline"
            >
              Sửa sản phẩm
            </Link>

            <Link to={`/products/${productId}`} className="mochi-btn mochi-btn-soft">
              Xem sản phẩm
            </Link>

            <Link to="/shops/me/products" className="mochi-btn mochi-btn-soft">
              Danh sách sản phẩm
            </Link>
          </div>
        </section>

        {error ? <div className="product-variant-error">{error}</div> : null}

        {successMessage ? (
          <div className="product-variant-success">{successMessage}</div>
        ) : null}

        {isLocked ? (
          <div className="product-variant-warning">
            Sản phẩm đã bị admin khóa, shop không thể chỉnh sửa biến thể.
          </div>
        ) : null}

        {isDeleted ? (
          <div className="product-variant-warning">
            Sản phẩm đã bị xóa mềm, không thể chỉnh sửa biến thể.
          </div>
        ) : null}

        <div className="product-variant-layout">
          <form
            className="product-variant-generator mochi-card"
            onSubmit={handleGenerateVariants}
          >
            <div className="product-variant-card-head">
              <h2>Tạo biến thể tự động</h2>
              <p>
                Nhập option và các giá trị, hệ thống sẽ sinh tổ hợp biến thể.
              </p>
            </div>

            <div className="mochi-form-group">
              <label className="mochi-label">Chế độ tạo</label>
              <select
                className="mochi-select"
                value={mode}
                disabled={disabled}
                onChange={(event) =>
                  setMode(event.target.value as 'replace' | 'add')
                }
              >
                <option value="replace">Tạo lại toàn bộ biến thể</option>
                <option value="add">Thêm biến thể còn thiếu</option>
              </select>
            </div>

            <div className="product-option-list">
              {options.map((option, index) => (
                <div className="product-option-row" key={index}>
                  <div className="mochi-form-group">
                    <label className="mochi-label">Tên option</label>
                    <input
                      className="mochi-input"
                      value={option.name}
                      disabled={disabled}
                      onChange={(event) =>
                        updateOption(index, 'name', event.target.value)
                      }
                      placeholder="Ví dụ: Màu, Size"
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Giá trị</label>
                    <input
                      className="mochi-input"
                      value={option.valuesText}
                      disabled={disabled}
                      onChange={(event) =>
                        updateOption(index, 'valuesText', event.target.value)
                      }
                      placeholder="Ví dụ: Đỏ, Xanh, Vàng"
                    />
                  </div>

                  <button
                    type="button"
                    className="product-option-remove"
                    disabled={disabled || options.length <= 1}
                    onClick={() => removeOption(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="product-variant-generator-actions">
              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                disabled={disabled || options.length >= 5}
                onClick={addOption}
              >
                + Thêm option
              </button>

              <button
                type="submit"
                className="mochi-btn mochi-btn-primary"
                disabled={disabled || generating}
              >
                {generating ? 'Đang tạo...' : 'Tạo biến thể'}
              </button>
            </div>
          </form>

          <section className="product-variant-table mochi-card">
            <div className="product-variant-card-head product-variant-table-head">
              <div>
                <h2>Danh sách biến thể</h2>
                <p>
                  Tổng cộng {variants.length} biến thể
                  {hasEditing ? ` • ${editedRows.length} thay đổi chưa lưu` : ''}.
                </p>
              </div>

              <div className="product-variant-save-all">
                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline mochi-btn-sm"
                  disabled={!hasEditing || savingAll}
                  onClick={handleResetEditing}
                >
                  Hủy thay đổi
                </button>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-primary mochi-btn-sm"
                  disabled={disabled || !hasEditing || savingAll}
                  onClick={() => void handleSaveAllVariants()}
                >
                  {savingAll ? 'Đang lưu...' : 'Lưu tất cả biến thể'}
                </button>
              </div>
            </div>

            {productImages.length === 0 ? (
              <div className="product-variant-warning">
                Sản phẩm chưa có ảnh. Hãy thêm ảnh sản phẩm trước để chọn ảnh
                riêng cho từng biến thể.
              </div>
            ) : null}

            {variants.length === 0 ? (
              <div className="mochi-empty">
                <h3 className="mochi-empty-title">Chưa có biến thể</h3>
                <p className="mochi-empty-desc">
                  Hãy tạo biến thể từ option như màu sắc, size hoặc chất liệu.
                </p>
              </div>
            ) : (
              <div className="product-variant-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Biến thể</th>
                      <th>SKU</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Ảnh biến thể</th>
                    </tr>
                  </thead>

                  <tbody>
                    {variants.map((variant) => {
                      const row = getEditRow(variant);
                      const imageUrl = getImageUrlById(productImages, row.imageId);
                      const isEdited = Boolean(editing[variant.id]);

                      return (
                        <tr
                          key={variant.id}
                          className={isEdited ? 'variant-row-edited' : ''}
                        >
                          <td>
                            <input
                              className="variant-inline-input"
                              value={row.name ?? ''}
                              disabled={disabled}
                              onChange={(event) =>
                                updateEditRow(variant, 'name', event.target.value)
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="variant-inline-input"
                              value={row.sku ?? ''}
                              disabled={disabled}
                              onChange={(event) =>
                                updateEditRow(variant, 'sku', event.target.value)
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="variant-inline-input"
                              value={row.price ?? ''}
                              disabled={disabled}
                              inputMode="numeric"
                              onChange={(event) =>
                                updateEditRow(variant, 'price', event.target.value)
                              }
                            />

                            <small>{formatMoney(row.price)}</small>
                          </td>

                          <td>
                            <input
                              className="variant-inline-input"
                              value={row.stock ?? 0}
                              disabled={disabled}
                              inputMode="numeric"
                              onChange={(event) =>
                                updateEditRow(
                                  variant,
                                  'stock',
                                  Number(event.target.value),
                                )
                              }
                            />
                          </td>

                          <td>
                            <div className="variant-image-picker">
                              <img src={imageUrl} alt={row.name || 'Ảnh biến thể'} />

                              <select
                                className="variant-image-select"
                                value={row.imageId ?? ''}
                                disabled={disabled || productImages.length === 0}
                                onChange={(event) =>
                                  updateEditRow(
                                    variant,
                                    'imageId',
                                    event.target.value
                                      ? Number(event.target.value)
                                      : null,
                                  )
                                }
                              >
                                <option value="">Không chọn ảnh</option>

                                {productImages.map((image, index) => (
                                  <option value={image.id} key={image.id}>
                                    {image.isMain || index === 0
                                      ? `Ảnh ${index + 1} - ảnh chính`
                                      : `Ảnh ${index + 1}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}