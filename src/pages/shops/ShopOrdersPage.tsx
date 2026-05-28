import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  getMyShop,
  getMyShopOrders,
  updateMyShopOrderShippingStatus,
} from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import './style/ShopOrdersPage.css';

type ShopView = {
  id: number;
  name: string;
};

type OrderView = {
  id: string;
  code?: string;
  status?: string;
  shippingStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total?: number | string;
  createdAt?: string;
  created_at?: string;
  items?: any[];
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapPaginated<T>(response: any) {
  const data = response?.data?.data ?? response?.data ?? response;

  return {
    items: (data?.items ?? []) as T[],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? 1),
    limit: Number(data?.limit ?? 10),
  };
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải đơn hàng.'
  );
}

function formatMoney(value?: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function formatDate(value?: string) {
  if (!value) return 'Chưa có';

  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return value;
  }
}

function orderDate(order: OrderView) {
  return order.createdAt || order.created_at || '';
}

function getOrderStatusLabel(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'Chờ Xử Lý';
    case 'PAID':
      return 'Đã Thanh Toán';
    case 'PROCESSING':
      return 'Đang Xử Lý';
    case 'SHIPPED':
      return 'Đang Giao';
    case 'COMPLETED':
      return 'Hoàn Thành';
    case 'CANCELLED':
    case 'CANCELED':
      return 'Đã Hủy';
    default:
      return status || 'Chưa Xác Định';
  }
}

function getPaymentStatusLabel(status?: string) {
  switch (status) {
    case 'UNPAID':
      return 'Chưa Thanh Toán';
    case 'PAID':
      return 'Đã Thanh Toán';
    case 'REFUNDED':
      return 'Đã Hoàn Tiền';
    default:
      return status || 'Chưa Xác Định';
  }
}

function getPaymentMethodLabel(method?: string) {
  switch (method) {
    case 'COD':
      return 'COD';
    case 'VNPAY':
      return 'VNP';
    default:
      return method || 'N/A';
  }
}

function getPaymentText(order: OrderView) {
  return `${getPaymentMethodLabel(order.paymentMethod)}(${getPaymentStatusLabel(
    order.paymentStatus,
  )})`;
}

function getShippingStatusLabel(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'Chờ Lấy Hàng';
    case 'PICKED':
      return 'Đang Đóng Gói Hàng';
    case 'IN_TRANSIT':
      return 'Đang Vận Chuyển';
    case 'DELIVERED':
      return 'Đã Giao Hàng';
    case 'RETURNED':
      return 'Đã Hoàn Trả';
    case 'CANCELED':
    case 'CANCELLED':
      return 'Đã Hủy Giao';
    default:
      return status || 'Chưa Xác Định';
  }
}

function getShippingActionLabel(status: string) {
  switch (status) {
    case 'PICKED':
      return 'Nhận Đơn Hàng';
    case 'IN_TRANSIT':
      return 'Đã Chuyển Cho Đơn Vị Vận Chuyển';
    case 'CANCELED':
      return 'Hủy Giao Hàng';
    default:
      return status;
  }
}

function nextShippingOptions(current?: string) {
  if (current === 'PENDING') return ['PICKED', 'CANCELED'];

  if (current === 'PICKED') return ['IN_TRANSIT'];

  return [];
}

export default function ShopOrdersPage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  async function loadOrders(nextPage = page) {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await getMyShop();
      const shopData = unwrapApiData<ShopView>(shopResponse);
      setShop(shopData);

      const orderResponse = await getMyShopOrders({
        page: nextPage,
        limit,
      });

      const data = unwrapPaginated<OrderView>(orderResponse);

      setOrders(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      setOrders([]);
      setTotal(0);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateShipping = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);

    try {
      await updateMyShopOrderShippingStatus(orderId, nextStatus);
      await loadOrders(page);
    } catch (err: any) {
      alert(getApiMessage(err));
    } finally {
      setUpdatingId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mochi-page shop-orders-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Đơn hàng</b>
        </div>

        <div className="shop-orders-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-orders-main">
            <section className="shop-orders-head mochi-card">
              <div>
                <h1>Đơn hàng của shop</h1>
                <p>Theo dõi và cập nhật trạng thái giao hàng.</p>
              </div>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                onClick={() => void loadOrders(page)}
                disabled={loading}
              >
                Làm mới
              </button>
            </section>

            {loading ? (
              <div className="mochi-card mochi-card-padding shop-orders-state">
                Đang tải đơn hàng...
              </div>
            ) : error ? (
              <div className="mochi-card mochi-card-padding shop-orders-error">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="mochi-card mochi-empty">
                <h3 className="mochi-empty-title">Chưa có đơn hàng</h3>
                <p className="mochi-empty-desc">
                  Khi khách mua sản phẩm, đơn hàng sẽ hiển thị ở đây.
                </p>
              </div>
            ) : (
              <>
                <div className="shop-orders-table mochi-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày tạo</th>
                        <th>Sản phẩm</th>
                        <th>Trạng thái đơn</th>
                        <th>Thanh toán</th>
                        <th>Giao hàng</th>
                        <th>Tổng tiền</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => {
                        const shippingOptions = nextShippingOptions(
                          order.shippingStatus,
                        );

                        return (
                          <tr key={order.id}>
                            <td>
                              <strong className="shop-order-code">
                                {order.code || order.id}
                              </strong>
                            </td>

                            <td>{formatDate(orderDate(order))}</td>

                            <td>{order.items?.length ?? 0} sản phẩm</td>

                            <td>
                              <span className="shop-order-pill">
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </td>

                            <td>
                              <span className="shop-order-payment-inline">
                                {getPaymentText(order)}
                              </span>
                            </td>

                            <td>
                              <span className="shop-order-pill shop-order-shipping">
                                {getShippingStatusLabel(order.shippingStatus)}
                              </span>
                            </td>

                            <td>{formatMoney(order.total)}</td>

                            <td>
                              <div className="shop-order-actions">
                                {shippingOptions.length > 0 ? (
                                  shippingOptions.map((nextStatus) => (
                                    <button
                                      key={nextStatus}
                                      type="button"
                                      disabled={updatingId === order.id}
                                      onClick={() =>
                                        void handleUpdateShipping(
                                          order.id,
                                          nextStatus,
                                        )
                                      }
                                    >
                                      {updatingId === order.id
                                        ? 'Đang lưu...'
                                        : getShippingActionLabel(nextStatus)}
                                    </button>
                                  ))
                                ) : (
                                  <span>Không có thao tác</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="shop-orders-pagination">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page <= 1}
                    onClick={() => void loadOrders(page - 1)}
                  >
                    Trước
                  </button>

                  <span>
                    Trang {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => void loadOrders(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}