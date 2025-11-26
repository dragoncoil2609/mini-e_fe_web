// src/pages/products/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProductDetail, getProductVariants } from '../../api/products.api';
import type { ProductDetail, ProductVariant, ApiResponse } from '../../api/types';
import { getMainImageUrl, getAllImages } from '../../utils/productImage';

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
            color: '#dc2626',
          }}
        >
          Thiếu id sản phẩm.
        </div>
      </div>
    );
  }

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

  if (error) {
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
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
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
          Không tìm thấy sản phẩm.
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
            {product.title}
          </h1>
        </div>

        {/* Ảnh chính */}
        {getMainImageUrl(product) && (
          <div
            style={{
              padding: '24px',
              border: '1px solid #e5e7eb',
              borderRadius: '15px',
              marginBottom: '24px',
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <img
              src={getMainImageUrl(product)!}
              alt={product.title}
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
            />
          </div>
        )}

        <div
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '15px',
            marginBottom: '24px',
            background: '#fff',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <strong style={{ color: '#555', fontSize: '14px' }}>Giá:</strong>
              <div style={{ color: '#1a1a1a', fontSize: '18px', marginTop: '4px', fontWeight: '600' }}>
                {product.price} {product.currency}
              </div>
            </div>
            <div>
              <strong style={{ color: '#555', fontSize: '14px' }}>Trạng thái:</strong>
              <div style={{ color: '#1a1a1a', fontSize: '16px', marginTop: '4px' }}>
                {product.status}
              </div>
            </div>
          </div>

          {product.description && (
            <div style={{ marginTop: '20px' }}>
              <strong style={{ color: '#555', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                Mô tả:
              </strong>
              <div style={{ color: '#1a1a1a', fontSize: '16px', lineHeight: '1.6' }}>
                {product.description}
              </div>
            </div>
          )}
        </div>

        {getAllImages(product).length > 0 && (
          <div
            style={{
              padding: '24px',
              border: '1px solid #e5e7eb',
              borderRadius: '15px',
              marginBottom: '24px',
              background: '#fff',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '16px',
              }}
            >
              Tất cả hình ảnh
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {getAllImages(product).map((img) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                  }}
                >
                  <img
                    src={img.normalizedUrl}
                    alt={product.title}
                    style={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: img.isMain
                        ? '3px solid #667eea'
                        : '1px solid #e5e7eb',
                    }}
                  />
                  {img.isMain && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#667eea',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: '600',
                      }}
                    >
                      Chính
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <div
            style={{
              padding: '24px',
              border: '1px solid #e5e7eb',
              borderRadius: '15px',
              background: '#fff',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '16px',
              }}
            >
              Các biến thể (variants)
            </h3>
            <div style={{ overflowX: 'auto' }}>
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
                          color: '#374151',
                        }}
                      >
                        {v.price}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {v.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
