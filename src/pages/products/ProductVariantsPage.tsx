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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Quản lý biến thể sản phẩm #{productId}</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/shops/me">&laquo; Quay lại shop của tôi</Link>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
      )}
      {successMsg && (
        <div style={{ color: 'green', marginBottom: 12 }}>
          {successMsg}
        </div>
      )}

      {/* Form sinh biến thể */}
      <section
        style={{
          padding: 16,
          border: '1px solid #ccc',
          marginBottom: 24,
        }}
      >
        <h2>Sinh biến thể (generate)</h2>
        <p style={{ fontSize: 13, color: '#555' }}>
          mode = "add": chỉ thêm tổ hợp mới, bỏ qua tổ hợp đã tồn tại.
          &nbsp;mode = "replace": xoá toàn bộ biến thể cũ rồi tạo lại
          từ schema mới.
        </p>

        <div style={{ marginBottom: 8 }}>
          <label>
            Màu (cách nhau bằng dấu phẩy)
            <input
              type="text"
              value={colorValues}
              onChange={(e) => setColorValues(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Size (cách nhau bằng dấu phẩy)
            <input
              type="text"
              value={sizeValues}
              onChange={(e) => setSizeValues(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span>Mode: </span>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="mode"
              value="add"
              checked={mode === 'add'}
              onChange={() => setMode('add')}
            />{' '}
            add (chỉ thêm mới)
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="replace"
              checked={mode === 'replace'}
              onChange={() => setMode('replace')}
            />{' '}
            replace (xoá hết tạo lại)
          </label>
        </div>

        <button type="button" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Đang sinh biến thể...' : 'Sinh biến thể'}
        </button>
      </section>

      {/* Danh sách biến thể */}
      <section>
        <h2>Danh sách biến thể</h2>
        {loadingVariants && <div>Đang tải biến thể...</div>}

        {!loadingVariants && variants.length === 0 && (
          <div>Chưa có biến thể nào.</div>
        )}

        {variants.length > 0 && (
          <>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    Tên (name)
                  </th>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    SKU
                  </th>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    Giá
                  </th>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    Tồn kho
                  </th>
                  <th
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: 8,
                    }}
                  >
                    imageId
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, index) => (
                  <tr key={v.id}>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
                      }}
                    >
                      {v.id}
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
                      }}
                    >
                      {v.name}
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
                      }}
                    >
                      {v.sku}
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
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
                        style={{ width: '100%', padding: 4 }}
                      />
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
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
                        style={{ width: '100%', padding: 4 }}
                      />
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: 8,
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
                        style={{ width: '100%', padding: 4 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu tất cả biến thể'}
            </button>
          </>
        )}
      </section>
    </div>
  );
};

export default ProductVariantsPage;
