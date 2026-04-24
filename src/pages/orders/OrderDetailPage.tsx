import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import { ReviewsApi } from '../../api/reviews.api';
import type { Order, ProductReview } from '../../api/types';
import './OrderDetailPage.css';

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

function labelFlow(o: Order) {
  if (o.status === 'CANCELLED' || o.shippingStatus === 'CANCELED') return 'Đã huỷ';
  if (o.shippingStatus === 'RETURNED') return 'Hoàn hàng';
  if (o.status === 'COMPLETED' && o.shippingStatus === 'DELIVERED') return 'Đã nhận hàng';

  const map: Record<string, string> = {
    PENDING: 'Chờ shop xác nhận',
    PICKED: 'Shop đã nhận đơn',
    IN_TRANSIT: 'Đang giao',
    DELIVERED: 'Đã nhận hàng',
  };

  return map[String(o.shippingStatus)] || String(o.shippingStatus);
}

function statusClass(order: Order) {
  if (order.status === 'CANCELLED' || order.shippingStatus === 'CANCELED') {
    return 'order-detail-status order-detail-status-cancelled';
  }
  if (order.shippingStatus === 'RETURNED') {
    return 'order-detail-status order-detail-status-cancelled';
  }
  if (order.status === 'COMPLETED') {
    return 'order-detail-status order-detail-status-completed';
  }
  if (order.shippingStatus === 'IN_TRANSIT') {
    return 'order-detail-status order-detail-status-shipping';
  }
  if (order.shippingStatus === 'PICKED') {
    return 'order-detail-status order-detail-status-processing';
  }
  return 'order-detail-status order-detail-status-pending';
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
      const status = e?.response?.status;
      if (status === 404) {
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
  }, [id]);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED') {
      void loadReview(order.id);
    } else {
      setReview(null);
      setReviewError(null);
    }
  }, [order?.id, order?.shippingStatus, order?.status]);

  const submitReview = async () => {
    if (!order) return;
    if (!(order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED')) return;

    if (!rating || rating < 1 || rating > 5) {
      alert('Vui lòng chọn số sao (1-5)');
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
        alert(res.message || 'Tạo review thất bại');
        return;
      }
      setReview(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Tạo review thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const body = () => {
    if (!id) return <div className="order-detail-state">Thiếu ID đơn hàng.</div>;
    if (loading) return <div className="order-detail-state">Đang tải...</div>;
    if (error) return <div className="order-detail-state">{error}</div>;
    if (!order) return null;

    const canCancelOrder =
      order.shippingStatus === 'PENDING' &&
      order.status !== 'CANCELLED' &&
      order.status !== 'COMPLETED';

    const canConfirmReceived =
      order.shippingStatus === 'IN_TRANSIT' &&
      order.status !== 'CANCELLED' &&
      order.status !== 'COMPLETED';

    const canRequestReturn =
      order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED';

    const canReview =
      order.status === 'COMPLETED' && order.shippingStatus === 'DELIVERED';

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
            <span className={statusClass(order)}>{labelFlow(order)}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Giao hàng:</span>
            <span className="order-detail-value">{labelFlow(order)}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Thanh toán:</span>
            <span className="order-detail-value">
              {order.paymentMethod} - {order.paymentStatus}
            </span>
          </div>
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
              style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }}
            >
              🔄 Cập nhật trạng thái
            </button>

            {canCancelOrder && (
              <button
                type="button"
                onClick={async () => {
                  if (!id) return;
                  if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return;
                  try {
                    const res = await OrdersApi.cancelOrder(id);
                    if (!res.success) {
                      alert(res.message || 'Huỷ đơn thất bại');
                      return;
                    }
                    await load();
                    alert('Đã huỷ đơn hàng.');
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Huỷ đơn thất bại');
                  }
                }}
                className="order-detail-back-button"
                style={{ background: '#fff', color: '#b42318', border: '1px solid #fca5a5' }}
              >
                ❌ Huỷ đơn
              </button>
            )}

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
                ✅ Đã nhận hàng
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
                    alert('Đã cập nhật trạng thái: Hoàn hàng.');
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
            Luồng: Chờ shop xác nhận → Shop đã nhận đơn → Đang giao → Người mua xác nhận đã nhận hàng → Có thể hoàn hàng.
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
                    {new Intl.NumberFormat('vi-VN').format(Number(it.price))} VND × {it.quantity}
                  </div>
                </div>
                <div className="order-detail-item-total">
                  {new Intl.NumberFormat('vi-VN').format(Number(it.totalLine))} VND
                </div>
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
              <span className="order-detail-summary-value">
                {new Intl.NumberFormat('vi-VN').format(Number(order.subtotal))} VND
              </span>
            </div>
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Phí ship:</span>
              <span className="order-detail-summary-value">
                {new Intl.NumberFormat('vi-VN').format(Number(order.shippingFee))} VND
              </span>
            </div>
            {!!Number(order.discount || 0) && (
              <div className="order-detail-summary-row">
                <span className="order-detail-summary-label">Giảm giá:</span>
                <span className="order-detail-summary-value">
                  - {new Intl.NumberFormat('vi-VN').format(Number(order.discount))} VND
                </span>
              </div>
            )}
            <div className="order-detail-summary-total">
              <span className="order-detail-summary-total-label">Tổng cộng:</span>
              <span className="order-detail-summary-total-value">
                {new Intl.NumberFormat('vi-VN').format(Number(order.total))} VND
              </span>
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