import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { Order, OrderStatus, PaymentStatus, ShippingStatus } from '../../api/types';
import './OrdersPage.css';

function formatMoney(value: string | number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`;
}

function labelOrderStatus(status: OrderStatus) {
  const map: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    PAID: 'Đã thanh toán',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    REFUNDED: 'Đã hoàn tiền',
  };
  return map[String(status)] || String(status);
}

function labelShippingStatus(status: ShippingStatus) {
  const map: Record<string, string> = {
    PENDING: 'Chờ shop xác nhận',
    PICKED: 'Shop đã nhận đơn',
    IN_TRANSIT: 'Đang giao',
    DELIVERED: 'Đã giao',
    RETURNED: 'Hoàn hàng',
    CANCELED: 'Đã huỷ',
  };
  return map[String(status)] || String(status);
}

function labelPaymentStatus(status: PaymentStatus) {
  const map: Record<string, string> = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    REFUNDED: 'Đã hoàn tiền',
  };
  return map[String(status)] || String(status);
}

function getFlowLabel(order: Order) {
  if (order.status === 'CANCELLED' || order.shippingStatus === 'CANCELED') return 'Đã huỷ';
  if (order.shippingStatus === 'RETURNED') return 'Hoàn hàng';
  if (order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED') return 'Đã nhận hàng';

  const map: Record<string, string> = {
    PENDING: 'Chờ shop xác nhận',
    PICKED: 'Shop đã nhận đơn',
    IN_TRANSIT: 'Đang giao',
    DELIVERED: 'Đã giao',
  };

  return map[String(order.shippingStatus)] || String(order.shippingStatus);
}

function getStatusClass(order: Order) {
  if (order.status === 'CANCELLED' || order.shippingStatus === 'CANCELED') {
    return 'orders-item-status orders-status-cancelled';
  }
  if (order.shippingStatus === 'RETURNED' || order.paymentStatus === 'REFUNDED') {
    return 'orders-item-status orders-status-refunded';
  }
  if (order.status === 'COMPLETED' || order.shippingStatus === 'DELIVERED') {
    return 'orders-item-status orders-status-delivered';
  }
  if (order.status === 'SHIPPED' || order.shippingStatus === 'IN_TRANSIT') {
    return 'orders-item-status orders-status-shipping';
  }
  if (order.status === 'PROCESSING' || order.shippingStatus === 'PICKED') {
    return 'orders-item-status orders-status-processing';
  }
  if (order.paymentStatus === 'PAID') {
    return 'orders-item-status orders-status-confirmed';
  }
  return 'orders-item-status orders-status-pending';
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(Math.max(1, Number(sp.get('page')) || 1));
  const [limit] = useState<number>(Math.max(1, Number(sp.get('limit')) || 20));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const paid = sp.get('paid') === '1';
  const session = sp.get('session') || '';

  const syncSearchParams = () => {
    const next = new URLSearchParams(sp);
    next.set('page', String(page));
    next.set('limit', String(limit));
    setSp(next, { replace: true });
  };

  const dismissPaidBanner = () => {
    const next = new URLSearchParams(sp);
    next.delete('paid');
    next.delete('session');
    setSp(next, { replace: true });
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.getMyOrders({ page, limit });
      if (!res.success) {
        setError(res.message || 'Không tải được đơn hàng');
        return;
      }
      setOrders(res.data.items || []);
      setTotal(Number(res.data.total || 0));
      syncSearchParams();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="orders-container">
      <header className="orders-headerbar">
        <div className="orders-headerbar-content">
          <button className="orders-brand" onClick={() => navigate('/home')}>
            Mini-E
          </button>

          <div className="orders-headerbar-right">
            <Link className="orders-chip" to="/products">
              🛍️ Sản phẩm
            </Link>
            <Link className="orders-chip" to="/cart">
              🛒 Giỏ hàng
            </Link>
            <Link className="orders-chip" to="/orders">
              📦 Đơn hàng
            </Link>
          </div>
        </div>
      </header>

      <main className="orders-main">
        <div className="orders-content">
          <div className="orders-card">
            <div className="orders-page-title">
              <div>
                <h1 className="orders-title">Đơn hàng của tôi</h1>
                <p className="orders-subtitle">Theo dõi trạng thái và xem chi tiết từng đơn.</p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="orders-primary"
                  onClick={() => void load()}
                  style={{ textDecoration: 'none', border: 'none', cursor: 'pointer' }}
                >
                  🔄 Tải lại
                </button>
                <Link to="/products" className="orders-primary">
                  Mua thêm
                </Link>
              </div>
            </div>

            {paid && (
              <div
                style={{
                  marginBottom: 14,
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid #abefc6',
                  background: '#ecfdf3',
                  color: '#067647',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Thanh toán thành công</div>
                  <div style={{ fontSize: 14 }}>
                    Đơn hàng của bạn đã được ghi nhận.{session ? ` Mã phiên: ${session}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissPaidBanner}
                  style={{
                    border: '1px solid #abefc6',
                    background: '#fff',
                    color: '#067647',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            )}

            {loading && <div className="orders-loading">Đang tải...</div>}
            {error && <div className="orders-error">{error}</div>}

            {!loading && !error && orders.length === 0 && (
              <div className="orders-empty">
                <p>Bạn chưa có đơn hàng nào.</p>
                <Link to="/products" className="orders-empty-link">
                  Xem sản phẩm
                </Link>
              </div>
            )}

            {!loading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="orders-item">
                    <div className="orders-item-header">
                      <div className="orders-item-info">
                        <span className="orders-item-number">Mã đơn: {o.code}</span>
                        <span className={getStatusClass(o)}>{getFlowLabel(o)}</span>
                      </div>

                      <div className="orders-item-date">
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div className="orders-item-content">
                      <div className="orders-item-address">
                        <strong>Giao đến:</strong> {o.addressSnapshot?.fullName} - {o.addressSnapshot?.phone}
                        <br />
                        {o.addressSnapshot?.formattedAddress}

                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                          <div>
                            <b>Trạng thái đơn:</b> {labelOrderStatus(o.status)}
                          </div>
                          <div>
                            <b>Vận chuyển:</b> {labelShippingStatus(o.shippingStatus)}
                          </div>
                          <div>
                            <b>Thanh toán:</b> {o.paymentMethod} - {labelPaymentStatus(o.paymentStatus)}
                          </div>
                        </div>
                      </div>

                      <div className="orders-item-summary">
                        <div className="orders-item-total">Tổng: {formatMoney(o.total)}</div>
                      </div>
                    </div>

                    <div className="orders-item-actions">
                      <Link to={`/orders/${o.id}`} className="orders-action-button">
                        {o.status === 'COMPLETED' && o.shippingStatus === 'DELIVERED'
                          ? 'Xem & đánh giá'
                          : 'Xem chi tiết'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="orders-pagination">
                <button
                  type="button"
                  className="orders-pagination-button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  ← Trước
                </button>

                <div className="orders-pagination-info">
                  Trang {page}/{totalPages}
                </div>

                <button
                  type="button"
                  className="orders-pagination-button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}