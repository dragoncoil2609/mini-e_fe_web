import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

import AccountSidebar from '../../components/account/AccountSidebar';

import {
  getFavoriteProducts,
  removeFavoriteProduct,
  type RecommendedProduct,
} from '../../api/recommendations.api';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import './FavoriteProductsPage.css';

const PAGE_LIMIT = 30;

type FavoriteProductItem = RecommendedProduct & ProductCardItem;

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải danh sách sản phẩm yêu thích.'
  );
}

export default function FavoriteProductsPage() {
  const [products, setProducts] = useState<FavoriteProductItem[]>([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const hasPrevious = page > 1;
  const hasNext = products.length >= PAGE_LIMIT;

  const productIds = useMemo(() => {
    return products.map((product) => product.id);
  }, [products]);

  async function loadFavorites(nextPage = page) {
    setLoading(true);
    setError('');

    try {
      const response = await getFavoriteProducts({
        page: nextPage,
        limit: PAGE_LIMIT,
      });

      setProducts((response.items ?? []) as FavoriteProductItem[]);
      setPage(Number(response.page ?? nextPage));
    } catch (err: any) {
      setProducts([]);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFavorite(productId: number) {
    if (removingId) return;

    const confirmed = window.confirm(
      'Bạn có chắc muốn bỏ sản phẩm này khỏi danh sách yêu thích không?',
    );

    if (!confirmed) return;

    setRemovingId(productId);
    setError('');

    try {
      await removeFavoriteProduct(productId);

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể bỏ yêu thích sản phẩm này.',
      );
    } finally {
      setRemovingId(null);
    }
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    void loadFavorites(nextPage);
  }

  useEffect(() => {
    void loadFavorites(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mochi-page favorite-products-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/me">Tài khoản</Link>
          <span>›</span>
          <b>Sản phẩm yêu thích</b>
        </div>

        <div className="favorite-products-layout">
          <AccountSidebar />

          <main className="favorite-products-main">
            <section className="favorite-products-hero mochi-card">
              <div className="favorite-products-hero-icon">
                <FiHeart />
              </div>

              <div className="favorite-products-hero-content">
                <span className="favorite-products-kicker">
                  ♡ Mochi wishlist
                </span>

                <h1>Sản phẩm yêu thích</h1>

                <p>
                  Lưu lại những sản phẩm bạn thích để xem lại và mua nhanh hơn.
                </p>
              </div>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline favorite-products-refresh"
                onClick={() => loadFavorites(page)}
                disabled={loading}
              >
                <FiRefreshCw />
                <span>{loading ? 'Đang tải...' : 'Tải lại'}</span>
              </button>
            </section>

            {error ? (
              <div className="favorite-products-error">{error}</div>
            ) : null}

            <section className="favorite-products-content">
              <div className="favorite-products-toolbar">
                <div>
                  <h2>Danh sách yêu thích</h2>
                  <p>
                    {loading
                      ? 'Đang tải dữ liệu...'
                      : products.length > 0
                        ? `Đang hiển thị ${products.length} sản phẩm ở trang ${page}`
                        : 'Bạn chưa có sản phẩm yêu thích nào'}
                  </p>
                </div>
              </div>

              <ProductGrid
                products={products}
                loading={loading}
                columns={5}
                emptyTitle="Chưa có sản phẩm yêu thích"
                emptyDescription="Hãy bấm vào biểu tượng trái tim ở sản phẩm để lưu vào danh sách yêu thích."
              />

              {!loading && products.length > 0 ? (
                <div className="favorite-products-remove-panel mochi-card">
                  <div>
                    <h3>Bỏ yêu thích nhanh</h3>
                    <p>
                      Chọn sản phẩm bên dưới nếu bạn muốn xóa khỏi danh sách yêu
                      thích.
                    </p>
                  </div>

                  <div className="favorite-products-remove-list">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="favorite-products-remove-btn"
                        disabled={removingId === product.id}
                        onClick={() => handleRemoveFavorite(product.id)}
                        title={product.title || product.name || 'Sản phẩm'}
                      >
                        <FiTrash2 />
                        <span>
                          {removingId === product.id
                            ? 'Đang xóa...'
                            : `#${product.id}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!loading && (hasPrevious || hasNext || productIds.length > 0) ? (
                <div className="favorite-products-pagination">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={!hasPrevious}
                    onClick={() => goToPage(page - 1)}
                  >
                    Trước
                  </button>

                  <span>Trang {page}</span>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={!hasNext}
                    onClick={() => goToPage(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}