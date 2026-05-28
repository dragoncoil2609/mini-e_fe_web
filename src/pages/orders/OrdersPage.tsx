// src/pages/orders/OrdersPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { OrdersApi } from '../../api/orders.api';
import type { Order, PaginatedResult } from '../../api/types';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/OrdersPage.css';

const PAGE_LIMIT = 10;

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
    'Không thể tải đơn hàng.'
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
  if (order.paymentMethod === 'COD') return 'Thanh toán khi nhận hàng';
  return order.paymentStatus === 'PAID'
    ? 'VNPAY đã thanh toán'
    : 'VNPAY chưa thanh toán';
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

export default function OrdersPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const orders = result?.items ?? [];

  const pageCount = useMemo(() => {
    if (!result) return 1;
    return Math.max(1, Math.ceil(toNumber(result.total) / PAGE_LIMIT));
  }, [result]);

  async function loadOrders(nextPage = page) {
    setLoading(true);
    setError('');

    try {
      const response = await OrdersApi.getMyOrders({
        page: nextPage,
        limit: PAGE_LIMIT,
      });

      setResult(response.data);
    } catch (err: any) {
      setResult(null);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function runCancel(order: Order) {
    const ok = window.confirm(`Bạn muốn hủy đơn ${order.code}?`);
    if (!ok) return;

    setActionOrderId(order.id);
    setError('');

    try {
      await OrdersApi.cancelOrder(order.id);
      window.dispatchEvent(new Event('mochi-orders-updated'));
      await loadOrders();
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setActionOrderId(null);
    }
  }

  async function runConfirmReceived(order: Order) {
    setActionOrderId(order.id);
    setError('');

    try {
        await OrdersApi.confirmReceived(order.id);
        window.dispatchEvent(new Event('mochi-orders-updated'));
        await loadOrders();
    } catch (err: any) {
        setError(getApiMessage(err));
    } finally {
        setActionOrderId(null);
    }
    }

  async function runRequestReturn(order: Order) {
    const ok = window.confirm(`Yêu cầu trả hàng cho đơn ${order.code}?`);
    if (!ok) return;

    setActionOrderId(order.id);
    setError('');

    try {
      await OrdersApi.requestReturn(order.id);
      window.dispatchEvent(new Event('mochi-orders-updated'));
      await loadOrders();
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setActionOrderId(null);
    }
  }

  useEffect(() => {
    void loadOrders(page);
  }, [page]);

  useEffect(() => {
    if (params.get('created') === '1') {
      setNotice('Đặt hàng thành công. Đơn hàng của bạn đã được tạo.');
      return;
    }

    if (params.get('paid') === '1') {
      setNotice('Thanh toán VNPAY thành công. Đơn hàng đã được tạo.');
      return;
    }

    setNotice('');
  }, [location.search]);

  return (
    <div className="mochi-page orders-page">
      <div className="mochi-container">
        <section className="orders-hero mochi-card">
          <div>
            <h1>Đơn hàng của tôi</h1>
            <p>Theo dõi trạng thái xử lý, giao hàng và thanh toán của đơn.</p>
          </div>

          <img src={bunnyImg} alt="Đơn hàng Mochi" />
        </section>

        {notice ? <div className="orders-alert orders-alert-success">{notice}</div> : null}
        {error ? <div className="orders-alert orders-alert-error">{error}</div> : null}

        {loading ? (
          <section className="orders-loading mochi-card">
            <div className="mochi-loading-spinner" />
            <p>Đang tải đơn hàng...</p>
          </section>
        ) : orders.length <= 0 ? (
          <section className="orders-empty mochi-card">
            <img src={bunnyImg} alt="Chưa có đơn hàng" />
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy chọn vài món đồ dễ thương rồi quay lại đây xem đơn nhé.</p>
            <Link to="/products" className="mochi-btn mochi-btn-primary">
              Khám phá sản phẩm
            </Link>
          </section>
        ) : (
          <>
            <section className="orders-list">
              {orders.map((order) => {
                const acting = actionOrderId === order.id;

                return (
                  <article key={order.id} className="orders-card mochi-card">
                    <div className="orders-card-main">
                      <div>
                        <div className="orders-code-row">
                          <h2>#{order.code}</h2>
                          <span className={`orders-status orders-status-${order.status.toLowerCase()}`}>
                            {getOrderStatusText(order)}
                          </span>
                        </div>

                        <p className="orders-date">Đặt lúc: {formatDate(order.createdAt)}</p>
                        <p className="orders-payment">{getPaymentText(order)}</p>
                        <p className="orders-address">
                          📍 {order.addressSnapshot?.fullName} - {order.addressSnapshot?.phone}
                        </p>
                      </div>

                      <div className="orders-total-box">
                        <span>Tổng tiền</span>
                        <strong>{formatMoney(order.total)}</strong>
                      </div>
                    </div>

                    <div className="orders-actions">
                      <Link to={`/orders/${order.id}`} className="mochi-btn mochi-btn-outline">
                        Xem chi tiết
                      </Link>

                      {canCancel(order) ? (
                        <button
                          type="button"
                          className="mochi-btn mochi-btn-outline"
                          disabled={acting}
                          onClick={() => runCancel(order)}
                        >
                          {acting ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      ) : null}

                      {canConfirmReceived(order) ? (
                        <button
                          type="button"
                          className="mochi-btn mochi-btn-primary"
                          disabled={acting}
                          onClick={() => runConfirmReceived(order)}
                        >
                          {acting ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                        </button>
                      ) : null}

                      {canRequestReturn(order) ? (
                        <button
                          type="button"
                          className="mochi-btn mochi-btn-outline"
                          disabled={acting}
                          onClick={() => runRequestReturn(order)}
                        >
                          {acting ? 'Đang gửi...' : 'Yêu cầu trả hàng'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="orders-pagination">
              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ← Trang trước
              </button>

              <span>
                Trang {page}/{pageCount}
              </span>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                disabled={page >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Trang sau →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}