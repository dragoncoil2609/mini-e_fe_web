import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyShop } from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import './style/ShopReviewsPage.css';

type ShopView = {
  id: number;
  name: string;
  stats?: {
    ratingAvg?: number | string;
    reviewCount?: number;
  } | null;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải đánh giá shop.'
  );
}

function ratingText(value?: number | string) {
  return Number(value ?? 0).toFixed(1);
}

export default function ShopReviewsPage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadShop() {
    setLoading(true);
    setError('');

    try {
      const response = await getMyShop();
      setShop(unwrapApiData<ShopView>(response));
    } catch (err: any) {
      setError(getApiMessage(err));
      setShop(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadShop();
  }, []);

  const ratingAvg = ratingText(shop?.stats?.ratingAvg);
  const reviewCount = shop?.stats?.reviewCount ?? 0;

  return (
    <div className="mochi-page shop-reviews-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Đánh giá</b>
        </div>

        <div className="shop-reviews-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-reviews-main">
            <section className="shop-reviews-head mochi-card">
              <div>
                <h1>Đánh giá shop</h1>
                <p>
                  Hiện backend mới có điểm trung bình và số lượt đánh giá trong
                  thống kê shop. Danh sách review chi tiết theo shop cần thêm API
                  riêng sau.
                </p>
              </div>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                onClick={() => void loadShop()}
              >
                Làm mới
              </button>
            </section>

            {loading ? (
              <div className="mochi-card mochi-card-padding shop-reviews-state">
                Đang tải đánh giá...
              </div>
            ) : error ? (
              <div className="mochi-card mochi-card-padding shop-reviews-error">
                {error}
              </div>
            ) : (
              <>
                <section className="shop-reviews-summary mochi-card">
                  <div className="shop-reviews-score">
                    <strong>{ratingAvg}</strong>
                    <span>/5</span>
                  </div>

                  <div>
                    <h2>Điểm đánh giá trung bình</h2>
                    <p>{reviewCount} lượt đánh giá</p>

                    <div className="shop-reviews-stars">
                      {'★★★★★'.split('').map((star, index) => (
                        <span key={index}>{star}</span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="shop-reviews-empty mochi-card">
                  <h2>Chưa có danh sách review chi tiết</h2>

                  <p>
                    Để hiển thị từng bình luận, ảnh review, tên người đánh giá,
                    cần backend thêm API ví dụ:
                  </p>

                  <code>GET /reviews/shop/me</code>

                  <p>
                    Hoặc API theo shop:
                  </p>

                  <code>GET /reviews/shop/:shopId</code>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}