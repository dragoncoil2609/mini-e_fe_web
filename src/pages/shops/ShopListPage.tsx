import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { searchShops } from '../../api/shop.api';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';
import basketImg from '../../assets/brand/basket_chick.png';

import './style/ShopPages.css';

type ShopView = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  status?: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  email?: string | null;
  productCount?: number;
  totalSold?: number;
  totalOrders?: number;
  stats?: {
    productCount?: number;
    totalSold?: number;
    totalOrders?: number;
    ratingAvg?: number | string;
    reviewCount?: number;
  } | null;
};

function unwrapData<T>(response: any): T {
  return response?.data ?? response;
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải dữ liệu shop.'
  );
}

function getShopLogo(shop: ShopView) {
  return shop.logoUrl || bunnyImg;
}

function getShopProductCount(shop: ShopView) {
  return shop.productCount ?? shop.stats?.productCount ?? 0;
}

function getShopTotalSold(shop: ShopView) {
  return shop.totalSold ?? shop.stats?.totalSold ?? 0;
}

export default function ShopListPage() {
  const [shops, setShops] = useState<ShopView[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  useEffect(() => {
    let mounted = true;

    async function loadShops() {
      setLoading(true);
      setError('');

      try {
        const response = await searchShops({
          q: searchText || undefined,
          status: 'ACTIVE' as any,
          page,
          limit,
        });

        const result = unwrapData<any>(response);

        if (!mounted) return;

        setShops(result?.items ?? []);
        setTotal(Number(result?.total ?? 0));
      } catch (err: any) {
        if (!mounted) return;

        setShops([]);
        setTotal(0);
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadShops();

    return () => {
      mounted = false;
    };
  }, [searchText, page, limit]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchText(keyword.trim());
  };

  return (
    <div className="mochi-page shop-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <b>Cửa hàng</b>
        </div>

        <section className="shop-list-hero">
          <div className="shop-list-hero-content">
            <span className="shop-eyebrow">Mochi Shops ♡</span>
            <h1>Khám phá các cửa hàng dễ thương</h1>
            <p>
              Tìm shop bán gấu bông, văn phòng phẩm, phụ kiện và những món quà
              xinh xắn dành cho bạn.
            </p>

            <form className="shop-search-box" onSubmit={handleSearch}>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm tên shop, địa chỉ, email..."
              />
              <button type="submit">Tìm shop</button>
            </form>

            <div className="shop-hero-actions">
              <Link to="/shops/register" className="mochi-btn mochi-btn-primary">
                Đăng ký bán hàng
              </Link>

              <Link to="/shops/me" className="mochi-btn mochi-btn-outline">
                Shop của tôi
              </Link>
            </div>
          </div>

          <div className="shop-list-hero-art">
            <img src={basketImg} alt="Mochi shop" />
          </div>
        </section>

        <div className="mochi-section-header shop-list-header">
          <div>
            <h2 className="mochi-section-title">Danh sách cửa hàng</h2>
            <p className="mochi-page-desc">
              Hiển thị các shop đang hoạt động trên hệ thống.
            </p>
          </div>

          <span className="shop-total-pill">{total} shop</span>
        </div>

        {loading ? (
          <div className="mochi-card mochi-card-padding shop-state-box">
            Đang tải danh sách shop...
          </div>
        ) : error ? (
          <div className="mochi-card mochi-card-padding shop-state-box shop-state-error">
            <h3>Không thể tải shop</h3>
            <p>{error}</p>
            <p>
              Nếu lỗi là 403, route <b>GET /shops</b> của backend đang chỉ cho
              ADMIN gọi. Bạn cần tạo API public cho danh sách shop.
            </p>
          </div>
        ) : shops.length === 0 ? (
          <div className="mochi-card mochi-empty">
            <h3 className="mochi-empty-title">Chưa có shop nào</h3>
            <p className="mochi-empty-desc">
              Hiện chưa tìm thấy cửa hàng phù hợp.
            </p>
          </div>
        ) : (
          <>
            <div className="shop-list-grid">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shops/${shop.id}`}
                  className="shop-card mochi-card mochi-card-hover"
                >
                  <div className="shop-card-cover">
                    {shop.coverUrl ? (
                      <img src={shop.coverUrl} alt={shop.name} />
                    ) : (
                      <div className="shop-card-cover-fallback" />
                    )}
                  </div>

                  <div className="shop-card-body">
                    <div className="shop-card-logo">
                      <img src={getShopLogo(shop)} alt={shop.name} />
                    </div>

                    <div className="shop-card-info">
                      <h3>{shop.name}</h3>
                      <p>{shop.description || 'Cửa hàng Mochi dễ thương.'}</p>
                    </div>

                    <div className="shop-card-meta">
                      <span>🧸 {getShopProductCount(shop)} sản phẩm</span>
                      <span>📦 {getShopTotalSold(shop)} đã bán</span>
                    </div>

                    {shop.shopAddress ? (
                      <div className="shop-card-address">📍 {shop.shopAddress}</div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <div className="shop-pagination">
              <button
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </button>

              <span>
                Trang {page} / {totalPages}
              </span>

              <button
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}