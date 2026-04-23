import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getMyShop } from '../../api/shop.api';
import {
  getMyProducts,
  getProductsByShop,
  deleteProduct,
} from '../../api/products.api';
import type {
  ProductListItem,
  PaginatedResult,
  ProductStatus,
} from '../../api/types';
import { getMainImageUrl } from '../../utils/productImage';
import './style/MyProductsPage.css';

const DEFAULT_LIMIT = 20;
type StatusFilter = '' | ProductStatus;

export default function MyProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ProductListItem[]>([]);
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit] = useState<number>(Number(searchParams.get('limit')) || DEFAULT_LIMIT);
  const [total, setTotal] = useState<number>(0);

  const [q, setQ] = useState<string>(searchParams.get('q') || '');
  const [status, setStatus] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || '',
  );

  const [shopId, setShopId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const unwrap = <T,>(res: any): T => {
    if (res && typeof res === 'object') {
      if ('success' in res) return res.data as T;
      if ('data' in res) return res.data as T;
    }
    return res as T;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyShop();
        const data = unwrap<any>(res);
        if (!data?.id) throw new Error('NO_SHOP');
        setShopId(Number(data.id));
      } catch (e) {
        console.error(e);
        setError('Bạn chưa có shop hoặc không tải được shop của bạn.');
      }
    })();
  }, []);

  const syncSearchParams = () => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    setSearchParams(params);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      let payload: PaginatedResult<ProductListItem> | null = null;

      try {
        const res = await getMyProducts({
          page,
          limit,
          q: q.trim() || undefined,
          status: status || undefined,
        });
        payload = unwrap<PaginatedResult<ProductListItem>>(res);
      } catch (firstErr: any) {
        if (!shopId) throw firstErr;

        const fallback = await getProductsByShop(shopId, {
          page,
          limit,
          q: q.trim() || undefined,
          status: status || undefined,
        });
        payload = unwrap<PaginatedResult<ProductListItem>>(fallback);
      }

      const paginated: PaginatedResult<ProductListItem> =
        payload?.items && payload?.total !== undefined
          ? payload
          : {
              items: Array.isArray(payload) ? payload : payload?.items ?? [],
              page,
              limit,
              total: payload?.total ?? 0,
            };

      setItems(Array.isArray(paginated.items) ? paginated.items : []);
      setTotal(Number(paginated.total || 0));
      syncSearchParams();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Không tải được danh sách sản phẩm của shop.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shopId) return;
    void load();
  }, [shopId, page, limit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const handleDelete = async (productId: number) => {
    if (!window.confirm(`Xoá sản phẩm #${productId}?`)) return;

    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      const res = await deleteProduct(productId);
      const ok = (res as any)?.success ?? true;
      if (!ok) throw new Error((res as any)?.message || 'DELETE_FAILED');

      setMsg('Đã xoá sản phẩm.');
      await load();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xoá sản phẩm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    void load();
  };

  return (
    <div className="my-products-container">
      <div className="my-products-card">
        <div className="my-products-header">
          <button onClick={() => navigate('/shops/me')} className="home-button">
            ← Về shop của tôi
          </button>
          <div className="my-products-icon">📦</div>
          <h1 className="my-products-title">Quản lý sản phẩm</h1>
        </div>

        <div className="my-products-header-actions">
          <button
            onClick={() => navigate('/me/products/new')}
            className="my-products-link"
          >
            + Thêm sản phẩm
          </button>

          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc slug..."
              className="my-products-search-input"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="my-products-search-input"
            style={{ maxWidth: 160 }}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <button onClick={handleSearch} className="my-products-link">
            Tìm
          </button>
        </div>

        {loading && <div className="my-products-loading">Đang tải...</div>}
        {error && <div className="my-products-error">{error}</div>}
        {msg && !loading && (
          <div className="my-products-loading" style={{ color: '#16a34a' }}>
            {msg}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="my-products-empty">Shop chưa có sản phẩm nào.</div>
        )}

        {!loading && items.length > 0 && (
          <div className="my-products-table-wrapper">
            <table className="my-products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {getMainImageUrl(p) ? (
                          <img
                            src={getMainImageUrl(p)!}
                            alt=""
                            width={44}
                            height={44}
                            style={{
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #eee',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: '#eee',
                            }}
                          />
                        )}
                        <span>{p.title}</span>
                      </div>
                    </td>

                    <td>
                      {p.price} {p.currency}
                    </td>

                    <td>{p.status}</td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="my-products-link"
                        style={{ marginRight: 8 }}
                        onClick={() => navigate(`/me/products/${p.id}/edit`)}
                      >
                        Sửa
                      </button>

                      <button
                        className="my-products-link"
                        style={{ marginRight: 8 }}
                        onClick={() => navigate(`/me/products/${p.id}/variants`)}
                      >
                        Biến thể
                      </button>

                      <Link
                        to={`/products/${p.id}`}
                        className="my-products-link"
                        style={{ marginRight: 8 }}
                      >
                        Xem public
                      </Link>

                      <button
                        className="my-products-link"
                        onClick={() => handleDelete(p.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          borderColor: '#fecaca',
                        }}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button
                className="my-products-link"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ← Trước
              </button>

              <span style={{ alignSelf: 'center', fontWeight: 700 }}>
                Trang {page}/{totalPages}
              </span>

              <button
                className="my-products-link"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}