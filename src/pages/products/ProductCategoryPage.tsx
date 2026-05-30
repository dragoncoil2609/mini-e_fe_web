import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { getProductsByCategory } from '../../api/products.api';
import { getHomeCategories, type Category } from '../../api/categories.api';
import { getRecommendedProducts } from '../../api/recommendations.api';
import { getBeStatus } from '../../api/apiError';

import type { ProductListItem, ProductSort } from '../../api/types';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import './style/ProductCategoryPage.css';

type CategorySort = 'recommended' | ProductSort;

type CategoryProductItem = ProductListItem &
  ProductCardItem & {
    id: number;
    title?: string;
    name?: string;
    price?: number | string;
    compareAtPrice?: number | string | null;
    mainImageUrl?: string | null;
    thumbnailUrl?: string | null;
    imageUrl?: string | null;
    sold?: number;
    stock?: number;
    status?: string;
    recommendationScore?: number | string;
    productScore?: number | string;
    categoryScore?: number | string;
    tagScore?: number | string;
    trendingBonus?: number | string;
  };

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải sản phẩm theo danh mục.'
  );
}

function getDataItems(response: any): CategoryProductItem[] {
  return (response?.items ??
    response?.data?.items ??
    response?.data?.data?.items ??
    []) as CategoryProductItem[];
}

function getDataTotal(response: any): number {
  const directTotal = response?.total;
  const dataTotal = response?.data?.total;
  const nestedTotal = response?.data?.data?.total;

  const metaTotal =
    response?.meta?.total ??
    response?.data?.meta?.total ??
    response?.data?.data?.meta?.total;

  const total = directTotal ?? dataTotal ?? nestedTotal ?? metaTotal ?? 0;

  return Number(total);
}

function getDataPage(response: any): number {
  return Number(
    response?.page ??
      response?.data?.page ??
      response?.data?.data?.page ??
      response?.meta?.page ??
      response?.data?.meta?.page ??
      response?.data?.data?.meta?.page ??
      1,
  );
}

function normalizeRecommendedItem(item: any): CategoryProductItem {
  return {
    ...item,
    title: item.title ?? item.name ?? 'Sản phẩm',
    name: item.name ?? item.title,
    mainImageUrl:
      item.mainImageUrl ??
      item.thumbnailUrl ??
      item.imageUrl ??
      item.thumbnail ??
      null,
    thumbnailUrl:
      item.thumbnailUrl ??
      item.mainImageUrl ??
      item.imageUrl ??
      item.thumbnail ??
      null,
    imageUrl:
      item.imageUrl ??
      item.mainImageUrl ??
      item.thumbnailUrl ??
      item.thumbnail ??
      null,
    isFavorite:
      item.isFavorite === true ||
      item.isFavorite === 1 ||
      item.isFavorite === '1',
  } as CategoryProductItem;
}

function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];

  function walk(items: Category[]) {
    for (const item of items) {
      result.push(item);

      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children);
      }
    }
  }

  walk(categories);

  return result;
}

