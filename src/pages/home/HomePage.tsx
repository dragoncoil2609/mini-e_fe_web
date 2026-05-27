import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getPublicProducts } from '../../api/products.api';
import {
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

function normalizeRecommendationSource(source: unknown): RecommendationSource {
  if (source === 'personalized' || source === 'fallback') {
    return source;
  }

  return 'public';
}

export default function HomePage() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<
    RecommendedProduct[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [recommendationSource, setRecommendationSource] =
    useState<RecommendationSource>('public');

  useEffect(() => {
    let mounted = true;

    async function loadHomeProducts() {
      try {
        setLoading(true);
        setErrorMessage('');

        const res = await getPublicProducts({
          page: 1,
          limit: 60,
        });

        const items = (res.data?.items ?? []) as HomeProduct[];

        if (!mounted) return;

        const visibleItems = items.filter((item) => {
          if (!item.status) return true;
          return item.status === 'ACTIVE' || item.status === 'OUT_OF_STOCK';
        });

        setProducts(visibleItems);
      } catch (error: any) {
        if (!mounted) return;

        setErrorMessage(
          error?.response?.data?.message ||
            'Không thể tải sản phẩm trang chủ. Vui lòng thử lại sau.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function loadRecommendedProducts() {
      try {
        setLoadingRecommendations(true);

        const recommendations = await getRecommendedProducts({
          page: 1,
          limit: 18,
        });

        if (!mounted) return;

        setRecommendedProducts(recommendations.items ?? []);
        setRecommendationSource(
          normalizeRecommendationSource(recommendations.source),
        );
      } catch {
        if (!mounted) return;

        /**
         * Không fallback sang getPublicProducts nữa.
         * Nếu lỗi hoặc chưa đăng nhập thì phần gợi ý để trống.
         */
        setRecommendedProducts([]);
        setRecommendationSource('public');
      } finally {
        if (mounted) {
          setLoadingRecommendations(false);
        }
      }
    }

    void loadHomeProducts();
    void loadRecommendedProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const bestSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => toNumber(b.sold) - toNumber(a.sold))
      .slice(0, 6);
  }, [products]);

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
            <h2 className="mochi-section-title">Sản phẩm bán chạy 🌟</h2>
            <Link to="/products" className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          <ProductGrid
            products={bestSellingProducts}
            loading={loading}
            columns={6}
            emptyTitle="Chưa có sản phẩm bán chạy"
            emptyDescription="Khi có sản phẩm được bán, hệ thống sẽ hiển thị tại đây."
          />
        </section>

        <section className="mochi-section">
          <div className="mochi-section-header">
            <div>
              <h2 className="mochi-section-title">Sản phẩm gợi ý 💕</h2>

              <p className="home-section-subtitle">
                {recommendationSource === 'personalized'
                  ? 'Dựa trên sản phẩm bạn đã xem, click, thêm giỏ hoặc yêu thích.'
                  : recommendationSource === 'fallback'
                    ? 'Gợi ý phổ biến từ hệ thống recommendation.'
                    : 'Đăng nhập và tương tác với sản phẩm để nhận gợi ý phù hợp hơn.'}
              </p>
            </div>

            <Link to="/products" className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          <ProductGrid
            products={recommendedProducts as ProductCardItem[]}
            loading={loadingRecommendations}
            columns={6}
            emptyTitle="Chưa có sản phẩm gợi ý"
            emptyDescription="Hãy đăng nhập và xem thêm sản phẩm để hệ thống gợi ý chính xác hơn."
          />
        </section>
      </div>
    </div>
  );
}