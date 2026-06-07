import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import {
  getRecommendedProducts,
  getTrendingProducts,
  type RecommendedProduct,
  type RecommendationResponse,
} from '../../api/recommendations.api';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import './style/ProductsListPage.css';

type ProductListViewItem = RecommendedProduct & ProductCardItem;

const PAGE_LIMIT = 30;

function isAuthError(error: any) {
  const status = Number(error?.response?.status);
  return status === 401 || status === 403;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải danh sách sản phẩm.'
  );
}

function getResponseItems(response: RecommendationResponse): ProductListViewItem[] {
  return (response?.items ?? []) as ProductListViewItem[];
}

function getResponseTotal(
  response: RecommendationResponse,
  itemsLength: number,
  currentPage: number,
) {
  const rawTotal = Number(response?.total);

  if (Number.isFinite(rawTotal) && rawTotal >= 0) {
    return rawTotal;
  }

  return (currentPage - 1) * PAGE_LIMIT + itemsLength;
}

function getResponsePage(response: RecommendationResponse, fallbackPage: number) {
  const rawPage = Number(response?.page);

  if (Number.isFinite(rawPage) && rawPage > 0) {
    return rawPage;
  }

  return fallbackPage;
}

function buildPageNumbers(currentPage: number, totalPages: number) {
  const pages: Array<number | 'dots'> = [];

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  pages.push(1);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('dots');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push('dots');
  }

  pages.push(totalPages);

  return pages;
}

export default function ProductsListPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isTrendingPage = location.pathname === '/products/trend';

  const urlPageRaw = Number(searchParams.get('page') ?? 1);
  const initialPage =
    Number.isFinite(urlPageRaw) && urlPageRaw > 0 ? urlPageRaw : 1;

  const [products, setProducts] = useState<ProductListViewItem[]>([]);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / PAGE_LIMIT));
  }, [total]);

  const pageNumbers = useMemo(() => {
    return buildPageNumbers(page, totalPages);
  }, [page, totalPages]);

  async function loadProducts(nextPage = page) {
    setLoading(true);
    setError('');
    setNeedLogin(false);

    try {
      const response = isTrendingPage
        ? await getTrendingProducts({
            page: nextPage,
            limit: PAGE_LIMIT,
          })
        : await getRecommendedProducts({
            page: nextPage,
            limit: PAGE_LIMIT,
          });

      const items = getResponseItems(response);

      setProducts(items);
      setTotal(getResponseTotal(response, items.length, nextPage));
      setPage(getResponsePage(response, nextPage));
    } catch (err: any) {
      setProducts([]);
      setTotal(0);

      if (!isTrendingPage && isAuthError(err)) {
        setNeedLogin(true);
        setError('');
      } else {
        setNeedLogin(false);
        setError(getApiMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  function updatePage(nextPage: number) {
    const safePage = Math.max(1, nextPage);
    const params = new URLSearchParams();

    if (safePage > 1) {
      params.set('page', String(safePage));
    }

    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const nextPageRaw = Number(searchParams.get('page') ?? 1);
    const nextPage =
      Number.isFinite(nextPageRaw) && nextPageRaw > 0 ? nextPageRaw : 1;

    setPage(nextPage);

    void loadProducts(nextPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isTrendingPage]);

  const pageTitle = isTrendingPage
    ? 'Sản phẩm đang trend'
    : 'Sản phẩm gợi ý cho bạn';

  const pageDescription = isTrendingPage
    ? 'Danh sách sản phẩm đang được quan tâm nhiều trong 7 ngày gần nhất.'
    : 'Danh sách sản phẩm được hệ thống gợi ý dựa trên hành vi xem, click, thêm giỏ và yêu thích của bạn.';

  const breadcrumbTitle = isTrendingPage ? 'Sản phẩm trend' : 'Sản phẩm gợi ý';

  return (
    <div className="mochi-page products-list-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <b>{breadcrumbTitle}</b>
        </div>

        <section className="products-list-hero mochi-card">
          <div>
            <span className="products-list-kicker">
              {isTrendingPage ? '🔥 Mochi trending' : '♡ Mochi recommend'}
            </span>

            <h1>{pageTitle}</h1>

            <p>{pageDescription}</p>
          </div>
        </section>

        {error ? <div className="products-list-error">{error}</div> : null}

        {needLogin ? (
          <section className="products-list-login-card mochi-card">
            <div className="products-list-login-icon">🔐</div>

            <h2>Vui lòng đăng nhập</h2>

            <p>
              Bạn cần đăng nhập để xem danh sách sản phẩm gợi ý theo sở thích
              cá nhân.
            </p>

            <Link to="/login" className="mochi-btn mochi-btn-primary">
              Đăng nhập ngay
            </Link>
          </section>
        ) : (
          <section className="products-list-content">
            <div className="products-list-toolbar">
              <div>
                <h2>{pageTitle}</h2>
                <p>
                  {loading
                    ? 'Đang tải dữ liệu...'
                    : `Tìm thấy ${total} sản phẩm`}
                </p>
              </div>
            </div>

            <ProductGrid
              products={products}
              loading={loading}
              columns={6}
              emptyTitle={
                isTrendingPage
                  ? 'Chưa có sản phẩm đang trend'
                  : 'Chưa có sản phẩm gợi ý'
              }
              emptyDescription={
                isTrendingPage
                  ? 'Khi có dữ liệu tương tác, hệ thống sẽ hiển thị sản phẩm trend tại đây.'
                  : 'Hãy xem thêm sản phẩm để hệ thống gợi ý chính xác hơn.'
              }
            />

            {!loading && total > 0 ? (
              <div className="products-list-pagination">
                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline mochi-btn-sm"
                  disabled={page <= 1}
                  onClick={() => updatePage(page - 1)}
                >
                  Trước
                </button>

                <div className="products-list-page-numbers">
                  {pageNumbers.map((item, index) => {
                    if (item === 'dots') {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="products-list-pagination-dots"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item}
                        type="button"
                        className={
                          item === page
                            ? 'products-list-page-number is-active'
                            : 'products-list-page-number'
                        }
                        onClick={() => updatePage(item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline mochi-btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => updatePage(page + 1)}
                >
                  Sau
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}