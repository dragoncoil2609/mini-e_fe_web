// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, ProductListItem, Shop } from '../api/types';
import { HomeApi } from '../api/home.api';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItem[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductListItem[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('current_user');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as User;
      setUser(parsed);
    } catch (err) {
      console.error('Cannot parse current_user from localStorage', err);
    }
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [featuredRes, latestRes, shopsRes] = await Promise.all([
          HomeApi.getFeaturedProducts(8),
          HomeApi.getLatestProducts(12),
          HomeApi.getFeaturedShops(6),
        ]);

        if (featuredRes.success) {
          setFeaturedProducts(featuredRes.data);
        }
        if (latestRes.success) {
          setLatestProducts(latestRes.data);
        }
        if (shopsRes.success) {
          setFeaturedShops(shopsRes.data);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Không tải được dữ liệu trang chủ',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHomeData();
  }, []);

  const handleGoProfile = () => {
    navigate('/me');
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const handleShopClick = (shopId: number) => {
    navigate(`/shops/${shopId}`);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-header-left">
          {user ? (
            <button
              type="button"
              onClick={handleGoProfile}
              className="home-header-user-button"
            >
              {user.name || user.email}
            </button>
          ) : (
            <span className="home-header-title">Mini E</span>
          )}
        </div>
      </header>

      <main className="home-main">
        <div className="home-content">
          {error && <div className="home-error">{error}</div>}

          {loading ? (
            <div className="home-loading">Đang tải...</div>
          ) : (
            <>
              {featuredProducts.length > 0 && (
                <section className="home-section">
                  <h2 className="home-section-title">Sản phẩm nổi bật</h2>
                  <div className="home-products-grid">
                    {featuredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="home-product-card"
                        onClick={() => handleProductClick(product.id)}
                      >
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="home-product-image"
                          />
                        ) : (
                          <div className="home-product-image-placeholder">
                            Không có ảnh
                          </div>
                        )}
                        <div className="home-product-info">
                          <h3 className="home-product-title">{product.title}</h3>
                          <div className="home-product-price">
                            {product.price} {product.currency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {latestProducts.length > 0 && (
                <section className="home-section">
                  <h2 className="home-section-title">Sản phẩm mới nhất</h2>
                  <div className="home-products-grid">
                    {latestProducts.map((product) => (
                      <div
                        key={product.id}
                        className="home-product-card"
                        onClick={() => handleProductClick(product.id)}
                      >
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="home-product-image"
                          />
                        ) : (
                          <div className="home-product-image-placeholder">
                            Không có ảnh
                          </div>
                        )}
                        <div className="home-product-info">
                          <h3 className="home-product-title">{product.title}</h3>
                          <div className="home-product-price">
                            {product.price} {product.currency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {featuredShops.length > 0 && (
                <section className="home-section">
                  <h2 className="home-section-title">Shop nổi bật</h2>
                  <div className="home-shops-grid">
                    {featuredShops.map((shop) => (
                      <div
                        key={shop.id}
                        className="home-shop-card"
                        onClick={() => handleShopClick(shop.id)}
                      >
                        <h3 className="home-shop-name">{shop.name}</h3>
                        {shop.description && (
                          <p className="home-shop-description">
                            {shop.description}
                          </p>
                        )}
                        <span
                          className={`home-shop-status ${
                            shop.status === 'PENDING'
                              ? 'home-shop-status--pending'
                              : shop.status === 'SUSPENDED'
                                ? 'home-shop-status--suspended'
                                : ''
                          }`}
                        >
                          {shop.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!loading &&
                featuredProducts.length === 0 &&
                latestProducts.length === 0 &&
                featuredShops.length === 0 && (
                  <div className="home-empty">
                    Chưa có sản phẩm hoặc shop nào.
                  </div>
                )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
