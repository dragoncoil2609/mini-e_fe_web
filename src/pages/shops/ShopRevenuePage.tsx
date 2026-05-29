import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyShop, getMyShopOrders } from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import './style/ShopRevenuePage.css';

type ShopView = {
  id: number;
  name: string;
  totalRevenue?: number | string;
  totalOrders?: number;
  stats?: {
    totalRevenue?: number | string;
    totalOrders?: number;
    totalSold?: number;
  } | null;
};

type OrderView = {
  id: string;
  code?: string;

  status?: string;

  shippingStatus?: string;
  shipping_status?: string;

  paymentStatus?: string;
  payment_status?: string;

  paymentMethod?: string;
  payment_method?: string;

  total?: number | string;

  createdAt?: string;
  created_at?: string;
};

type RangeKey = '1' | '7' | '30' | 'all';

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapPaginated<T>(response: any) {
  const data = response?.data?.data ?? response?.data ?? response;
  return (data?.items ?? []) as T[];
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải doanh thu.'
  );
}

function normalizeEnum(value?: string) {
  return String(value || '')
    .trim()
    .toUpperCase();
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

function orderShippingStatus(order: OrderView) {
  return order.shippingStatus || order.shipping_status;
}

function orderPaymentStatus(order: OrderView) {
  return order.paymentStatus || order.payment_status;
}

function orderPaymentMethod(order: OrderView) {
  return order.paymentMethod || order.payment_method;
}

function getOrderStatusLabel(status?: string) {
  switch (normalizeEnum(status)) {
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
  switch (normalizeEnum(status)) {
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
  switch (normalizeEnum(method)) {
    case 'COD':
      return 'COD';
    case 'VNPAY':
      return 'VNP';
    default:
      return method || 'N/A';
  }
}

function getPaymentText(order: OrderView) {
  return `${getPaymentMethodLabel(orderPaymentMethod(order))}(${getPaymentStatusLabel(
    orderPaymentStatus(order),
  )})`;
}

function getShippingStatusLabel(status?: string) {
  switch (normalizeEnum(status)) {
    case 'PENDING':
      return 'Chờ Lấy Hàng';
    case 'PICKED':
      return 'Đã Lấy Hàng';
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

function getStatusClass(status?: string) {
  const value = normalizeEnum(status);

  if (value === 'COMPLETED' || value === 'PAID') {
    return 'shop-revenue-pill-success';
  }

  if (value === 'CANCELLED' || value === 'CANCELED') {
    return 'shop-revenue-pill-danger';
  }

  if (value === 'PROCESSING' || value === 'SHIPPED') {
    return 'shop-revenue-pill-warning';
  }

  return 'shop-revenue-pill-primary';
}

function getShippingClass(status?: string) {
  const value = normalizeEnum(status);

  if (value === 'DELIVERED') {
    return 'shop-revenue-pill-success';
  }

  if (value === 'RETURNED' || value === 'CANCELED' || value === 'CANCELLED') {
    return 'shop-revenue-pill-danger';
  }

  if (value === 'PICKED' || value === 'IN_TRANSIT') {
    return 'shop-revenue-pill-warning';
  }

  return 'shop-revenue-pill-primary';
}

function getPaymentClass(status?: string) {
  const value = normalizeEnum(status);

  if (value === 'PAID') {
    return 'shop-revenue-pill-success';
  }

  if (value === 'REFUNDED') {
    return 'shop-revenue-pill-danger';
  }

  return 'shop-revenue-pill-primary';
}

function isReturnedOrCanceled(order: OrderView) {
  const orderStatus = normalizeEnum(order.status);
  const shippingStatus = normalizeEnum(orderShippingStatus(order));

  return (
    orderStatus === 'CANCELED' ||
    orderStatus === 'CANCELLED' ||
    shippingStatus === 'CANCELED' ||
    shippingStatus === 'CANCELLED' ||
    shippingStatus === 'RETURNED'
  );
}

function isRevenueOrder(order: OrderView) {
  if (isReturnedOrCanceled(order)) return false;

  const orderStatus = normalizeEnum(order.status);
  const paymentStatus = normalizeEnum(orderPaymentStatus(order));

  return (
    orderStatus === 'COMPLETED' ||
    orderStatus === 'PAID' ||
    paymentStatus === 'PAID'
  );
}

export default function ShopRevenuePage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [range, setRange] = useState<RangeKey>('7');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData(nextRange: RangeKey = range) {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await getMyShop();
      setShop(unwrapApiData<ShopView>(shopResponse));

      const orderResponse = await getMyShopOrders({
        page: 1,
        limit: 1000,
        range: nextRange,
      });

      setOrders(unwrapPaginated<OrderView>(orderResponse));
    } catch (err: any) {
      setError(getApiMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData('7');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueOrders = useMemo(() => {
    return orders.filter(isRevenueOrder);
  }, [orders]);

  const returnedOrCanceledOrders = useMemo(() => {
    return orders.filter(isReturnedOrCanceled);
  }, [orders]);

  const revenue = useMemo(() => {
    return revenueOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  }, [revenueOrders]);

  const averageOrder = revenueOrders.length ? revenue / revenueOrders.length : 0;

  const handleChangeRange = (value: RangeKey) => {
    setRange(value);
    void loadData(value);
  };

  return (
    <div className="mochi-page shop-revenue-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Doanh thu</b>
        </div>

        <div className="shop-revenue-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-revenue-main">
            <section className="shop-revenue-head mochi-card">
              <div>
                <h1>Doanh thu</h1>
                <p>
                  Doanh thu được lấy theo query từ backend. Đơn hoàn trả, hủy
                  giao hoặc đã hủy sẽ không được tính vào doanh thu.
                </p>
              </div>

              <select
                className="mochi-select"
                value={range}
                onChange={(event) => handleChangeRange(event.target.value as RangeKey)}
              >
                <option value="1">1 ngày</option>
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="all">Tất cả</option>
              </select>
            </section>

            {loading ? (
              <div className="mochi-card mochi-card-padding shop-revenue-state">
                Đang tải doanh thu...
              </div>
            ) : error ? (
              <div className="mochi-card mochi-card-padding shop-revenue-error">
                {error}
              </div>
            ) : (
              <>
                <div className="shop-revenue-stats">
                  <div className="shop-revenue-stat mochi-card">
                    <span>Doanh thu trong kỳ</span>
                    <strong>{formatMoney(revenue)}</strong>
                    <small>{revenueOrders.length} đơn được tính doanh thu</small>
                  </div>

                  <div className="shop-revenue-stat mochi-card">
                    <span>Tổng đơn trong kỳ</span>
                    <strong>{orders.length}</strong>
                    <small>Bao gồm mọi trạng thái</small>
                  </div>

                  <div className="shop-revenue-stat mochi-card">
                    <span>Giá trị TB/đơn</span>
                    <strong>{formatMoney(averageOrder)}</strong>
                    <small>Tính trên đơn có doanh thu</small>
                  </div>

                  <div className="shop-revenue-stat mochi-card shop-revenue-stat-danger">
                    <span>Hoàn trả / hủy</span>
                    <strong>{returnedOrCanceledOrders.length}</strong>
                    <small>Không tính vào doanh thu</small>
                  </div>
                </div>

                <section className="shop-revenue-table mochi-card">
                  <div className="shop-revenue-table-head">
                    <div>
                      <h2>Tất cả đơn hàng trong kỳ</h2>
                      <p>
                        Xem trạng thái đơn, thanh toán và giao hàng để biết đơn có
                        bị hoàn trả hay không.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mochi-btn mochi-btn-outline mochi-btn-sm"
                      onClick={() => void loadData(range)}
                    >
                      Làm mới
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="shop-revenue-empty">
                      Chưa có đơn hàng trong khoảng thời gian này.
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày</th>
                          <th>Trạng thái đơn</th>
                          <th>Thanh toán</th>
                          <th>Giao hàng</th>
                          <th>Tính doanh thu</th>
                          <th>Tổng tiền</th>
                        </tr>
                      </thead>

                      <tbody>
                        {orders.map((order) => {
                          const canCountRevenue = isRevenueOrder(order);
                          const shippingStatus = orderShippingStatus(order);
                          const paymentStatus = orderPaymentStatus(order);

                          return (
                            <tr key={order.id}>
                              <td>
                                <strong className="shop-revenue-order-code">
                                  {order.code || order.id}
                                </strong>
                              </td>

                              <td>{formatDate(orderDate(order))}</td>

                              <td>
                                <span
                                  className={`shop-revenue-pill ${getStatusClass(
                                    order.status,
                                  )}`}
                                >
                                  {getOrderStatusLabel(order.status)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`shop-revenue-pill ${getPaymentClass(
                                    paymentStatus,
                                  )}`}
                                >
                                  {getPaymentText(order)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`shop-revenue-pill ${getShippingClass(
                                    shippingStatus,
                                  )}`}
                                >
                                  {getShippingStatusLabel(shippingStatus)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    canCountRevenue
                                      ? 'shop-revenue-counted'
                                      : 'shop-revenue-not-counted'
                                  }
                                >
                                  {canCountRevenue ? 'Có' : 'Không'}
                                </span>
                              </td>

                              <td>{formatMoney(order.total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}