export default function ProductCategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const numericCategoryId = Number(categoryId);

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = searchParams.get('status') ?? '';
  const urlSort = (searchParams.get('sort') ?? 'recommended') as CategorySort;
  const urlPageRaw = Number(searchParams.get('page') ?? 1);
  const urlPage =
    Number.isFinite(urlPageRaw) && urlPageRaw > 0 ? urlPageRaw : 1;

  const [products, setProducts] = useState<CategoryProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [q, setQ] = useState(urlQ);
  const [status, setStatus] = useState(urlStatus);
  const [sort, setSort] = useState<CategorySort>(urlSort);
  const [page, setPage] = useState(urlPage);
  const [limit] = useState(18);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [listSource, setListSource] = useState<'recommended' | 'normal'>(
    'recommended',
  );
  const [hasNextPage, setHasNextPage] = useState(false);

  const allCategories = useMemo(() => {
    return flattenCategories(categories);
  }, [categories]);

  const currentCategory = useMemo(() => {
    return allCategories.find((item) => item.id === numericCategoryId) ?? null;
  }, [allCategories, numericCategoryId]);

  const childCategories = useMemo(() => {
    return allCategories.filter((item) => item.parentId === numericCategoryId);
  }, [allCategories, numericCategoryId]);

  const parentCategory = useMemo(() => {
    if (!currentCategory?.parentId) return null;

    return (
      allCategories.find((item) => item.id === currentCategory.parentId) ?? null
    );
  }, [allCategories, currentCategory]);

  const totalPages = useMemo(() => {
    if (listSource === 'recommended' && total <= 0) {
      return Math.max(1, page + (hasNextPage ? 1 : 0));
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [hasNextPage, limit, listSource, page, total]);

  async function loadCategories() {
    setCategoryLoading(true);
    setCategoryError('');

    try {
      const response = await getHomeCategories();
      const data = unwrapApiData<Category[]>(response);

      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setCategories([]);
      setCategoryError(
        err?.response?.data?.message ||
          err?.message ||
          'Không tải được danh mục.',
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  async function loadNormalProducts(
    nextPage: number,
    nextQ: string,
    nextStatus: string,
    nextSort: CategorySort,
  ) {
    const productSort: ProductSort =
      nextSort === 'best_selling' ? 'best_selling' : 'latest';

    const response = await getProductsByCategory(numericCategoryId, {
      page: nextPage,
      limit,
      q: nextQ.trim() || undefined,
      status: nextStatus || undefined,
      sort: productSort,
    });

    const items = getDataItems(response);

    setProducts(items.map(normalizeRecommendedItem));
    setTotal(getDataTotal(response));
    setPage(getDataPage(response));
    setHasNextPage(items.length >= limit);
    setListSource('normal');
  }

  async function loadRecommendedProducts(nextPage: number) {
    const response = await getRecommendedProducts({
      categoryId: numericCategoryId,
      page: nextPage,
      limit,
    });

    const items = getDataItems(response).map(normalizeRecommendedItem);

    setProducts(items);
    setTotal(getDataTotal(response));
    setPage(Number(response?.page ?? nextPage));
    setHasNextPage(items.length >= limit);
    setListSource('recommended');
  }

  async function loadProducts(
    nextPage = page,
    nextQ = q,
    nextStatus = status,
    nextSort = sort,
  ) {
    if (!Number.isInteger(numericCategoryId) || numericCategoryId <= 0) {
      setError('Danh mục không hợp lệ.');
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shouldUseRecommendation =
        nextSort === 'recommended' && !nextQ.trim() && !nextStatus;

      if (shouldUseRecommendation) {
        try {
          await loadRecommendedProducts(nextPage);
          return;
        } catch (err: any) {
          const statusCode = getBeStatus(err);

          if (statusCode !== 401 && statusCode !== 403) {
            throw err;
          }

          await loadNormalProducts(nextPage, nextQ, nextStatus, 'latest');
          return;
        }
      }

      await loadNormalProducts(nextPage, nextQ, nextStatus, nextSort);
    } catch (err: any) {
      setError(getApiMessage(err));
      setProducts([]);
      setTotal(0);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }

  function updateUrl(
    nextPage: number,
    nextQ: string,
    nextStatus: string,
    nextSort: CategorySort,
  ) {
    const params = new URLSearchParams();

    if (nextQ.trim()) {
      params.set('q', nextQ.trim());
    }

    if (nextStatus) {
      params.set('status', nextStatus);
    }

    if (nextSort && nextSort !== 'recommended') {
      params.set('sort', nextSort);
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    }

    setSearchParams(params);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateUrl(1, q, status, sort);
  }

  function handleClearFilter() {
    setQ('');
    setStatus('');
    setSort('recommended');
    setSearchParams(new URLSearchParams());
  }

  function handleChangeSort(nextSort: CategorySort) {
    setSort(nextSort);
    updateUrl(1, q, status, nextSort);
  }

  function handleChangePage(nextPage: number) {
    const safePage =
      listSource === 'recommended'
        ? Math.max(1, nextPage)
        : Math.min(totalPages, Math.max(1, nextPage));

    updateUrl(safePage, q, status, sort);
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? '';
    const nextStatus = searchParams.get('status') ?? '';
    const nextSort = (searchParams.get('sort') ?? 'recommended') as CategorySort;
    const nextPageRaw = Number(searchParams.get('page') ?? 1);
    const nextPage =
      Number.isFinite(nextPageRaw) && nextPageRaw > 0 ? nextPageRaw : 1;

    setQ(nextQ);
    setStatus(nextStatus);
    setSort(nextSort);
    setPage(nextPage);

    void loadProducts(nextPage, nextQ, nextStatus, nextSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, searchParams]);

  return (
    <div className="mochi-page category-products-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/products">Sản phẩm</Link>
          <span>›</span>
          <b>{currentCategory?.name || 'Danh mục'}</b>
        </div>

        <section className="category-products-hero mochi-card">
          <div className="category-products-hero-content">
            <span className="category-products-kicker">♡ Mochi category</span>

            <h1>
              {categoryLoading
                ? 'Đang tải danh mục...'
                : currentCategory?.name || 'Sản phẩm theo danh mục'}
            </h1>

            {parentCategory ? (
              <Link
                to={`/products/category/${parentCategory.id}`}
                className="category-products-parent-link"
              >
                ← Quay lại {parentCategory.name}
              </Link>
            ) : null}

            {listSource === 'recommended' ? (
              <p className="category-products-recommend-note">
                Đang sắp xếp sản phẩm theo gợi ý phù hợp với bạn.
              </p>
            ) : (
              <p className="category-products-recommend-note">
                Đang hiển thị danh sách sản phẩm theo bộ lọc thông thường.
              </p>
            )}
          </div>

          {currentCategory?.imageUrl ? (
            <img src={currentCategory.imageUrl} alt={currentCategory.name} />
          ) : (
            <span>🧸</span>
          )}
        </section>

        {categoryError ? (
          <div className="category-products-message error">
            {categoryError}
          </div>
        ) : null}

        {childCategories.length > 0 ? (
          <section className="category-products-children mochi-card">
            <div className="category-products-section-head">
              <h2>Danh mục con</h2>
              <p>Bấm vào danh mục con để xem chi tiết hơn.</p>
            </div>

            <div className="category-products-child-grid">
              {childCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products/category/${category.id}`}
                  className="category-products-child-card"
                >
                  <span>
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} />
                    ) : (
                      '🐰'
                    )}
                  </span>

                  <strong>{category.name}</strong>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="category-products-message error">{error}</div>
        ) : null}

        <section className="category-products-content">
          <div className="category-products-toolbar">
            <div>
              <h2>
                {currentCategory?.name
                  ? `Sản phẩm ${currentCategory.name}`
                  : 'Sản phẩm danh mục'}
              </h2>

              <p>
                {loading
                  ? 'Đang tải dữ liệu...'
                  : total > 0
                    ? `Tìm thấy ${total} sản phẩm`
                    : `${products.length} sản phẩm đang hiển thị`}
              </p>
            </div>

            <div className="category-products-actions">
              <select
                value={sort}
                onChange={(event) =>
                  handleChangeSort(event.target.value as CategorySort)
                }
                className="category-products-sort"
              >
                <option value="recommended">Gợi ý phù hợp</option>
                <option value="latest">Mới nhất</option>
                <option value="best_selling">Bán chạy</option>
              </select>

              <Link
                to="/products"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
              >
                Xem tất cả
              </Link>
            </div>
          </div>

          <form className="category-products-filter" onSubmit={handleSubmit}>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm trong danh mục..."
            />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
            </select>

            <button type="submit" className="mochi-btn mochi-btn-primary">
              Lọc
            </button>

            {(q || status || sort !== 'recommended') && (
              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                onClick={handleClearFilter}
              >
                Xóa lọc
              </button>
            )}
          </form>

          <ProductGrid
            products={products}
            loading={loading}
            columns={6}
            emptyTitle="Danh mục này chưa có sản phẩm"
            emptyDescription="Bạn thử chọn danh mục khác hoặc xóa bộ lọc hiện tại."
          />

          {!loading && products.length > 0 ? (
            <div className="category-products-pagination">
              <button
                type="button"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={page <= 1}
                onClick={() => handleChangePage(page - 1)}
              >
                Trước
              </button>

              <span>
                Trang {page}
                {listSource === 'normal' || total > 0
                  ? ` / ${totalPages}`
                  : ''}
              </span>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={
                  listSource === 'recommended'
                    ? !hasNextPage
                    : page >= totalPages
                }
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