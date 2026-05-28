// src/pages/orders/OrderDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { OrdersApi } from '../../api/orders.api';
import type { Order, OrderItem } from '../../api/types';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/OrderDetailPage.css';

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat('vi-VN').format(toNumber(value)) + 'đ';
}

function formatDate(value?: string | null): string {
  if (!value) return 'Không rõ thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getApiMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải chi tiết đơn hàng.'
  );
}

function getOrderStatusText(order: Order): string {
  if (order.status === 'CANCELLED') return 'Đã hủy';
  if (order.status === 'COMPLETED') return 'Hoàn tất';

  if (order.shippingStatus === 'IN_TRANSIT') return 'Đang giao';
  if (order.shippingStatus === 'DELIVERED') return 'Đã giao';
  if (order.shippingStatus === 'RETURNED') return 'Đã trả hàng';
  if (order.shippingStatus === 'PICKED') return 'Shop đã nhận đơn';

  if (order.status === 'PROCESSING') return 'Đang xử lý';
  if (order.status === 'SHIPPED') return 'Đang vận chuyển';

  return 'Chờ xác nhận';
}

function getPaymentText(order: Order): string {
  if (order.paymentMethod === 'COD') {
    return order.paymentStatus === 'PAID'
      ? 'COD - đã thanh toán'
      : 'COD - thanh toán khi nhận hàng';
  }

  return order.paymentStatus === 'PAID'
    ? 'VNPAY - đã thanh toán'
    : 'VNPAY - chưa thanh toán';
}

function getItemVariantText(item: OrderItem): string {
  const values = [item.value1, item.value2, item.value3, item.value4, item.value5]
    .filter(Boolean)
    .join(' • ');

  return values || 'Không có phân loại';
}

function canCancel(order: Order): boolean {
  return (
    order.status !== 'CANCELLED' &&
    order.status !== 'COMPLETED' &&
    order.shippingStatus === 'PENDING'
  );
}

function canConfirmReceived(order: Order): boolean {
  return order.status !== 'COMPLETED' && order.shippingStatus === 'IN_TRANSIT';
}

