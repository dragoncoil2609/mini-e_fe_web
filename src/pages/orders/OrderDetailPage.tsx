import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import { ReviewsApi } from '../../api/reviews.api';
import type { Order, PaymentStatus, ProductReview, ShippingStatus } from '../../api/types';
import './OrderDetailPage.css';

function formatMoney(value: string | number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`;
}

function labelPaymentStatus(status: PaymentStatus) {
  const map: Record<string, string> = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    REFUNDED: 'Đã hoàn tiền',
  };
  return map[String(status)] || String(status);
}

function labelShippingStatus(status: ShippingStatus) {
  const map: Record<string, string> = {
    PENDING: 'Chờ lấy hàng',
    PICKED: 'Đã lấy hàng',
    IN_TRANSIT: 'Đang giao',
    DELIVERED: 'Đã giao',
    RETURNED: 'Hoàn hàng',
    CANCELED: 'Đã huỷ',
  };
  return map[String(status)] || String(status);
}

function labelOrderStatus(status: Order['status']) {
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

function getFlowLabel(order: Order) {
  if (order.shippingStatus === 'RETURNED') return 'Hoàn hàng';
  if (order.status === 'CANCELLED' || order.shippingStatus === 'CANCELED') return 'Đã huỷ';
  if (order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED') return 'Đã nhận hàng';
  if (order.shippingStatus === 'DELIVERED') return 'Đã giao';
  if (order.shippingStatus === 'IN_TRANSIT') return 'Đang giao';
  if (order.shippingStatus === 'PICKED') return 'Đã lấy hàng';
  if (order.status === 'PROCESSING') return 'Đang xử lý';
  if (order.paymentStatus === 'PAID' && order.status === 'PENDING') return 'Đã thanh toán';
  return 'Chờ xử lý';
}

function getStatusClass(order: Order) {
  if (order.status === 'CANCELLED' || order.shippingStatus === 'CANCELED') {
    return 'order-detail-status order-detail-status-cancelled';
  }
  if (order.shippingStatus === 'RETURNED' || order.paymentStatus === 'REFUNDED') {
    return 'order-detail-status order-detail-status-cancelled';
  }
  if (order.status === 'COMPLETED' || order.shippingStatus === 'DELIVERED') {
    return 'order-detail-status order-detail-status-completed';
  }
  if (order.status === 'SHIPPED' || order.shippingStatus === 'IN_TRANSIT') {
    return 'order-detail-status order-detail-status-shipping';
  }
  if (order.status === 'PROCESSING' || order.shippingStatus === 'PICKED') {
    return 'order-detail-status order-detail-status-processing';
  }
  if (order.paymentStatus === 'PAID') {
    return 'order-detail-status order-detail-status-paid';
  }
  return 'order-detail-status order-detail-status-pending';
}

function Stars({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(s)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 20,
            opacity: disabled ? 0.7 : 1,
            padding: 0,
          }}
          aria-label={`rate-${s}`}
        >
          {s <= value ? '⭐' : '☆'}
        </button>
      ))}
      <span style={{ fontSize: 13, opacity: 0.75, marginLeft: 6 }}>{value}/5</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewLoading, setReviewLoading] = useState(false);
  const [review, setReview] = useState<ProductReview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.getOrderDetail(id);
      if (!res.success) {
        setError(res.message || 'Không tải được chi tiết đơn hàng');
        return;
      }
      setOrder(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const loadReview = async (orderId: string) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await ReviewsApi.getMyReviewByOrder(orderId);
      if (res.success) {
        setReview(res.data || null);
      } else {
        setReview(null);
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setReview(null);
      } else {
        setReviewError(e?.response?.data?.message || 'Không tải được review');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!order) return;

    const canReviewNow = order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED';
    if (canReviewNow) {
      void loadReview(order.id);
    } else {
      setReview(null);
      setReviewError(null);
    }
  }, [order]);

  const submitReview = async () => {
    if (!order) return;
    if (!(order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED')) return;

    if (!rating || rating < 1 || rating > 5) {
      alert('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ReviewsApi.createProductReview({
        orderId: order.id,
        rating,
        comment: content?.trim() ? content.trim() : undefined,
      });

      if (!res.success) {
        alert(res.message || 'Tạo đánh giá thất bại');
        return;
      }

      setReview(res.data);
      setContent('');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Tạo đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const body = () => {
    if (!id) return <div className="order-detail-state">Thiếu ID đơn hàng.</div>;
    if (loading) return <div className="order-detail-state">Đang tải...</div>;
    if (error) return <div className="order-detail-state">{error}</div>;
    if (!order) return null;

    const canReview = order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED';
    const canConfirmReceived =
      order.shippingStatus === 'DELIVERED' && order.status !== 'COMPLETED';
    const canRequestReturn =
      order.status !== 'CANCELLED' &&
      order.shippingStatus !== 'RETURNED' &&
      (order.shippingStatus === 'DELIVERED' || order.status === 'COMPLETED');

    return (
      <>
        <div className="order-detail-title-row">
          <div>
            <h1 className="order-detail-title">Chi tiết đơn hàng</h1>
            <p className="order-detail-subtitle">
              Mã đơn <b>{order.code}</b> • {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="order-detail-title-actions">
            <button onClick={() => navigate('/orders')} className="order-detail-back-button">
              ← Quay lại
            </button>
          </div>
        </div>

        <div className="order-detail-section">
          <div className="order-detail-info-row">
            <span className="order-detail-label">Mã đơn:</span>
            <span className="order-detail-value">{order.code}</span>
          </div>

          <div className="order-detail-info-row">
            <span className="order-detail-label">Luồng hiện tại:</span>
            <span className={getStatusClass(order)}>{getFlowLabel(order)}</span>
          </div>

          <div className="order-detail-info-row">
            <span className="order-detail-label">Trạng thái đơn:</span>
            <span className="order-detail-value">{labelOrderStatus(order.status)}</span>
          </div>

          <div className="order-detail-info-row">
            <span className="order-detail-label">Giao hàng:</span>
            <span className="order-detail-value">{labelShippingStatus(order.shippingStatus)}</span>
          </div>

          <div className="order-detail-info-row">
            <span className="order-detail-label">Thanh toán:</span>
            <span className="order-detail-value">
              {order.paymentMethod} - {labelPaymentStatus(order.paymentStatus)}
            </span>
          </div>

          {order.paymentRef && (
            <div className="order-detail-info-row">
              <span className="order-detail-label">Mã giao dịch:</span>
              <span className="order-detail-value">{order.paymentRef}</span>
            </div>
          )}

          <div className="order-detail-info-row">
            <span className="order-detail-label">Ngày đặt:</span>
            <span className="order-detail-value">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Theo dõi đơn hàng</h2>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void load()}
              className="order-detail-back-button"
              style={{ background: '#fff', color: '#111827', border: '1px solid #e5e7eb' }}
            >
              🔄 Cập nhật trạng thái
            </button>

            {canConfirmReceived && (
              <button
                type="button"
                onClick={async () => {
                  if (!id) return;
                  if (!window.confirm('Xác nhận bạn đã nhận hàng?')) return;

                  try {
                    const res = await OrdersApi.confirmReceived(id);
                    if (!res.success) {
                      alert(res.message || 'Xác nhận thất bại');
                      return;
                    }
                    await load();
                    alert('Đã xác nhận nhận hàng.');
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Xác nhận thất bại');
                  }
                }}
                className="order-detail-back-button"
                style={{ background: '#111827', color: '#fff', border: '1px solid #111827' }}
              >
                ✅ Xác nhận đã nhận hàng
              </button>
            )}

            {canRequestReturn && (
              <button
                type="button"
                onClick={async () => {
                  if (!id) return;
                  if (!window.confirm('Bạn muốn yêu cầu hoàn hàng cho đơn này?')) return;

                  try {
                    const res = await OrdersApi.requestReturn(id);
                    if (!res.success) {
                      alert(res.message || 'Hoàn hàng thất bại');
                      return;
                    }
                    await load();
                    alert('Đã cập nhật trạng thái hoàn hàng.');
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Hoàn hàng thất bại');
                  }
                }}
                className="order-detail-back-button"
                style={{ background: '#fff', color: '#b42318', border: '1px solid #fca5a5' }}
              >
                ↩️ Hoàn hàng
              </button>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
            Luồng: Chờ xử lý → Đang xử lý / Đang giao → Đã giao → Bạn xác nhận đã nhận hàng hoặc yêu cầu hoàn hàng.
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Thông tin giao hàng</h2>
          <div className="order-detail-address">
            <div className="order-detail-address-name">{order.addressSnapshot?.fullName}</div>
            <div className="order-detail-address-phone">{order.addressSnapshot?.phone}</div>
            <div className="order-detail-address-text">{order.addressSnapshot?.formattedAddress}</div>
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Sản phẩm</h2>
          <div className="order-detail-items">
            {(order.items || []).map((it) => (
              <div key={it.id} className="order-detail-item">
                <div className="order-detail-item-image">
                  {it.imageSnapshot ? (
                    <img src={it.imageSnapshot} alt={it.nameSnapshot} />
                  ) : (
                    <div className="order-detail-item-image-placeholder">📦</div>
                  )}
                </div>

                <div className="order-detail-item-info">
                  <Link to={`/products/${it.productId}`} className="order-detail-item-title">
                    {it.nameSnapshot}
                  </Link>
                  <div className="order-detail-item-price">
                    {formatMoney(it.price)} × {it.quantity}
                  </div>
                </div>

                <div className="order-detail-item-total">{formatMoney(it.totalLine)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Đánh giá sản phẩm</h2>

          {!canReview && (
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              Bạn chỉ có thể đánh giá sau khi <b>xác nhận đã nhận hàng</b>.
            </div>
          )}

          {canReview && (
            <>
              {reviewLoading && <div style={{ padding: '8px 0' }}>Đang tải review...</div>}
              {reviewError && <div style={{ padding: '8px 0', color: '#b42318' }}>{reviewError}</div>}

              {!reviewLoading && !review && (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Số sao</div>
                    <Stars value={rating} onChange={setRating} disabled={submitting} />
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Nhận xét</div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      placeholder="Viết cảm nhận của bạn về sản phẩm..."
                      disabled={submitting}
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        padding: 12,
                        border: '1px solid rgba(0,0,0,0.12)',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={submitting}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        background: '#111827',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </div>
                </div>
              )}

              {!reviewLoading && review && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Stars value={review.rating} disabled />
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      {new Date(review.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                    {review.comment || <span style={{ opacity: 0.7 }}>(Không có nhận xét)</span>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {order.note && (
          <div className="order-detail-section">
            <h2 className="order-detail-section-title">Ghi chú</h2>
            <div className="order-detail-notes">{order.note}</div>
          </div>
        )}

        <div className="order-detail-section">
          <h2 className="order-detail-section-title">Tổng thanh toán</h2>
          <div className="order-detail-summary">
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Tạm tính:</span>
              <span className="order-detail-summary-value">{formatMoney(order.subtotal)}</span>
            </div>

            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Phí ship:</span>
              <span className="order-detail-summary-value">{formatMoney(order.shippingFee)}</span>
            </div>

            {!!Number(order.discount || 0) && (
              <div className="order-detail-summary-row">
                <span className="order-detail-summary-label">Giảm giá:</span>
                <span className="order-detail-summary-value">- {formatMoney(order.discount)}</span>
              </div>
            )}

            <div className="order-detail-summary-total">
              <span className="order-detail-summary-total-label">Tổng cộng:</span>
              <span className="order-detail-summary-total-value">{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="order-detail-container">
      <header className="order-detail-headerbar">
        <div className="order-detail-headerbar-content">
          <button className="order-detail-brand" onClick={() => navigate('/home')}>
            Mini-E
          </button>

          <div className="order-detail-headerbar-right">
            <Link className="order-detail-chip" to="/products">
              🛍️ Sản phẩm
            </Link>
            <Link className="order-detail-chip" to="/cart">
              🛒 Giỏ hàng
            </Link>
            <Link className="order-detail-chip" to="/orders">
              📦 Đơn hàng
            </Link>
          </div>
        </div>
      </header>

      <main className="order-detail-main">
        <div className="order-detail-content">
          <div className="order-detail-card">{body()}</div>
        </div>
      </main>
    </div>
  );
}