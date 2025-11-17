// src/pages/products/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProductDetail, getProductVariants } from '../../api/products.api';
import type { ProductDetail, ProductVariant, ApiResponse } from '../../api/types';

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getPublicProductDetail(id),
      // variants có thể chỉ cho Seller/Admin but skeleton cứ gọi, nếu 403 thì bỏ qua
      getProductVariants(id).catch(() => null),
    ])
      .then(([detailRes, variantRes]) => {
        const detailPayload = (detailRes as unknown as ApiResponse<ProductDetail>).data;
        setProduct(detailPayload);

        if (variantRes) {
          const variantPayload = (variantRes as unknown as ApiResponse<ProductVariant[]>).data;
          setVariants(variantPayload);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return <p>Thiếu id sản phẩm.</p>;
  }

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return <p>Không tìm thấy sản phẩm.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1>{product.title}</h1>
      <p>
        <strong>Giá:</strong> {product.price} {product.currency}
      </p>
      <p>
        <strong>Trạng thái:</strong> {product.status}
      </p>
      <p>
        <strong>Mô tả:</strong> {product.description || 'Không có mô tả'}
      </p>

      {product.images && product.images.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Hình ảnh</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {product.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={product.title}
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 4 }}
              />
            ))}
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Các biến thể (variants)</h3>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              maxWidth: 600,
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
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{v.price}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
