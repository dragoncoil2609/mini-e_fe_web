import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProductJson,
  getPublicProductDetail,
  updateProduct,
  getProductVariants,
  updateProductVariant,
  generateProductVariants,
} from '../../api/products.api';
import type {
    ProductDetail,
    ProductVariant,
    ApiResponse,
    UpdateProductDto,
    CreateProductJsonDto,
    UpdateVariantDto,
    GenerateVariantsPayload,
} from '../../api/types';

interface ProductEditPageProps {
  isCreate?: boolean; // dùng cho route /me/products/new
}

export default function ProductEditPage({ isCreate }: ProductEditPageProps) {
  const params = useParams();
  const navigate = useNavigate();
  const productId = params.id ? Number(params.id) : undefined;

  const realIsCreate = isCreate || !productId;

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

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (realIsCreate || !productId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getPublicProductDetail(productId),
      getProductVariants(productId).catch(() => null),
    ])
      .then(([detailRes, variantRes]) => {
        const detail = (detailRes as unknown as ApiResponse<ProductDetail>).data;
        setForm({
          title: detail.title,
          description: detail.description || '',
          price: Number(detail.price),
          stock: detail.stock,
          status: detail.status,
        });

        if (variantRes) {
          const vs = (variantRes as unknown as ApiResponse<ProductVariant[]>).data;
          setVariants(vs);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [realIsCreate, productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'price' || name === 'stock'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (realIsCreate) {
        const body: CreateProductJsonDto = {
          title: form.title,
          description: form.description,
          price: form.price,
          stock: form.stock,
        };
        const res = await createProductJson(body);
        const created = (res as unknown as ApiResponse<ProductDetail>).data;
        setMessage('Tạo sản phẩm thành công.');
        navigate(`/me/products/${created.id}/edit`, { replace: true });
      } else if (productId) {
        const body: UpdateProductDto = {
          title: form.title,
          description: form.description,
          price: form.price,
          stock: form.stock,
          status: form.status,
        };
        await updateProduct(productId, body);
        setMessage('Cập nhật sản phẩm thành công.');
      }
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError('Slug/sku/tổ hợp bị trùng (409).');
      } else {
        setError('Lưu sản phẩm thất bại.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Skeleton: cập nhật 1 variant (stock/price)
  const handleVariantChange = (
    id: number,
    field: keyof UpdateVariantDto,
    value: string | number,
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const handleSaveVariants = async () => {
    if (!productId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      for (const v of variants) {
        const body: UpdateVariantDto = {
          price: Number(v.price),
          stock: v.stock,
          // có thể thêm name/sku nếu cho phép sửa
        };
        await updateProductVariant(productId, v.id, body);
      }
      setMessage('Cập nhật variants thành công.');
    } catch (err: any) {
      console.error(err);
      setError('Cập nhật variants thất bại.');
    } finally {
      setSaving(false);
    }
  };

  // Skeleton: generate variants nhanh (hard-code options demo)
  const handleGenerateVariantsDemo = async () => {
    if (!productId) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: GenerateVariantsPayload = {
        mode: 'replace',
        options: [
          { name: 'Màu', values: ['Trắng', 'Đen'] },
          { name: 'Size', values: ['S', 'M'] },
        ],
      };
      const res = await generateProductVariants(productId, payload);
      const vs = (res as unknown as ApiResponse<ProductVariant[]>).data;
      setVariants(vs);
      setMessage('Generate variants demo thành công.');
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError('Tổ hợp biến thể trùng (409).');
      } else {
        setError('Generate variants thất bại.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#f8f9fa',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center',
            color: '#666',
          }}
        >
          Đang tải...
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
            {realIsCreate ? '✨' : '✏️'}
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            {realIsCreate ? 'Tạo sản phẩm mới' : `Sửa sản phẩm #${productId}`}
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

        {message && (
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
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '15px',
            marginBottom: '24px',
            background: '#fff',
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
              name="title"
              value={form.title}
              onChange={handleChange}
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
              Mô tả
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
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
              Giá
            </label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              min={0}
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
              Tồn kho
            </label>
            <input
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              min={0}
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

          {!realIsCreate && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#555',
                  fontWeight: '500',
                }}
              >
                Trạng thái
              </label>
              <select
                name="status"
                value={form.status}
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
                  background: '#fff',
                  cursor: 'pointer',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#9ca3af' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {saving
              ? 'Đang lưu...'
              : realIsCreate
                ? 'Tạo sản phẩm'
                : 'Lưu thay đổi'}
          </button>
        </form>

        {!realIsCreate && (
          <div
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
              Variants
            </h2>
            <button
              onClick={handleGenerateVariantsDemo}
              disabled={saving}
              style={{
                marginBottom: '20px',
                padding: '12px 24px',
                background: saving ? '#9ca3af' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
              }}
            >
              Generate variants demo (Màu x Size)
            </button>

            {variants.length === 0 && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                }}
              >
                Chưa có biến thể nào.
              </div>
            )}

            {variants.length > 0 && (
              <>
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
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
                          SKU
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
                          Tồn kho
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr
                          key={v.id}
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
                            {v.sku}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                            }}
                          >
                            {v.name}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                            }}
                          >
                            <input
                              type="number"
                              value={Number(v.price)}
                              onChange={(e) =>
                                handleVariantChange(v.id, 'price', Number(e.target.value))
                              }
                              style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                outline: 'none',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                            />
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                            }}
                          >
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantChange(v.id, 'stock', Number(e.target.value))
                              }
                              style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                outline: 'none',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleSaveVariants}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: saving ? '#9ca3af' : '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.3s',
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu variants'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}