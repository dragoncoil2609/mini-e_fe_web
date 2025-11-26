// src/pages/orders/OrdersPage.tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { Order, OrderStatus, PaginatedResult, ApiResponse } from '../../api/types';
import './OrdersPage.css';

const DEFAULT_LIMIT = 20;

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit] = useState<number>(Number(searchParams.get('limit')) || DEFAULT_LIMIT);
  const [status, setStatus] = useState<OrderStatus | ''>(
    (searchParams.get('status') as OrderStatus) || '',
  );
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [page, status]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (status) params.status = status;

      const res = await OrdersApi.getMyOrders(params);
      if (res.success) {
        const payload = (res as unknown as ApiResponse<PaginatedResult<Order>>).data;
        setOrders(payload.items);
        setTotal(payload.total);

        const urlParams: any = { page: String(page), limit: String(limit) };
        if (status) urlParams.status = status;
        setSearchParams(urlParams);
      } else {
        setError(res.message || 'Không tải được danh sách đơn hàng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Không tải được danh sách đơn hàng. Vui lòng đăng nhập.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: OrderStatus | '') => {
    setStatus(newStatus);
    setPage(1);
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
      PENDING: 'orders-status-pending',
      CONFIRMED: 'orders-status-confirmed',
      PROCESSING: 'orders-status-processing',
      SHIPPING: 'orders-status-shipping',
      DELIVERED: 'orders-status-delivered',
      CANCELLED: 'orders-status-cancelled',
      REFUNDED: 'orders-status-refunded',
    };
    return classes[status] || '';
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="orders-container">
      <div className="orders-card">
        <div className="orders-header">
          <div className="orders-icon">📦</div>
          <h1 className="orders-title">Đơn hàng của tôi</h1>
        </div>

        <div className="orders-filters">
          <button
            onClick={() => handleStatusChange('')}
            className={`orders-filter-button ${!status ? 'orders-filter-button-active' : ''}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => handleStatusChange('PENDING')}
            className={`orders-filter-button ${status === 'PENDING' ? 'orders-filter-button-active' : ''}`}
          >
            Chờ xử lý
          </button>
          <button
            onClick={() => handleStatusChange('CONFIRMED')}
            className={`orders-filter-button ${status === 'CONFIRMED' ? 'orders-filter-button-active' : ''}`}
          >
            Đã xác nhận
          </button>
          <button
            onClick={() => handleStatusChange('SHIPPING')}
            className={`orders-filter-button ${status === 'SHIPPING' ? 'orders-filter-button-active' : ''}`}
          >
            Đang giao hàng
          </button>
          <button
            onClick={() => handleStatusChange('DELIVERED')}
            className={`orders-filter-button ${status === 'DELIVERED' ? 'orders-filter-button-active' : ''}`}
          >
            Đã giao hàng
          </button>
          <button
            onClick={() => handleStatusChange('CANCELLED')}
            className={`orders-filter-button ${status === 'CANCELLED' ? 'orders-filter-button-active' : ''}`}
          >
            Đã hủy
          </button>
        </div>

        {loading && <div className="orders-loading">Đang tải...</div>}

        {error && <div className="orders-error">{error}</div>}

        {!loading && orders.length === 0 && (
          <div className="orders-empty">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/products" className="orders-empty-link">
              Xem sản phẩm
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="orders-item">
                <div className="orders-item-header">
                  <div className="orders-item-info">
                    <span className="orders-item-number">Mã đơn: {order.orderNumber}</span>
                    <span className={`orders-item-status ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="orders-item-date">
                    {new Date(order.createdAt || '').toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="orders-item-content">
                  <div className="orders-item-address">
                    <strong>Giao đến:</strong> {order.fullName} - {order.phone}
                    <br />
                    {order.formattedAddress}
                  </div>

                  <div className="orders-item-summary">
                    <div className="orders-item-products">
                      {order.itemsCount} sản phẩm ({order.itemsQuantity} món)
                    </div>
                    <div className="orders-item-total">
                      Tổng: {formatPrice(order.total)} {order.currency}
                    </div>
                  </div>
                </div>

                <div className="orders-item-actions">
                  <Link to={`/orders/${order.id}`} className="orders-action-button">
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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="orders-pagination-button"
            >
              &lt; Trang trước
            </button>
            <span className="orders-pagination-info">
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="orders-pagination-button"
            >
              Trang sau &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

