import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getPublicProducts } from '../../api/products.api';
import type { ProductListItem, PaginatedResult, ApiResponse } from '../../api/types';
// trên đầu file


const DEFAULT_LIMIT = 20;

export default function MyProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<ProductListItem[]>([]);
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit] = useState<number>(Number(searchParams.get('limit')) || DEFAULT_LIMIT);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // shopId có thể đọc từ query ?shopId= hoặc sau này bạn thay bằng API "shop của tôi"
  const shopIdParam = searchParams.get('shopId');
  const shopId = shopIdParam ? Number(shopIdParam) : undefined;

  useEffect(() => {
    if (!shopId) {
      setError('Chưa có shopId. Truyền ?shopId=... hoặc gọi API shop của bạn rồi chuyển sang đây.');
      return;
    }

    setLoading(true);
    setError(null);

    getPublicProducts({ page, limit, shopId })
      .then((res) => {
        const payload = (res as unknown as ApiResponse<PaginatedResult<ProductListItem>>).data;
        setItems(payload.items);
        setTotal(payload.total);

        const params: any = { page: String(page), limit: String(limit), shopId: String(shopId) };
        setSearchParams(params);
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được danh sách sản phẩm của shop.');
      })
      .finally(() => setLoading(false));
  }, [page, limit, shopId, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreate = () => {
    navigate('/me/products/new');
  };

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
            Sản phẩm của shop
          </h1>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleCreate}
            style={{
              padding: '12px 24px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            + Tạo sản phẩm mới
          </button>
        </div>

        {loading && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            Đang tải...
          </div>
        )}

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

        {!loading && items.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            Shop chưa có sản phẩm nào.
          </div>
        )}

        {!loading && items.length > 0 && (
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
                    Trạng thái
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
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p.id}
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
                      {p.id}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151',
                      }}
                    >
                      {p.title}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151',
                      }}
                    >
                      {p.price} {p.currency}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#374151',
                      }}
                    >
                      {p.status}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                      }}
                    >
                      <Link
                        to={`/me/products/${p.id}/edit`}
                        style={{
                          color: '#667eea',
                          textDecoration: 'none',
                          fontWeight: '500',
                          marginRight: '12px',
                        }}
                      >
                        Sửa
                      </Link>
                      <Link
                        to={`/products/${p.id}`}
                        style={{
                          color: '#667eea',
                          textDecoration: 'none',
                          fontWeight: '500',
                        }}
                      >
                        Xem public
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              style={{
                padding: '10px 20px',
                background: page <= 1 ? '#9ca3af' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
              }}
            >
              &lt; Trang trước
            </button>
            <span
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              style={{
                padding: '10px 20px',
                background: page >= totalPages ? '#9ca3af' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
              }}
            >
              Trang sau &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}