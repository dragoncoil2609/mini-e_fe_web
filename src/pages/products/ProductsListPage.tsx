// src/pages/products/ProductsListPage.tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublicProducts } from '../../api/products.api';
import type { ProductListItem, PaginatedResult, ApiResponse } from '../../api/types';

const DEFAULT_LIMIT = 20;

export default function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit] = useState<number>(Number(searchParams.get('limit')) || DEFAULT_LIMIT);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>(searchParams.get('q') || '');

  useEffect(() => {
    setLoading(true);
    setError(null);

    getPublicProducts({ page, limit, q: keyword || undefined })
      .then((res) => {
        const payload = (res as unknown as ApiResponse<PaginatedResult<ProductListItem>>).data;
        setItems(payload.items);
        setTotal(payload.total);
        // sync query
        const params: any = { page: String(page), limit: String(limit) };
        if (keyword) params.q = keyword;
        setSearchParams(params);
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được danh sách sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [page, limit, keyword, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1>Danh sách sản phẩm</h1>

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ padding: 8, minWidth: 260, marginRight: 8 }}
        />
        <button type="submit">Tìm</button>
      </form>

      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && items.length === 0 && <p>Không có sản phẩm.</p>}

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
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Ngày tạo</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>Chi tiết</th>
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
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.createdAt}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <Link to={`/products/${p.id}`}>Xem</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Phân trang đơn giản */}
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
