import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiEye,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUnlock,
} from 'react-icons/fi';

import {
  getAdminProducts,
  updateProductStatus,
} from '../../../api/products.api';
import type { ProductListItem, ProductStatus } from '../../../api/types';

import './style/AdminProductsPage.css';

type AdminProductItem = ProductListItem & {
  id: number;
  title: string;
  price: string | number;
  stock?: number;
  sold?: number;
  status: ProductStatus;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  shop?: {
    id?: number;
    name?: string;
  } | null;
};

function getItems(response: any): AdminProductItem[] {
  return (response?.data?.items ??
    response?.data?.data?.items ??
    []) as AdminProductItem[];
}

function getTotal(response: any): number {
  return Number(response?.data?.total ?? response?.data?.data?.total ?? 0);
}

function getPage(response: any): number {
  return Number(response?.data?.page ?? response?.data?.data?.page ?? 1);
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải danh sách sản phẩm.'
  );
}

function formatMoney(value?: string | number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat('vi-VN').format(
    Number.isFinite(numberValue) ? numberValue : 0,
  ) + 'đ';
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN');
}

function getStatusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Đang bán';
  if (status === 'OUT_OF_STOCK') return 'Hết hàng';
  if (status === 'LOCKED') return 'Đã khóa';
  return status || 'Không rõ';
}

function getStatusClass(status?: string) {
  if (status === 'ACTIVE') return 'active';
  if (status === 'OUT_OF_STOCK') return 'out';
  if (status === 'LOCKED') return 'locked';
  return 'unknown';
}

function getProductImage(product: AdminProductItem) {
  return (
    product.mainImageUrl ||
    product.thumbnailUrl ||
    product.imageUrl ||
    '/src/assets/brand/bunny_bear_original.png'
  );
}

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = searchParams.get('status') ?? '';
  const urlPageRaw = Number(searchParams.get('page') ?? 1);
  const urlPage =
    Number.isFinite(urlPageRaw) && urlPageRaw > 0 ? urlPageRaw : 1;

  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [q, setQ] = useState(urlQ);
  const [status, setStatus] = useState(urlStatus);
  const [page, setPage] = useState(urlPage);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const stats = useMemo(() => {
    return {
      total,
      active: products.filter((item) => item.status === 'ACTIVE').length,
      locked: products.filter((item) => item.status === 'LOCKED').length,
      out: products.filter((item) => item.status === 'OUT_OF_STOCK').length,
    };
  }, [products, total]);

  async function loadProducts(
    nextPage = page,
    nextQ = q,
    nextStatus = status,
  ) {
    setLoading(true);
    setMessage('');

    try {
      const response = await getAdminProducts({
        page: nextPage,
        limit,
        q: nextQ.trim() || undefined,
        status: nextStatus || undefined,
      });

      setProducts(getItems(response));
      setTotal(getTotal(response));
      setPage(getPage(response));
    } catch (err: any) {
      setMessage(getApiMessage(err));
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function updateUrl(nextPage: number, nextQ: string, nextStatus: string) {
    const params = new URLSearchParams();

    if (nextQ.trim()) {
      params.set('q', nextQ.trim());
    }

    if (nextStatus) {
      params.set('status', nextStatus);
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    }

    setSearchParams(params);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl(1, q, status);
  }

  function handleClear() {
    setQ('');
    setStatus('');
    setSearchParams(new URLSearchParams());
  }

  function handlePage(nextPage: number) {
    const safePage = Math.min(pageCount, Math.max(1, nextPage));
    updateUrl(safePage, q, status);
  }

  async function handleToggleLock(product: AdminProductItem) {
    const nextStatus: ProductStatus =
      product.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';

    const ok = window.confirm(
      product.status === 'LOCKED'
        ? `Mở khóa sản phẩm "${product.title}"?`
        : `Khóa sản phẩm "${product.title}"?`,
    );

    if (!ok) return;

    setChangingId(product.id);
    setMessage('');

    try {
      await updateProductStatus(product.id, nextStatus);
      await loadProducts(page, q, status);
    } catch (err: any) {
      setMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể đổi trạng thái sản phẩm.',
      );
    } finally {
      setChangingId(null);
    }
  }

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? '';
    const nextStatus = searchParams.get('status') ?? '';
    const nextPageRaw = Number(searchParams.get('page') ?? 1);
    const nextPage =
      Number.isFinite(nextPageRaw) && nextPageRaw > 0 ? nextPageRaw : 1;

    setQ(nextQ);
    setStatus(nextStatus);
    setPage(nextPage);

    void loadProducts(nextPage, nextQ, nextStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p>Admin chỉ xem chi tiết và đổi trạng thái đang bán / đã khóa.</p>
        </div>
      </div>

      <div className="admin-products-stats">
        <div className="admin-products-stat">
          <span><FiShield /></span>
          <div>
            <p>Tổng sản phẩm</p>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-products-stat">
          <span><FiUnlock /></span>
          <div>
            <p>Đang bán</p>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="admin-products-stat">
          <span><FiLock /></span>
          <div>
            <p>Đã khóa</p>
            <strong>{stats.locked}</strong>
          </div>
        </div>

        <div className="admin-products-stat">
          <span><FiRefreshCw /></span>
          <div>
            <p>Hết hàng</p>
            <strong>{stats.out}</strong>
          </div>
        </div>
      </div>

      <section className="admin-products-card">
        <form className="admin-products-filter" onSubmit={handleSubmit}>
          <div className="admin-products-search">
            <FiSearch />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm tên sản phẩm, slug..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
            <option value="LOCKED">Đã khóa</option>
          </select>

          <button type="submit">
            <FiSearch />
            Lọc
          </button>
        </form>

        {message ? <div className="admin-products-message">{message}</div> : null}

        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sản phẩm</th>
                <th>Shop</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Đã bán</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="admin-products-empty">
                    Đang tải sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-products-empty">
                    Chưa có sản phẩm
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{(page - 1) * limit + index + 1}</td>

                    <td>
                      <div className="admin-products-info">
                        <img src={getProductImage(product)} alt={product.title} />

                        <div>
                          <strong>{product.title}</strong>
                          <span>ID: {product.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{product.shop?.name || `Shop #${product.shopId || '—'}`}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock ?? 0}</td>
                    <td>{product.sold ?? 0}</td>

                    <td>
                      <span
                        className={`admin-products-status ${getStatusClass(
                          product.status,
                        )}`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>

                    <td>{formatDate(product.createdAt)}</td>

                    <td>
                      <div className="admin-products-actions">
                        <Link to={`/admin/products/${product.id}`} title="Xem chi tiết">
                          <FiEye />
                        </Link>

                        <button
                          type="button"
                          disabled={changingId === product.id}
                          onClick={() => handleToggleLock(product)}
                          title={product.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                        >
                          {product.status === 'LOCKED' ? <FiUnlock /> : <FiLock />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-products-pagination">
          <span>
            Hiển thị {products.length} / {total} sản phẩm
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePage(page - 1)}
            >
              ‹
            </button>

            <strong>{page}</strong>

            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => handlePage(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}