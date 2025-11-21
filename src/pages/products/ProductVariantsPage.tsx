// src/pages/me/ProductVariantsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  generateProductVariants,
  getProductVariants,
  updateProductVariant,
} from '../../api/products.api';

type GenerateMode = 'add' | 'replace';

interface EditableVariant {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: string;
  imageId: string;
}

const ProductVariantsPage = () => {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : 0;

  const [mode, setMode] = useState<GenerateMode>('add');
  const [colorValues, setColorValues] = useState(
    'Trắng,Đen,Hồng,Cam',
  );
  const [sizeValues, setSizeValues] = useState('XL,M');

  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadVariants = async () => {
    if (!productId) return;
    setLoadingVariants(true);
    setError(null);
    try {
      const res = await getProductVariants(productId);
      if (res.success) {
        const vs: EditableVariant[] = (res.data as any[]).map(
          (v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price, // "150000.00"
            stock: String(v.stock ?? 0),
            imageId:
              v.imageId !== null && v.imageId !== undefined
                ? String(v.imageId)
                : '',
          }),
        );
        setVariants(vs);
      } else {
        setError(res.message || 'Không lấy được danh sách biến thể.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không lấy được danh sách biến thể.',
      );
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    if (productId) {
      void loadVariants();
    }
  }, [productId]);

  const handleGenerate = async () => {
    if (!productId) return;

    const colors = colorValues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const sizes = sizeValues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (colors.length === 0 || sizes.length === 0) {
      setError('Vui lòng nhập ít nhất 1 Màu và 1 Size.');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        options: [
          { name: 'Màu', values: colors },
          { name: 'Size', values: sizes },
        ],
        mode,
      } as any;

      const res = await generateProductVariants(productId, payload);
      if (res.success) {
        const vs: EditableVariant[] = (res.data as any[]).map(
          (v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: String(v.stock ?? 0),
            imageId:
              v.imageId !== null && v.imageId !== undefined
                ? String(v.imageId)
                : '',
          }),
        );
        setVariants(vs);
        setSuccessMsg('Sinh biến thể thành công!');
      } else {
        setError(res.message || 'Sinh biến thể thất bại.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Sinh biến thể thất bại. Vui lòng thử lại.',
      );
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
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              [field]: value,
            }
          : v,
      ),
    );
  };

  const handleSaveAll = async () => {
    if (!productId) return;
    if (variants.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      for (const v of variants) {
        const body: any = {
          price: Number(v.price),
          stock: Number(v.stock),
          imageId: v.imageId ? Number(v.imageId) : null,
        };

        await updateProductVariant(productId, v.id, body);
      }

      setSuccessMsg('Cập nhật biến thể thành công!');
      // reload lại từ BE cho chắc
      await loadVariants();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Cập nhật biến thể thất bại. Vui lòng thử lại.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!productId) {
    return (
      <div style={{ padding: 24 }}>
        <p>Thiếu productId trên URL.</p>
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
            📦
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Quản lý biến thể sản phẩm #{productId}
          </h1>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/shops/me"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            &laquo; Quay lại shop của tôi
          </Link>
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
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '12px',
            }}
          >
            Sinh biến thể (generate)
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '20px',
            }}
          >
            mode = "add": chỉ thêm tổ hợp mới, bỏ qua tổ hợp đã tồn tại.
            &nbsp;mode = "replace": xoá toàn bộ biến thể cũ rồi tạo lại từ
            schema mới.
          </p>

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
              Màu (cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={colorValues}
              onChange={(e) => setColorValues(e.target.value)}
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
              Size (cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={sizeValues}
              onChange={(e) => setSizeValues(e.target.value)}
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
            <span
              style={{
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
                marginRight: '12px',
              }}
            >
              Mode:{' '}
            </span>
            <label
              style={{
                marginRight: '16px',
                fontSize: '14px',
                color: '#555',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="mode"
                value="add"
                checked={mode === 'add'}
                onChange={() => setMode('add')}
                style={{ marginRight: '6px' }}
              />
              add (chỉ thêm mới)
            </label>
            <label
              style={{
                fontSize: '14px',
                color: '#555',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                style={{ marginRight: '6px' }}
              />
              replace (xoá hết tạo lại)
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '12px 24px',
              background: generating ? '#9ca3af' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {generating ? 'Đang sinh biến thể...' : 'Sinh biến thể'}
          </button>
        </section>

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
            Danh sách biến thể
          </h2>
          {loadingVariants && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
              }}
            >
              Đang tải biến thể...
            </div>
          )}

          {!loadingVariants && variants.length === 0 && (
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
              <div
                style={{
                  overflowX: 'auto',
                  marginBottom: '16px',
                }}
              >
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
                        Tên (name)
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
                        imageId
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, index) => (
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
                          {v.id}
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
                            color: '#374151',
                          }}
                        >
                          {v.sku}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                          }}
                        >
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) =>
                              handleVariantFieldChange(
                                index,
                                'price',
                                e.target.value,
                              )
                            }
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                              outline: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#667eea')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = '#ddd')
                            }
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
                              handleVariantFieldChange(
                                index,
                                'stock',
                                e.target.value,
                              )
                            }
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                              outline: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#667eea')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = '#ddd')
                            }
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
                            value={v.imageId}
                            onChange={(e) =>
                              handleVariantFieldChange(
                                index,
                                'imageId',
                                e.target.value,
                              )
                            }
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                              outline: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#667eea')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = '#ddd')
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '14px',
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
