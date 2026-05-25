import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getPublicProducts } from '../../api/products.api';
import {
  getFavoriteProducts,
  getRecommendedProducts,
  type RecommendedProduct,
} from '../../api/recommendations.api';
import type { ProductListItem } from '../../api/types';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import heroBunny from '../../assets/brand/bunny_bear_original.png';
import basketChick from '../../assets/brand/basket_chick.png';

import './HomePage.css';

type HomeProduct = ProductListItem &
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

type RecommendationSource = 'personalized' | 'fallback' | 'public';

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getPublicItems(response: any): HomeProduct[] {
  const data = response?.data ?? response;

  const items =
    data?.items ??
    data?.data?.items ??
    data?.data ??
    data ??
    [];

  return Array.isArray(items) ? (items as HomeProduct[]) : [];
}

function filterVisibleProducts<T extends { status?: string }>(items: T[]): T[] {
  return items.filter((item) => {
    if (!item.status) return true;

    return item.status === 'ACTIVE' || item.status === 'OUT_OF_STOCK';
  });
}

function normalizeRecommendationSource(source: unknown): RecommendationSource {
  if (source === 'fallback' || source === 'public') {
    return source;
  }

  return 'personalized';
}

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<HomeProduct[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<HomeProduct[]>(
    [],
  );

  const [favoriteProducts, setFavoriteProducts] = useState<RecommendedProduct[]>(
    [],
  );

  const [recommendedProducts, setRecommendedProducts] = useState<
    RecommendedProduct[]
  >([]);

  const [loadingBestSelling, setLoadingBestSelling] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [recommendationSource, setRecommendationSource] =
    useState<RecommendationSource>('public');

  useEffect(() => {
    let mounted = true;

    async function loadHomeProducts() {
      setLoadingBestSelling(true);
      setLoadingFavorites(true);
      setLoadingRecommendations(true);
      setErrorMessage('');

      let publicFallbackItems: HomeProduct[] = [];

      try {
        const latestRes = await getPublicProducts({
          page: 1,
          limit: 18,
          sort: 'latest',
        } as any);

        publicFallbackItems = filterVisibleProducts(getPublicItems(latestRes));

        if (mounted) {
          setLatestProducts(publicFallbackItems);
        }
      } catch (error: any) {
        if (mounted) {
          setLatestProducts([]);
          setErrorMessage(
            error?.response?.data?.message ||
              'Không thể tải sản phẩm trang chủ. Vui lòng thử lại sau.',
          );
        }
      }

      try {
        const bestSellingRes = await getPublicProducts({
          page: 1,
          limit: 6,
          sort: 'best_selling',
        } as any);

        const bestSellingItems = filterVisibleProducts(
          getPublicItems(bestSellingRes),
        );

        if (mounted) {
          setBestSellingProducts(bestSellingItems);
        }
      } catch {
        const fallbackBestSelling = [...publicFallbackItems]
          .sort((a, b) => toNumber(b.sold) - toNumber(a.sold))
          .slice(0, 6);

        if (mounted) {
          setBestSellingProducts(fallbackBestSelling);
        }
      } finally {
        if (mounted) {
          setLoadingBestSelling(false);
        }
      }

      try {
        const favorites = await getFavoriteProducts({
          page: 1,
          limit: 12,
        });

        if (mounted) {
          setFavoriteProducts(
            (favorites.items ?? []).map((item) => ({
              ...item,
              isFavorite: true,
            })),
          );
        }
      } catch {
        if (mounted) {
          setFavoriteProducts([]);
        }
      } finally {
        if (mounted) {
          setLoadingFavorites(false);
        }
      }

      try {
        const recommendations = await getRecommendedProducts({
          page: 1,
          limit: 18,
        });

        if (mounted) {
          setRecommendedProducts(recommendations.items ?? []);
          setRecommendationSource(
            normalizeRecommendationSource(recommendations.source),
          );
        }
      } catch {
        if (mounted) {
          setRecommendedProducts(publicFallbackItems.slice(0, 18));
          setRecommendationSource('public');
        }
      } finally {
        if (mounted) {
          setLoadingRecommendations(false);
        }
      }
    }

    void loadHomeProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const safeRecommendedProducts = useMemo(() => {
    if (recommendedProducts.length > 0) {
      return recommendedProducts;
    }

    return latestProducts.slice(0, 18);
  }, [latestProducts, recommendedProducts]);

  return (
    <div className="home-page">
      <div className="mochi-container">
        <section className="home-hero">
          <div className="home-hero-content">
            <span className="home-hero-kicker">♡ Mochi cute store</span>

            <h1>
              Sưu tập đồ cute
              <br />
              Cho ngày thêm vui! ✨
            </h1>

            <p>
              Thế giới đồ dễ thương dành riêng cho bạn: gấu bông, phụ kiện,
              văn phòng phẩm và những món quà nhỏ xinh.
            </p>

            <div className="home-hero-actions">
              <Link to="/products" className="mochi-btn mochi-btn-primary">
                Mua ngay →
              </Link>

              <Link to="/shops" className="mochi-btn mochi-btn-outline">
                Xem cửa hàng
              </Link>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-blob" />

            <img className="home-hero-bunny" src={heroBunny} alt="Mochi bunny" />
            <img
              className="home-hero-basket"
              src={basketChick}
              alt="Cute basket"
            />

            <span className="home-deco heart">💗</span>
            <span className="home-deco star">⭐</span>
            <span className="home-deco spark">✨</span>
          </div>
        </section>

        <section className="mochi-service-strip home-service-strip">
          <div className="mochi-service-item">
            <div className="mochi-service-icon">🚚</div>
            <div>
              <p className="mochi-service-title">Miễn phí vận chuyển</p>
              <p className="mochi-service-desc">Cho đơn từ 300k</p>
            </div>
          </div>

          <div className="mochi-service-item">
            <div className="mochi-service-icon">🔄</div>
            <div>
              <p className="mochi-service-title">Đổi trả dễ dàng</p>
              <p className="mochi-service-desc">Trong vòng 7 ngày</p>
            </div>
          </div>

          <div className="mochi-service-item">
            <div className="mochi-service-icon">🔒</div>
            <div>
              <p className="mochi-service-title">Thanh toán an toàn</p>
              <p className="mochi-service-desc">Bảo mật tuyệt đối</p>
            </div>
          </div>

          <div className="mochi-service-item">
            <div className="mochi-service-icon">🎧</div>
            <div>
              <p className="mochi-service-title">Hỗ trợ 24/7</p>
              <p className="mochi-service-desc">Luôn sẵn sàng hỗ trợ</p>
            </div>
          </div>
        </section>

        {errorMessage ? <div className="home-error">{errorMessage}</div> : null}

        <section className="mochi-section">
          <div className="mochi-section-header">
            <div>
              <h2 className="mochi-section-title">Sản phẩm bán chạy 🌟</h2>
              <p className="home-section-subtitle">
                Các sản phẩm được mua nhiều nhất.
              </p>
            </div>

            <Link to="/products?sort=best_selling" className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          <ProductGrid
            products={bestSellingProducts as ProductCardItem[]}
            loading={loadingBestSelling}
            columns={6}
            emptyTitle="Chưa có sản phẩm bán chạy"
            emptyDescription="Khi có sản phẩm được bán, hệ thống sẽ hiển thị tại đây."
          />
        </section>

        <section className="mochi-section">
          <div className="mochi-section-header">
            <div>
              <h2 className="mochi-section-title">Sản phẩm yêu thích 💗</h2>
              <p className="home-section-subtitle">
                Những sản phẩm bạn đã bấm yêu thích.
              </p>
            </div>
          </div>

          <ProductGrid
            products={favoriteProducts as ProductCardItem[]}
            loading={loadingFavorites}
            columns={6}
            emptyTitle="Chưa có sản phẩm yêu thích"
            emptyDescription="Hãy bấm trái tim ở sản phẩm bạn thích để lưu lại tại đây."
          />
        </section>

        <section className="mochi-section">
          <div className="mochi-section-header">
            <div>
              <h2 className="mochi-section-title">Sản phẩm gợi ý 💕</h2>
              <p className="home-section-subtitle">
                {recommendationSource === 'personalized'
                  ? 'Dựa trên sản phẩm bạn đã xem, click, thêm giỏ hoặc yêu thích.'
                  : 'Gợi ý từ các sản phẩm phổ biến hiện có.'}
              </p>
            </div>

            <Link to="/products" className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          <ProductGrid
            products={safeRecommendedProducts as ProductCardItem[]}
            loading={loadingRecommendations}
            columns={6}
            emptyTitle="Chưa có sản phẩm gợi ý"
            emptyDescription="Hãy xem thêm sản phẩm để hệ thống gợi ý chính xác hơn."
          />
        </section>
      </div>
    </div>
  );
}