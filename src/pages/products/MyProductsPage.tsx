import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getPublicProducts } from '../../api/products.api';
import type { ProductListItem, PaginatedResult, ApiResponse } from '../../api/types';
import './MyProductsPage.css';


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
    <div className="my-products-container">
      <div className="my-products-card">
        <div className="my-products-header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
          <div className="my-products-icon">📦</div>
          <h1 className="my-products-title">Sản phẩm của shop</h1>
        </div>

        <div className="my-products-create-button">
          <button onClick={handleCreate}>+ Tạo sản phẩm mới</button>
        </div>

        {loading && <div className="my-products-loading">Đang tải...</div>}

        {error && <div className="my-products-error">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="my-products-empty">Shop chưa có sản phẩm nào.</div>
        )}

        {!loading && items.length > 0 && (
          <div className="my-products-table-wrapper">
            <table className="my-products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
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
                    <td>
                      <Link to={`/me/products/${p.id}/edit`} className="my-products-link">
                        Sửa
                      </Link>
                      <Link to={`/products/${p.id}`} className="my-products-link">
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
          <div className="my-products-pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="my-products-pagination-button"
            >
              &lt; Trang trước
            </button>
            <span className="my-products-pagination-info">
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="my-products-pagination-button"
            >
              Trang sau &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}