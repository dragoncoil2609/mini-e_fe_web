import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getShopDetail } from '../../api/shop.api';
import { getProductsByShop } from '../../api/products.api';
import type { ProductListItem, Shop } from '../../api/types';
import { getMainImageUrl } from '../../utils/productImage';
import './ShopDetailsPage.css';

interface PublicShop extends Shop {
  productCount?: number;
  totalSold?: number;
  totalOrders?: number;
}

export default function ShopDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<PublicShop | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericId = id ? Number(id) : null;

  useEffect(() => {
    if (numericId) {
      void loadData(numericId);
    }
  }, [numericId]);

  const loadData = async (shopId: number) => {
    setLoading(true);
    setError(null);

    try {
      const shopRes = await getShopDetail(shopId);
      if (!shopRes.success) {
        setError(shopRes.message || 'Không tìm thấy shop này.');
        setShop(null);
        setProducts([]);
        return;
      }

      setShop(shopRes.data as PublicShop);

      const prodRes = await getProductsByShop(shopId, {
        page: 1,
        limit: 50,
      });

      if (prodRes.success) {
        const payload: any = prodRes.data;
        const items: ProductListItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        setProducts(items);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error(e);
      setError('Lỗi kết nối tới server.');
      setShop(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(val || 0));

  if (!numericId) {
    return (
      <div className="shop-detail-page">
        <div className="shop-detail-container">
          <div className="shop-detail-status shop-detail-status-error">
            URL shop không hợp lệ.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shop-detail-page">
        <div className="shop-detail-container">
          <div className="shop-detail-status">Đang tải thông tin shop...</div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="shop-detail-page">
        <div className="shop-detail-container">
          <div className="shop-detail-status shop-detail-status-error">
            {error || 'Shop không tồn tại.'}
          </div>
          <button
            type="button"
            className="shop-back-button"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const joinedAt = shop.createdAt
    ? new Date(shop.createdAt).toLocaleDateString('vi-VN')
    : '';

  return (
    <div className="shop-detail-page">
      <div className="shop-detail-container">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shop-back-button"
        >
          ← Quay lại
        </button>

        <section className="shop-detail-card">
          <div
            className="shop-detail-cover"
            style={
              shop.coverUrl
                ? { backgroundImage: `url(${shop.coverUrl})` }
                : undefined
            }
          />

          <div className="shop-detail-header-content">
            <div className="shop-detail-avatar-wrapper">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} />
              ) : (
                <span className="shop-detail-avatar-placeholder">
                  {shop.name?.charAt(0).toUpperCase() || '🏠'}
                </span>
              )}
            </div>

            <div className="shop-detail-main-info">
              <h1 className="shop-detail-name">{shop.name}</h1>

              <div className="shop-detail-meta">
                {shop.shopAddress && (
                  <div className="shop-detail-meta-item">
                    <span className="meta-icon">📍</span>
                    <span>{shop.shopAddress}</span>
                  </div>
                )}

                {joinedAt && (
                  <div className="shop-detail-meta-item">
                    <span className="meta-icon">📅</span>
                    <span>Tham gia: {joinedAt}</span>
                  </div>
                )}

                {shop.email && (
                  <div className="shop-detail-meta-item">
                    <span className="meta-icon">✉️</span>
                    <span>{shop.email}</span>
                  </div>
                )}

                {shop.shopPhone && (
                  <div className="shop-detail-meta-item">
                    <span className="meta-icon">📞</span>
                    <span>{shop.shopPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shop-public-stats">
              <div className="stat-box">
                <span className="stat-num">{shop.productCount ?? products.length}</span>
                <span className="stat-label">Sản phẩm</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{shop.totalSold ?? 0}</span>
                <span className="stat-label">Đã bán</span>
              </div>
            </div>
          </div>

          <div className="shop-detail-description">
            <h2>Giới thiệu shop</h2>
            <p>{shop.description || 'Shop chưa cập nhật phần giới thiệu.'}</p>
          </div>
        </section>

        <section className="shop-products-section">
          <div className="shop-products-header">
            <div>
              <h2>Sản phẩm của shop</h2>
              <p className="shop-products-subtitle">
                {products.length > 0
                  ? `${products.length} sản phẩm đang hiển thị`
                  : 'Shop hiện chưa có sản phẩm nào.'}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="shop-empty-products">
              Shop này hiện chưa đăng bán sản phẩm nào.
            </div>
          ) : (
            <div className="shop-products-grid">
              {products.map((p) => {
                const mainImg = getMainImageUrl(p);

                return (
                  <div
                    key={p.id}
                    className="shop-product-card"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <div className="shop-product-thumb">
                      {mainImg ? (
                        <img src={mainImg} alt={p.title} />
                      ) : (
                        <div className="shop-product-thumb-placeholder">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>

                    <div className="shop-product-info">
                      <div className="shop-product-name" title={p.title}>
                        {p.title}
                      </div>
                      <div className="shop-product-price">
                        {formatCurrency(p.price)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}