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
    <div style={{ padding: 16 }}>
      <h1>Sản phẩm của shop</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={handleCreate}>+ Tạo sản phẩm mới</button>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && items.length === 0 && <p>Shop chưa có sản phẩm nào.</p>}

      {!loading && items.length > 0 && (
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            maxWidth: 900,
          }}
        >
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Tên</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Giá</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Trạng thái</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.id}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.title}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  {p.price} {p.currency}
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.status}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <Link to={`/me/products/${p.id}/edit`}>Sửa</Link>{' '}
                  | <Link to={`/products/${p.id}`}>Xem public</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            &lt; Trang trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Trang sau &gt;
          </button>
        </div>
      )}
    </div>
  );
}