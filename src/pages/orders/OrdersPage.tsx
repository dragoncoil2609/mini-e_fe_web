import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { Order, OrderStatus } from '../../api/types';
import './OrdersPage.css';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(Number(sp.get('page')) || 1);
  const [limit] = useState<number>(Number(sp.get('limit')) || 20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.getMyOrders({ page, limit });
      if (!res.success) {
        setError(res.message || 'Không tải được đơn hàng');
        return;
      }
      setOrders(res.data.items);
      setTotal(res.data.total);
      setSp({ page: String(page), limit: String(limit) });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const labelStatus = (s: OrderStatus) => {
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PAID: 'Đã thanh toán',
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã huỷ',
    };
    return map[s] || s;
  };

  const statusClass = (s: OrderStatus) => {
    const key = String(s || '').toLowerCase();
    // map lại vài trạng thái để match CSS (vd: SHIPPED -> shipping)
    const normalized: Record<string, string> = {
      shipped: 'shipping',
      completed: 'delivered',
      paid: 'confirmed',
    };
    return `orders-item-status orders-status-${normalized[key] || key}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="orders-container">
      <header className="orders-headerbar">
        <div className="orders-headerbar-content">
          <button className="orders-brand" onClick={() => navigate('/home')}>
            Mini-E
          </button>

          <div className="orders-headerbar-right">
            <Link className="orders-chip" to="/products">🛍️ Sản phẩm</Link>
            <Link className="orders-chip" to="/cart">🛒 Giỏ hàng</Link>
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
              <Link to="/products" className="orders-primary">
                Mua thêm
              </Link>
            </div>

        {loading && <div className="orders-loading">Đang tải...</div>}
        {error && <div className="orders-error">{error}</div>}

        {!loading && !error && orders.length === 0 && (
          <div className="orders-empty">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/products" className="orders-empty-link">Xem sản phẩm</Link>
          </div>
        )}

            {!loading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="orders-item">
                    <div className="orders-item-header">
                      <div className="orders-item-info">
                        <span className="orders-item-number">Mã đơn: {o.code}</span>
                        <span className={statusClass(o.status)}>{labelStatus(o.status)}</span>
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
                  </div>

                  <div className="orders-item-summary">
                    <div className="orders-item-total">
                      Tổng: {new Intl.NumberFormat('vi-VN').format(Number(o.total))} VND
                    </div>
                  </div>
                </div>

                    <div className="orders-item-actions">
                      <Link to={`/orders/${o.id}`} className="orders-action-button">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="orders-pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="orders-pagination-button"
                >
                  &lt; Trang trước
                </button>
                <span className="orders-pagination-info">
                  Trang {page}/{totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="orders-pagination-button"
                >
                  Trang sau &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
