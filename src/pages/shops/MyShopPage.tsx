import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { deleteShop, getMyShop } from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';
import basketImg from '../../assets/brand/basket_chick.png';

import './style/MyShopPage.css';

type ShopView = {
  id: number;
  userId?: number | null;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  email?: string | null;
  status?: string;
  verifiedAt?: string | null;
  createdAt?: string | null;
  shopAddress?: string | null;
  shopPhone?: string | null;
  productCount?: number;
  totalRevenue?: number | string;
  totalOrders?: number;
  totalSold?: number;
  stats?: {
    productCount?: number;
    totalRevenue?: number | string;
    totalOrders?: number;
    totalSold?: number;
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
    'Không thể tải thông tin shop.'
  );
}

function isNotFoundShop(error: any) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || '').toLowerCase();

  return (
    status === 404 ||
    message.includes('chưa có shop') ||
    message.includes('không tìm thấy shop')
  );
}

function formatMoney(value?: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';

  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusInfo(status?: string) {
  if (status === 'ACTIVE') {
    return {
      label: 'Đang bán',
      className: 'my-shop-status-active',
      title: 'Shop đã được duyệt',
      desc: 'Bạn có thể bắt đầu đăng bán và quản lý sản phẩm.',
    };
  }

  if (status === 'SUSPENDED') {
    return {
      label: 'Tạm khóa',
      className: 'my-shop-status-suspended',
      title: 'Shop đang bị tạm khóa',
      desc: 'Shop hiện chưa thể bán hàng. Vui lòng liên hệ admin để được hỗ trợ.',
    };
  }

  return {
    label: 'Chờ duyệt',
    className: 'my-shop-status-pending',
    title: 'Shop đang chờ admin duyệt',
    desc: 'Bạn có thể chỉnh sửa thông tin shop trong thời gian chờ duyệt.',
  };
}

export default function MyShopPage() {
  const navigate = useNavigate();

  const [shop, setShop] = useState<ShopView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function loadMyShop() {
    setLoading(true);
    setError('');
    setNotFound(false);

    try {
      const response = await getMyShop();
      const data = unwrapApiData<ShopView>(response);
      setShop(data);
    } catch (err: any) {
      setShop(null);

      if (isNotFoundShop(err)) {
        setNotFound(true);
        setError('');
      } else {
        setError(getApiMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyShop();
  }, []);

  const statusInfo = useMemo(() => getStatusInfo(shop?.status), [shop?.status]);

  const productCount = shop?.productCount ?? shop?.stats?.productCount ?? 0;
  const totalRevenue = shop?.totalRevenue ?? shop?.stats?.totalRevenue ?? 0;
  const totalOrders = shop?.totalOrders ?? shop?.stats?.totalOrders ?? 0;
  const totalSold = shop?.totalSold ?? shop?.stats?.totalSold ?? 0;
  const ratingAvg = shop?.stats?.ratingAvg ?? 0;
  const reviewCount = shop?.stats?.reviewCount ?? 0;

  const handleDeleteShop = async () => {
    if (!shop) return;

    setDeleting(true);

    try {
      await deleteShop(shop.id);
      setShowDeleteConfirm(false);
      navigate('/shops/register', { replace: true });
    } catch (err: any) {
      alert(getApiMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mochi-page my-shop-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding my-shop-state">
            Đang tải thông tin shop...
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mochi-page my-shop-page">
        <div className="mochi-container">
          <div className="mochi-breadcrumb">
            <Link to="/home">Trang chủ</Link>
            <span>›</span>
            <b>Shop của tôi</b>
          </div>

          <section className="my-shop-empty mochi-card">
            <div className="my-shop-empty-content">
              <span className="my-shop-eyebrow">Mochi Seller ♡</span>

              <h1>Bạn chưa có shop</h1>

              <p>
                Hãy đăng ký shop để bắt đầu bán các sản phẩm dễ thương trên
                Mochi. Sau khi gửi đăng ký, admin sẽ duyệt rồi bạn mới có thể
                bán hàng.
              </p>

              <div className="my-shop-empty-actions">
                <Link to="/shops/register" className="mochi-btn mochi-btn-primary">
                  Đăng ký shop ngay
                </Link>

                <Link to="/home" className="mochi-btn mochi-btn-outline">
                  Về trang chủ
                </Link>
              </div>
            </div>

            <img src={basketImg} alt="Đăng ký shop" />
          </section>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="mochi-page my-shop-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding my-shop-state my-shop-error">
            <h3>Không thể tải shop</h3>
            <p>{error || 'Có lỗi xảy ra khi tải thông tin shop.'}</p>

            <button
              type="button"
              className="mochi-btn mochi-btn-primary"
              onClick={() => void loadMyShop()}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page my-shop-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <b>Shop của tôi</b>
        </div>

        <div className="my-shop-layout">
          <ShopOwnerSidebar shopId={shop.id} />

          <main className="my-shop-main">
            <section className="my-shop-hero mochi-card">
              <div className="my-shop-profile">
                <div className="my-shop-avatar">
                  <img src={shop.logoUrl || bunnyImg} alt={shop.name} />
                </div>

                <div className="my-shop-profile-info">
                  <div className="my-shop-title-row">
                    <h1>{shop.name}</h1>
                    <span className={`my-shop-status ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <p>{shop.description || 'Shop chưa cập nhật mô tả.'}</p>

                  <small>
                    Thời gian tạo shop:{' '}
                    {formatDate(shop.createdAt || shop.verifiedAt)}
                  </small>
                </div>
              </div>

              <div className="my-shop-status-box">
                <strong>{statusInfo.title}</strong>
                <p>{statusInfo.desc}</p>

                <Link
                  to="/shops/me/settings"
                  className="mochi-btn mochi-btn-primary mochi-btn-sm"
                >
                  Chỉnh sửa thông tin
                </Link>
              </div>

              <img src={bunnyImg} alt="Mochi" className="my-shop-hero-art" />
            </section>

            <section className="my-shop-section">
              <div className="mochi-section-header">
                <h2 className="mochi-section-title">Tổng quan hoạt động</h2>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline mochi-btn-sm"
                  onClick={() => void loadMyShop()}
                >
                  Làm mới
                </button>
              </div>

              <div className="my-shop-stat-grid">
                <div className="my-shop-stat mochi-card">
                  <span>Doanh thu</span>
                  <strong>{formatMoney(totalRevenue)}</strong>
                  <small>Tổng doanh thu shop</small>
                </div>

                <div className="my-shop-stat mochi-card">
                  <span>Đơn hàng</span>
                  <strong>{totalOrders}</strong>
                  <small>Tổng đơn hàng</small>
                </div>

                <div className="my-shop-stat mochi-card">
                  <span>Sản phẩm</span>
                  <strong>{productCount}</strong>
                  <small>{totalSold} sản phẩm đã bán</small>
                </div>

                <div className="my-shop-stat mochi-card">
                  <span>Đánh giá</span>
                  <strong>{ratingAvg}/5</strong>
                  <small>{reviewCount} đánh giá</small>
                </div>
              </div>
            </section>

            <section className="my-shop-info-panel mochi-card">
              <div>
                <h2>Thông tin shop</h2>

                <div className="my-shop-info-list">
                  <p>
                    <b>Email:</b> {shop.email || 'Chưa cập nhật'}
                  </p>

                  <p>
                    <b>Số điện thoại:</b> {shop.shopPhone || 'Chưa cập nhật'}
                  </p>

                  <p>
                    <b>Địa chỉ:</b> {shop.shopAddress || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="my-shop-danger">
                <h3>CHÚ Ý</h3>

                <p>
                  Khi xóa shop, các sản phẩm thuộc shop sẽ bị xóa.
                  Hãy cân nhắc trước khi xóa shop của bạn.
                </p>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
                  Xóa shop
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      {showDeleteConfirm ? (
        <div className="my-shop-delete-overlay">
          <div className="my-shop-delete-modal mochi-card">
            <h3>Xóa shop?</h3>

            <p>
              Khi xóa shop thì tất cả các sản phẩm của bạn sẽ bị xóa. Bạn chắc
              chắn muốn xóa chứ?
            </p>

            <div className="my-shop-delete-actions">
              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Không
              </button>

              <button
                type="button"
                className="mochi-btn mochi-btn-danger"
                onClick={handleDeleteShop}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Có'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}