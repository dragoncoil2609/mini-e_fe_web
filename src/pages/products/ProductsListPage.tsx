// src/pages/products/ProductsListPage.tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublicProducts } from '../../api/products.api';
import type { ProductListItem, PaginatedResult, ApiResponse } from '../../api/types';
import './ProductsListPage.css';

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
    <div className="products-list-container">
      <div className="products-list-card">
        <div className="products-list-header">
          <div className="products-list-icon">🛍️</div>
          <h1 className="products-list-title">Danh sách sản phẩm</h1>
        </div>

        <form onSubmit={handleSearchSubmit} className="products-list-search-form">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="products-list-search-input"
          />
          <button type="submit" className="products-list-search-button">
            Tìm
          </button>
        </form>

        {loading && <div className="products-list-loading">Đang tải...</div>}

        {error && <div className="products-list-error">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="products-list-empty">Không có sản phẩm.</div>
        )}

        {!loading && items.length > 0 && (
          <div className="products-list-table-wrapper">
            <table className="products-list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.title}</td>
                    <td>
                      {p.price} {p.currency}
                    </td>
                    <td>{p.status}</td>
                    <td>{p.createdAt}</td>
                    <td>
                      <Link to={`/products/${p.id}`} className="products-list-link">
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="products-list-pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="products-list-pagination-button"
            >
              &lt; Trang trước
            </button>
            <span className="products-list-pagination-info">
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="products-list-pagination-button"
            >
              Trang sau &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
