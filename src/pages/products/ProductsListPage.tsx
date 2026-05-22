import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getPublicProducts } from '../../api/products.api';
import type { ProductListItem } from '../../api/types';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import './style/ProductsListPage.css';

type ProductListViewItem = ProductListItem &
  ProductCardItem & {
    id: number;
    title?: string;
    name?: string;
    price?: number | string;
    compareAtPrice?: number | string | null;
    mainImageUrl?: string | null;
    imageUrl?: string | null;
    sold?: number;
    stock?: number;
    status?: string;
  };

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải danh sách sản phẩm.'
  );
}

function getDataItems(response: any): ProductListViewItem[] {
  return (response?.data?.items ?? response?.data?.data?.items ?? []) as ProductListViewItem[];
}

function getDataTotal(response: any): number {
  return Number(response?.data?.total ?? response?.data?.data?.total ?? 0);
}

function getDataPage(response: any): number {
  return Number(response?.data?.page ?? response?.data?.data?.page ?? 1);
}

export default function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = searchParams.get('status') ?? '';
  const urlPage = Number(searchParams.get('page') ?? 1);

  const [products, setProducts] = useState<ProductListViewItem[]>([]);
  const [q, setQ] = useState(urlQ);
  const [status, setStatus] = useState(urlStatus);
  const [page, setPage] = useState(Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);
  const [limit] = useState(18);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function loadProducts(nextPage = page, nextQ = q, nextStatus = status) {
    setLoading(true);
    setError('');

    try {
      const response = await getPublicProducts({
        page: nextPage,
        limit,
        q: nextQ.trim() || undefined,
        status: nextStatus || undefined,
      });

      setProducts(getDataItems(response));
      setTotal(getDataTotal(response));
      setPage(getDataPage(response));
    } catch (err: any) {
      setError(getApiMessage(err));
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

  function handleClearFilter() {
    setQ('');
    setStatus('');
    setSearchParams(new URLSearchParams());
  }

  function handleChangePage(nextPage: number) {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));

    updateUrl(safePage, q, status);
  }

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? '';
    const nextStatus = searchParams.get('status') ?? '';
    const nextPageRaw = Number(searchParams.get('page') ?? 1);
    const nextPage = Number.isFinite(nextPageRaw) && nextPageRaw > 0 ? nextPageRaw : 1;

    setQ(nextQ);
    setStatus(nextStatus);
    setPage(nextPage);

    void loadProducts(nextPage, nextQ, nextStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mochi-page products-list-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <b>Sản phẩm</b>
        </div>

        <section className="products-list-hero mochi-card">
          <div>
            <span className="products-list-kicker">♡ Mochi products</span>
            <h1>Khám phá sản phẩm dễ thương</h1>
            <p>
              Tìm kiếm những món đồ xinh xắn, phụ kiện đáng yêu và quà tặng nhỏ
              dành cho bạn.
            </p>
          </div>
        </section>

        <section className="products-list-filter mochi-card">
          <form className="products-list-form" onSubmit={handleSubmit}>
            <input
              className="mochi-input"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
            />

            <select
              className="mochi-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả sản phẩm</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
            </select>

            <button type="submit" className="mochi-btn mochi-btn-primary">
              Tìm kiếm
            </button>

            <button
              type="button"
              className="mochi-btn mochi-btn-outline"
              onClick={handleClearFilter}
            >
              Xóa lọc
            </button>
          </form>
        </section>

        {error ? <div className="products-list-error">{error}</div> : null}

        <section className="products-list-content">
          <div className="products-list-toolbar">
            <div>
              <h2>Tất cả sản phẩm</h2>
              <p>
                {loading
                  ? 'Đang tải dữ liệu...'
                  : `Tìm thấy ${total} sản phẩm`}
              </p>
            </div>

            {urlQ ? (
              <span className="products-list-search-tag">
                Từ khóa: <b>{urlQ}</b>
              </span>
            ) : null}
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            columns={6}
            emptyTitle="Không tìm thấy sản phẩm"
            emptyDescription="Bạn thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc hiện tại."
          />

          {!loading && total > 0 ? (
            <div className="products-list-pagination">
              <button
                type="button"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={page <= 1}
                onClick={() => handleChangePage(page - 1)}
              >
                Trước
              </button>

              <span>
                Trang {page} / {totalPages}
              </span>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={page >= totalPages}
                onClick={() => handleChangePage(page + 1)}
              >
                Sau
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}