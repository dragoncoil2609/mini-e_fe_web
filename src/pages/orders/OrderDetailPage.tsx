// src/pages/orders/OrderDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { Order, OrderStatus, ApiResponse } from '../../api/types';
import { normalizeImageUrl } from '../../utils/productImage';
import './OrderDetailPage.css';

export default function OrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.getOrderDetail(id);
      if (res.success) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Không tải được chi tiết đơn hàng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Không tải được chi tiết đơn hàng. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      return;
    }

    setUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await OrdersApi.cancelOrder(id);
      if (res.success) {
        setMessage('Đã hủy đơn hàng thành công.');
        await loadOrder();
      } else {
        setError(res.message || 'Hủy đơn hàng thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Hủy đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  const getItemImageUrl = (item: typeof order.items[0]): string | null => {
    if (!item.imageId) return null;
    const backendBaseUrl =
      import.meta.env.VITE_BACKEND_BASE_URL ||
      (import.meta.env.VITE_API_BASE_URL?.startsWith('http')
        ? new URL(import.meta.env.VITE_API_BASE_URL).origin
        : window.location.origin);
    return `${backendBaseUrl}/uploads/products/${item.imageId}.jpg`;
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      CANCELLED: 'Đã hủy',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: OrderStatus): string => {
    const classes: Record<OrderStatus, string> = {
      PENDING: 'order-detail-status-pending',
      CONFIRMED: 'order-detail-status-confirmed',
      PROCESSING: 'order-detail-status-processing',
      SHIPPING: 'order-detail-status-shipping',
      DELIVERED: 'order-detail-status-delivered',
      CANCELLED: 'order-detail-status-cancelled',
      REFUNDED: 'order-detail-status-refunded',
    };
    return classes[status] || '';
  };

  if (!id) {
    return (
      <div className="order-detail-container">
        <div className="order-detail-card">
          <div className="order-detail-error">Thiếu ID đơn hàng.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="order-detail-card">
          <div className="order-detail-loading">Đang tải chi tiết đơn hàng...</div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-detail-container">
        <div className="order-detail-card">
          <div className="order-detail-error">{error}</div>
          <button onClick={() => navigate('/orders')} className="order-detail-back-button">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-detail-container">
      <div className="order-detail-card">
        <div className="order-detail-header">
          <div className="order-detail-header-buttons">
            <button onClick={() => navigate('/orders')} className="order-detail-back-button">
              ← Quay lại
            </button>
            <button onClick={() => navigate('/home')} className="home-button">
              🏠 Về trang chủ
            </button>
          </div>
          <h1 className="order-detail-title">Chi tiết đơn hàng</h1>
        </div>

        {error && <div className="order-detail-error-message">{error}</div>}
        {message && <div className="order-detail-success-message">{message}</div>}

        <div className="order-detail-section">
          <div className="order-detail-info-row">
            <span className="order-detail-label">Mã đơn hàng:</span>
            <span className="order-detail-value">{order.orderNumber}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Trạng thái:</span>
            <span className={`order-detail-status ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Ngày đặt:</span>
            <span className="order-detail-value">
              {new Date(order.createdAt || '').toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Thông tin giao hàng</h2>
          <div className="order-detail-address">
            <div className="order-detail-address-name">{order.fullName}</div>
            <div className="order-detail-address-phone">{order.phone}</div>
            <div className="order-detail-address-text">{order.formattedAddress}</div>
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Sản phẩm</h2>
          <div className="order-detail-items">
            {order.items.map((item) => {
              const imageUrl = getItemImageUrl(item);
              const itemTotal = parseFloat(item.price) * item.quantity;

              return (
                <div key={item.id} className="order-detail-item">
                  <div className="order-detail-item-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.title} />
                    ) : (
                      <div className="order-detail-item-image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="order-detail-item-info">
                    <Link
                      to={`/products/${item.productId}`}
                      className="order-detail-item-title"
                    >
                      {item.title}
                    </Link>
                    {item.variantName && (
                      <div className="order-detail-item-variant">
                        Biến thể: {item.variantName}
                      </div>
                    )}
                    {item.sku && (
                      <div className="order-detail-item-sku">SKU: {item.sku}</div>
                    )}
                    <div className="order-detail-item-price">
                      {formatPrice(item.price)} {order.currency} × {item.quantity}
                    </div>
                  </div>
                  <div className="order-detail-item-total">
                    {formatPrice(itemTotal.toFixed(2))} {order.currency}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {order.notes && (
          <div className="order-detail-section">
            <h2 className="order-detail-section-title">Ghi chú</h2>
            <div className="order-detail-notes">{order.notes}</div>
          </div>
        )}

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Tổng thanh toán</h2>
          <div className="order-detail-summary">
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Tạm tính:</span>
              <span className="order-detail-summary-value">
                {formatPrice(order.subtotal)} {order.currency}
              </span>
            </div>
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Phí vận chuyển:</span>
              <span className="order-detail-summary-value">
                {formatPrice(order.shippingFee)} {order.currency}
              </span>
            </div>
            <div className="order-detail-summary-total">
              <span className="order-detail-summary-total-label">Tổng cộng:</span>
              <span className="order-detail-summary-total-value">
                {formatPrice(order.total)} {order.currency}
              </span>
            </div>
          </div>
        </div>

        {order.status === 'PENDING' && (
          <div className="order-detail-actions">
            <button
              onClick={handleCancelOrder}
              disabled={updating}
              className="order-detail-cancel-button"
            >
              {updating ? 'Đang xử lý...' : 'Hủy đơn hàng'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