function canRequestReturn(order: Order): boolean {
  return order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED';
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const items = useMemo(() => order?.items ?? [], [order]);

  async function loadOrder() {
    if (!id) {
      setError('Thiếu mã đơn hàng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await OrdersApi.getOrderDetail(id);
      setOrder(response.data);
    } catch (err: any) {
      setOrder(null);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function runCancel() {
    if (!order) return;

    const ok = window.confirm(`Bạn muốn hủy đơn ${order.code}?`);
    if (!ok) return;

    setActionLoading(true);
    setError('');

    try {
      await OrdersApi.cancelOrder(order.id);
      window.dispatchEvent(new Event('mochi-orders-updated'));
      await loadOrder();
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function runConfirmReceived() {
    if (!order) return;

    setActionLoading(true);
    setError('');

    try {
        await OrdersApi.confirmReceived(order.id);
        window.dispatchEvent(new Event('mochi-orders-updated'));
        await loadOrder();
    } catch (err: any) {
        setError(getApiMessage(err));
    } finally {
        setActionLoading(false);
    }
    }

  async function runRequestReturn() {
    if (!order) return;

    const ok = window.confirm(`Yêu cầu trả hàng cho đơn ${order.code}?`);
    if (!ok) return;

    setActionLoading(true);
    setError('');

    try {
      await OrdersApi.requestReturn(order.id);
      window.dispatchEvent(new Event('mochi-orders-updated'));
      await loadOrder();
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="mochi-page order-detail-page">
        <div className="mochi-container">
          <section className="order-detail-loading mochi-card">
            <div className="mochi-loading-spinner" />
            <p>Đang tải chi tiết đơn hàng...</p>
          </section>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mochi-page order-detail-page">
        <div className="mochi-container">
          <section className="order-detail-empty mochi-card">
            <img src={bunnyImg} alt="Không tìm thấy đơn" />
            <h1>Không tìm thấy đơn hàng</h1>
            <p>{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}</p>
            <button
              type="button"
              className="mochi-btn mochi-btn-primary"
              onClick={() => navigate('/orders')}
            >
              Quay lại đơn hàng
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page order-detail-page">
      <div className="mochi-container">
        <section className="order-detail-hero mochi-card">
          <div>
            <Link to="/orders" className="order-detail-back">
              ← Quay lại danh sách đơn
            </Link>

            <h1>Đơn hàng #{order.code}</h1>
            <p>Đặt lúc: {formatDate(order.createdAt)}</p>
          </div>

          <div className="order-detail-status-box">
            <span>{getOrderStatusText(order)}</span>
            <b>{formatMoney(order.total)}</b>
          </div>
        </section>

        {error ? <div className="order-detail-alert">{error}</div> : null}

        <div className="order-detail-layout">
          <main className="order-detail-main">
            <section className="order-detail-section mochi-card">
              <h2>🧸 Sản phẩm đã đặt</h2>

              <div className="order-detail-items">
                {items.map((item) => (
                  <article key={item.id} className="order-detail-item">
                    <img
                      src={item.imageSnapshot || bunnyImg}
                      alt={item.nameSnapshot}
                      onError={(event) => {
                        event.currentTarget.src = bunnyImg;
                      }}
                    />

                    <div>
                      <h3>{item.nameSnapshot}</h3>
                      <p>Phân loại: {getItemVariantText(item)}</p>
                      <p>
                        {formatMoney(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <strong>{formatMoney(item.totalLine)}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="order-detail-section mochi-card">
              <h2>📍 Thông tin nhận hàng</h2>

              <div className="order-detail-address">
                <b>{order.addressSnapshot?.fullName}</b>
                <p>☎ {order.addressSnapshot?.phone}</p>
                <p>{order.addressSnapshot?.formattedAddress}</p>
              </div>
            </section>
          </main>

          <aside className="order-detail-summary mochi-card">
            <h2>♡ Tổng kết đơn</h2>

            <div className="order-detail-summary-row">
              <span>Trạng thái đơn</span>
              <strong>{getOrderStatusText(order)}</strong>
            </div>

            <div className="order-detail-summary-row">
              <span>Thanh toán</span>
              <strong>{getPaymentText(order)}</strong>
            </div>

            <div className="order-detail-summary-row">
              <span>Tạm tính</span>
              <strong>{formatMoney(order.subtotal)}</strong>
            </div>

            <div className="order-detail-summary-row">
              <span>Giảm giá</span>
              <strong>{formatMoney(order.discount)}</strong>
            </div>

            <div className="order-detail-summary-row">
              <span>Phí vận chuyển</span>
              <strong>{formatMoney(order.shippingFee)}</strong>
            </div>

            <div className="order-detail-divider" />

            <div className="order-detail-total">
              <span>Tổng tiền</span>
              <strong>{formatMoney(order.total)}</strong>
            </div>

            {order.note ? (
              <div className="order-detail-note">
                <span>Ghi chú</span>
                <p>{order.note}</p>
              </div>
            ) : null}

            <div className="order-detail-actions">
              {canCancel(order) ? (
                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline"
                  disabled={actionLoading}
                  onClick={runCancel}
                >
                  {actionLoading ? 'Đang hủy...' : 'Hủy đơn'}
                </button>
              ) : null}

              {canConfirmReceived(order) ? (
                <button
                  type="button"
                  className="mochi-btn mochi-btn-primary"
                  disabled={actionLoading}
                  onClick={runConfirmReceived}
                >
                  {actionLoading ? 'Đang xác nhận...' : 'Tôi đã nhận hàng'}
                </button>
              ) : null}

              {canRequestReturn(order) ? (
                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline"
                  disabled={actionLoading}
                  onClick={runRequestReturn}
                >
                  {actionLoading ? 'Đang gửi...' : 'Yêu cầu trả hàng'}
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}