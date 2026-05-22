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

function nextShippingOptions(current?: string) {
  if (current === 'PENDING') return ['PICKED', 'CANCELED'];
  if (current === 'PICKED') return ['IN_TRANSIT', 'CANCELED'];
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
      setShop(unwrapApiData<ShopView>(shopResponse));

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
                              <strong>{order.code || order.id}</strong>
                            </td>

                            <td>{formatDate(orderDate(order))}</td>

                            <td>{order.items?.length ?? 0} sản phẩm</td>

                            <td>
                              <span className="shop-order-pill">
                                {order.paymentStatus || 'UNPAID'}
                              </span>
                            </td>

                            <td>
                              <span className="shop-order-pill shop-order-shipping">
                                {order.shippingStatus || 'PENDING'}
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
                                      {nextStatus}
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