import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  getRecommendedProducts,
  getTrendingProducts,
  type RecommendedProduct,
} from '../../api/recommendations.api';

import ProductGrid from '../../components/product/ProductGrid';
import type { ProductCardItem } from '../../components/product/ProductCard';

import heroBunny from '../../assets/brand/bunny_bear_original.png';
import basketChick from '../../assets/brand/basket_chick.png';

import './HomePage.css';

type RecommendationSource =
  | 'personalized'
  | 'fallback'
  | 'public'
  | 'guest';

const TRENDING_HOME_LIMIT = 6;
const RECOMMENDED_HOME_LIMIT = 30;

function normalizeRecommendationSource(source: unknown): RecommendationSource {
  if (source === 'personalized' || source === 'fallback') {
    return source;
  }

  return 'public';
}

function isAuthError(error: any) {
  const status = Number(error?.response?.status);
  return status === 401 || status === 403;
}

export default function HomePage() {
  const [trendingProducts, setTrendingProducts] = useState<RecommendedProduct[]>(
    [],
  );

  const [recommendedProducts, setRecommendedProducts] = useState<
    RecommendedProduct[]
  >([]);

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [recommendationSource, setRecommendationSource] =
    useState<RecommendationSource>('public');

  const [recommendedTotal, setRecommendedTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadTrendingProducts() {
      try {
        setLoadingTrending(true);
        setErrorMessage('');

        const response = await getTrendingProducts({
          page: 1,
          limit: TRENDING_HOME_LIMIT,
        });

        if (!mounted) return;

        setTrendingProducts(response.items ?? []);
      } catch (error: any) {
        if (!mounted) return;

        setTrendingProducts([]);
        setErrorMessage(
          error?.response?.data?.message ||
            'Không thể tải sản phẩm đang hot. Vui lòng thử lại sau.',
        );
      } finally {
        if (mounted) {
          setLoadingTrending(false);
        }
      }
    }

    async function loadRecommendedProducts() {
      try {
        setLoadingRecommendations(true);

        const response = await getRecommendedProducts({
          page: 1,
          limit: RECOMMENDED_HOME_LIMIT + 1,
        });

        if (!mounted) return;

        setRecommendedProducts(response.items ?? []);
        setRecommendedTotal(Number(response.total ?? 0));
        setRecommendationSource(normalizeRecommendationSource(response.source));
      } catch (error: any) {
        if (!mounted) return;

        setRecommendedProducts([]);
        setRecommendedTotal(0);

        if (isAuthError(error)) {
          setRecommendationSource('guest');
        } else {
          setRecommendationSource('public');
        }
      } finally {
        if (mounted) {
          setLoadingRecommendations(false);
        }
      }
    }

    void loadTrendingProducts();
    void loadRecommendedProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleTrendingProducts = useMemo(() => {
    return trendingProducts.slice(0, TRENDING_HOME_LIMIT);
  }, [trendingProducts]);

  const visibleRecommendedProducts = useMemo(() => {
    return recommendedProducts.slice(0, RECOMMENDED_HOME_LIMIT);
  }, [recommendedProducts]);

  const hasMoreRecommendedProducts =
    recommendedTotal > RECOMMENDED_HOME_LIMIT ||
    recommendedProducts.length > RECOMMENDED_HOME_LIMIT;

  const recommendedSubtitle =
    recommendationSource === 'personalized'
      ? 'Dựa trên sản phẩm bạn đã xem, click, thêm giỏ hoặc yêu thích.'
      : recommendationSource === 'fallback'
        ? 'Gợi ý phổ biến từ hệ thống recommendation.'
        : recommendationSource === 'guest'
          ? 'Vui lòng đăng nhập để xem sản phẩm gợi ý dành riêng cho bạn.'
          : 'Đăng nhập và tương tác với sản phẩm để nhận gợi ý phù hợp hơn.';

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

            <img
              className="home-hero-bunny"
              src={heroBunny}
              alt="Mochi bunny"
            />
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
              <h2 className="mochi-section-title">Sản phẩm đang hot 🔥</h2>
              <p className="home-section-subtitle">
                Những sản phẩm đang được tương tác nhiều trong 7 ngày gần nhất.
              </p>
            </div>

            <Link to="/products/trend" className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          <ProductGrid
            products={visibleTrendingProducts as ProductCardItem[]}
            loading={loadingTrending}
            columns={6}
            emptyTitle="Chưa có sản phẩm đang hot"
            emptyDescription="Khi có dữ liệu tương tác, hệ thống sẽ hiển thị sản phẩm trend tại đây."
          />
        </section>

        <section className="mochi-section">
          <div className="mochi-section-header">
            <div>
              <h2 className="mochi-section-title">Sản phẩm gợi ý 💕</h2>
              <p className="home-section-subtitle">{recommendedSubtitle}</p>
            </div>

            {recommendationSource === 'guest' ? (
              <Link to="/login" className="mochi-section-link">
                Đăng nhập →
              </Link>
            ) : (
              <Link to="/products" className="mochi-section-link">
                Xem tất cả →
              </Link>
            )}
          </div>

          <ProductGrid
            products={visibleRecommendedProducts as ProductCardItem[]}
            loading={loadingRecommendations}
            columns={6}
            emptyTitle={
              recommendationSource === 'guest'
                ? 'Vui lòng đăng nhập'
                : 'Chưa có sản phẩm gợi ý'
            }
            emptyDescription={
              recommendationSource === 'guest'
                ? 'Bạn cần đăng nhập để hệ thống hiển thị sản phẩm gợi ý theo sở thích cá nhân.'
                : 'Hãy đăng nhập và xem thêm sản phẩm để hệ thống gợi ý chính xác hơn.'
            }
          />

          {recommendationSource === 'guest' ? (
            <div className="home-load-more-wrap">
              <Link to="/login" className="home-load-more-btn">
                Đăng nhập để xem gợi ý
              </Link>
            </div>
          ) : hasMoreRecommendedProducts ? (
            <div className="home-load-more-wrap">
              <Link to="/products?page=2" className="home-load-more-btn">
                Xem thêm
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}