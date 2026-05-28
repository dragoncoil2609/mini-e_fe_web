import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  getMyShop,
  getMyShopOrderDetail,
  getMyShopOrders,
  updateMyShopOrderShippingStatus,
} from '../../api/shop.api';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import './style/ShopOrdersPage.css';

type ShopView = {
  id: number;
  name: string;
};

type OrderItemView = {
  id?: string;
  productId?: number;
  product_id?: number;
  productVariantId?: number | null;
  product_variant_id?: number | null;

  nameSnapshot?: string;
  name_snapshot?: string;

  imageSnapshot?: string | null;
  image_snapshot?: string | null;

  price?: number | string;
  quantity?: number | string;

  totalLine?: number | string;
  total_line?: number | string;

  value1?: string | null;
  value2?: string | null;
  value3?: string | null;
  value4?: string | null;
  value5?: string | null;
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

  subtotal?: number | string;
  discount?: number | string;

  shippingFee?: number | string;
  shipping_fee?: number | string;

  total?: number | string;
  note?: string | null;

  addressSnapshot?: any;
  address_snapshot?: any;

  createdAt?: string;
  created_at?: string;

  items?: OrderItemView[];
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

function orderShippingFee(order: OrderView) {
  return order.shippingFee ?? order.shipping_fee ?? 0;
}

function orderAddress(order: OrderView) {
  return order.addressSnapshot ?? order.address_snapshot ?? null;
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

function getShippingActionLabel(status: string) {
  switch (normalizeEnum(status)) {
    case 'PICKED':
      return 'Nhận Đơn Hàng';
    case 'IN_TRANSIT':
      return 'Đã Chuyển Cho Đơn Vị Vận Chuyển';
    case 'CANCELED':
    case 'CANCELLED':
      return 'Hủy Giao Hàng';
    default:
      return status;
  }
}

function nextShippingOptions(current?: string) {
  const value = normalizeEnum(current);

  if (value === 'PENDING') return ['PICKED', 'CANCELED'];

  if (value === 'PICKED') return ['IN_TRANSIT'];

  return [];
}

function itemName(item: OrderItemView) {
  return item.nameSnapshot || item.name_snapshot || 'Sản phẩm';
}

function itemImage(item: OrderItemView) {
  return item.imageSnapshot || item.image_snapshot || '';
}

function itemQuantity(item: OrderItemView) {
  return Number(item.quantity ?? 0);
}

function itemPrice(item: OrderItemView) {
  return item.price ?? 0;
}

function itemTotalLine(item: OrderItemView) {
  return item.totalLine ?? item.total_line ?? 0;
}

function itemVariantText(item: OrderItemView) {
  return [item.value1, item.value2, item.value3, item.value4, item.value5]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' / ');
}

function totalQuantity(items?: OrderItemView[]) {
  return (items ?? []).reduce((sum, item) => sum + itemQuantity(item), 0);
}

function totalProductLines(items?: OrderItemView[]) {
  return items?.length ?? 0;
}

function addressText(address: any) {
  if (!address) return 'Chưa có địa chỉ';

  if (typeof address === 'string') return address;

  return (
    address.fullAddress ||
    address.address ||
    address.detail ||
    address.street ||
    [
      address.receiverName || address.name,
      address.phone,
      address.wardName || address.ward,
      address.districtName || address.district,
      address.provinceName || address.province,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Chưa có địa chỉ'
  );
}

function receiverText(address: any) {
  if (!address || typeof address === 'string') return 'Chưa có';

  return (
    address.receiverName ||
    address.fullName ||
    address.name ||
    address.phone ||
    'Chưa có'
  );
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

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);

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

  const handleOpenDetail = async (order: OrderView) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setSelectedOrder(order);

    try {
      const response = await getMyShopOrderDetail(order.id);
      const detail = unwrapApiData<OrderView>(response);
      setSelectedOrder(detail);
    } catch (err: any) {
      setDetailError(getApiMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError('');
    setSelectedOrder(null);
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
                <p>
                  Theo dõi đơn hàng, xem chi tiết sản phẩm và cập nhật giao hàng.
                </p>
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
                        <th>Chi tiết</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => {
                        const shippingOptions = nextShippingOptions(
                          orderShippingStatus(order),
                        );

                        return (
                          <tr key={order.id}>
                            <td>
                              <strong className="shop-order-code">
                                {order.code || order.id}
                              </strong>
                            </td>

                            <td>{formatDate(orderDate(order))}</td>

                            <td>
                              <div className="shop-order-product-count">
                                <strong>
                                  {totalQuantity(order.items)} sản phẩm
                                </strong>
                                <small>
                                  {totalProductLines(order.items)} dòng sản phẩm
                                </small>
                              </div>
                            </td>

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
                                {getShippingStatusLabel(
                                  orderShippingStatus(order),
                                )}
                              </span>
                            </td>

                            <td>{formatMoney(order.total)}</td>

                            <td>
                              <button
                                type="button"
                                className="shop-order-detail-btn"
                                onClick={() => void handleOpenDetail(order)}
                              >
                                Chi tiết
                              </button>
                            </td>

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

      {detailOpen ? (
        <div className="shop-order-detail-overlay" onClick={handleCloseDetail}>
          <section
            className="shop-order-detail-modal mochi-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shop-order-detail-head">
              <div>
                <p>Chi tiết đơn hàng</p>
                <h2>{selectedOrder?.code || selectedOrder?.id || 'Đơn hàng'}</h2>
              </div>

              <button type="button" onClick={handleCloseDetail}>
                ×
              </button>
            </div>

            {detailLoading ? (
              <div className="shop-order-detail-state">
                Đang tải chi tiết đơn...
              </div>
            ) : detailError ? (
              <div className="shop-order-detail-error">{detailError}</div>
            ) : selectedOrder ? (
              <>
                <div className="shop-order-detail-info-grid">
                  <div>
                    <span>Trạng thái đơn</span>
                    <strong>{getOrderStatusLabel(selectedOrder.status)}</strong>
                  </div>

                  <div>
                    <span>Thanh toán</span>
                    <strong>{getPaymentText(selectedOrder)}</strong>
                  </div>

                  <div>
                    <span>Giao hàng</span>
                    <strong>
                      {getShippingStatusLabel(
                        orderShippingStatus(selectedOrder),
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Ngày tạo</span>
                    <strong>{formatDate(orderDate(selectedOrder))}</strong>
                  </div>
                </div>

                <div className="shop-order-detail-address">
                  <h3>Thông tin nhận hàng</h3>

                  <p>
                    <b>Người nhận:</b> {receiverText(orderAddress(selectedOrder))}
                  </p>

                  <p>
                    <b>Địa chỉ:</b> {addressText(orderAddress(selectedOrder))}
                  </p>

                  {selectedOrder.note ? (
                    <p>
                      <b>Ghi chú:</b> {selectedOrder.note}
                    </p>
                  ) : null}
                </div>

                <div className="shop-order-detail-products">
                  <div className="shop-order-detail-section-title">
                    <h3>Sản phẩm trong đơn</h3>

                    <span>
                      Tổng {totalQuantity(selectedOrder.items)} sản phẩm /{' '}
                      {totalProductLines(selectedOrder.items)} dòng
                    </span>
                  </div>

                  {(selectedOrder.items ?? []).length === 0 ? (
                    <div className="shop-order-detail-empty">
                      Đơn hàng chưa có sản phẩm.
                    </div>
                  ) : (
                    <div className="shop-order-detail-items">
                      {(selectedOrder.items ?? []).map((item, index) => {
                        const variantText = itemVariantText(item);

                        return (
                          <div
                            className="shop-order-detail-item"
                            key={item.id || index}
                          >
                            <div className="shop-order-detail-product">
                              <div className="shop-order-detail-product-image">
                                {itemImage(item) ? (
                                  <img src={itemImage(item)} alt={itemName(item)} />
                                ) : (
                                  <span>Ảnh</span>
                                )}
                              </div>

                              <div>
                                <strong>{itemName(item)}</strong>

                                {variantText ? <small>{variantText}</small> : null}

                                <p>
                                  Mã SP:{' '}
                                  {item.productId ?? item.product_id ?? 'Không có'}
                                </p>
                              </div>
                            </div>

                            <div className="shop-order-detail-item-meta">
                              <span>Đơn giá</span>
                              <strong>{formatMoney(itemPrice(item))}</strong>
                            </div>

                            <div className="shop-order-detail-item-meta">
                              <span>Số lượng</span>
                              <strong>x{itemQuantity(item)}</strong>
                            </div>

                            <div className="shop-order-detail-item-meta">
                              <span>Thành tiền</span>
                              <strong>{formatMoney(itemTotalLine(item))}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="shop-order-detail-total">
                  <div>
                    <span>Tạm tính</span>
                    <strong>{formatMoney(selectedOrder.subtotal)}</strong>
                  </div>

                  <div>
                    <span>Phí vận chuyển</span>
                    <strong>{formatMoney(orderShippingFee(selectedOrder))}</strong>
                  </div>

                  <div>
                    <span>Giảm giá</span>
                    <strong>-{formatMoney(selectedOrder.discount)}</strong>
                  </div>

                  <div className="shop-order-detail-total-final">
                    <span>Tổng tiền</span>
                    <strong>{formatMoney(selectedOrder.total)}</strong>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}