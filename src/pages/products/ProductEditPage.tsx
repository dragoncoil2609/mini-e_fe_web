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

  if (loading) return <p>Đang tải...</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1>{realIsCreate ? 'Tạo sản phẩm mới' : `Sửa sản phẩm #${productId}`}</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <label>
          Tên sản phẩm
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Mô tả
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Giá
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            min={0}
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Tồn kho
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            min={0}
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        {!realIsCreate && (
          <label>
            Trạng thái
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>
        )}

        <button type="submit" disabled={saving} style={{ marginTop: 8 }}>
          {realIsCreate ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
        </button>
      </form>

      {/* VARIANTS */}
      {!realIsCreate && (
        <div style={{ marginTop: 32 }}>
          <h2>Variants</h2>
          <button onClick={handleGenerateVariantsDemo} disabled={saving}>
            Generate variants demo (Màu x Size)
          </button>

          {variants.length === 0 && <p>Chưa có biến thể nào.</p>}

          {variants.length > 0 && (
            <>
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  maxWidth: 800,
                  marginTop: 16,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>SKU</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Tên</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Giá</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{v.sku}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{v.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <input
                          type="number"
                          value={Number(v.price)}
                          onChange={(e) =>
                            handleVariantChange(v.id, 'price', Number(e.target.value))
                          }
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            handleVariantChange(v.id, 'stock', Number(e.target.value))
                          }
                          style={{ width: '80px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={handleSaveVariants}
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                Lưu variants
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}