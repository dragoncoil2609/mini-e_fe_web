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
  paymentStatus?: string;
  total?: number | string;
  createdAt?: string;
  created_at?: string;
};

type RangeKey = '7' | '30' | '90' | 'all';

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

function isRevenueOrder(order: OrderView) {
  return (
    order.status === 'COMPLETED' ||
    order.status === 'PAID' ||
    order.paymentStatus === 'PAID'
  );
}

function inRange(order: OrderView, range: RangeKey) {
  if (range === 'all') return true;

  const raw = orderDate(order);
  if (!raw) return false;

  const created = new Date(raw).getTime();
  const now = Date.now();
  const days = Number(range);

  return now - created <= days * 24 * 60 * 60 * 1000;
}

export default function ShopRevenuePage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [range, setRange] = useState<RangeKey>('7');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await getMyShop();
      setShop(unwrapApiData<ShopView>(shopResponse));

      const orderResponse = await getMyShopOrders({
        page: 1,
        limit: 100,
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
    void loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => inRange(order, range));
  }, [orders, range]);

  const paidOrders = useMemo(() => {
    return filteredOrders.filter(isRevenueOrder);
  }, [filteredOrders]);

  const revenue = useMemo(() => {
    return paidOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  }, [paidOrders]);

  const averageOrder = paidOrders.length ? revenue / paidOrders.length : 0;

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
                  Thống kê doanh thu tạm tính từ đơn hàng của shop. Muốn lọc
                  thật chuẩn theo database thì sau này nên thêm API doanh thu
                  riêng ở backend.
                </p>
              </div>

              <select
                className="mochi-select"
                value={range}
                onChange={(event) => setRange(event.target.value as RangeKey)}
              >
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="90">90 ngày</option>
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
                    <small>{paidOrders.length} đơn đã tính doanh thu</small>
                  </div>

                  <div className="shop-revenue-stat mochi-card">
                    <span>Tổng đơn trong kỳ</span>
                    <strong>{filteredOrders.length}</strong>
                    <small>Bao gồm mọi trạng thái</small>
                  </div>

                  <div className="shop-revenue-stat mochi-card">
                    <span>Giá trị TB/đơn</span>
                    <strong>{formatMoney(averageOrder)}</strong>
                    <small>Tính trên đơn có doanh thu</small>
                  </div>
                </div>

                <section className="shop-revenue-table mochi-card">
                  <div className="shop-revenue-table-head">
                    <h2>Đơn hàng gần đây</h2>
                    <button
                      type="button"
                      className="mochi-btn mochi-btn-outline mochi-btn-sm"
                      onClick={() => void loadData()}
                    >
                      Làm mới
                    </button>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="shop-revenue-empty">
                      Chưa có đơn hàng trong khoảng thời gian này.
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày</th>
                          <th>Trạng thái</th>
                          <th>Thanh toán</th>
                          <th>Tổng tiền</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td>{order.code || order.id}</td>
                            <td>{formatDate(orderDate(order))}</td>
                            <td>{order.status || 'PENDING'}</td>
                            <td>{order.paymentStatus || 'UNPAID'}</td>
                            <td>{formatMoney(order.total)}</td>
                          </tr>
                        ))}
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