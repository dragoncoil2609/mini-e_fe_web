import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { PaymentMethod, PreviewOrderResponse } from '../../api/types';
import './CheckoutPage.css';

function formatMoney(value: number | string) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const itemIds = useMemo(() => {
    const raw = sp.get('itemIds') || '';
    return raw
      .split(',')
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [sp]);

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');

  const loadPreview = async () => {
    if (!itemIds.length) return;

    setLoading(true);
    setError(null);

    try {
      const res = await OrdersApi.previewOrder({ itemIds });
      if (!res.success) {
        setError(res.message || 'Không preview được đơn hàng.');
        setPreview(null);
        return;
      }

      setPreview(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không preview được đơn hàng.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds.join(',')]);

  const pay = async () => {
    if (!itemIds.length) return;

    setLoading(true);
    setError(null);

    try {
      const res = await OrdersApi.createOrder({
        paymentMethod: method,
        itemIds,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.message || 'Tạo đơn thất bại');
        return;
      }

      // COD: tạo order ngay
      if ('orders' in res.data) {
        navigate('/orders');
        return;
      }

      // VNPAY: redirect sang gateway
      if ('paymentUrl' in res.data) {
        window.location.href = res.data.paymentUrl;
        return;
      }

      setError('Không xác định được kết quả tạo đơn');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <header className="checkout-headerbar">
        <div className="checkout-headerbar-content">
          <button className="checkout-brand" onClick={() => navigate('/home')}>
            Mini-E
          </button>

          <div className="checkout-headerbar-right">
            <Link className="checkout-chip" to="/products">
              🛍️ Sản phẩm
            </Link>
            <Link className="checkout-chip" to="/cart">
              🛒 Giỏ hàng
            </Link>
            <Link className="checkout-chip" to="/orders">
              📦 Đơn hàng
            </Link>
          </div>
        </div>
      </header>

      <main className="checkout-main">
        <div className="checkout-content">
          <div className="checkout-card">
            <div className="checkout-title-row">
              <div>
                <h1 className="checkout-title">Thanh toán</h1>
                <p className="checkout-subtitle">
                  Xác nhận địa chỉ, kiểm tra đơn và chọn phương thức thanh toán.
                </p>
              </div>

              <div className="checkout-title-actions">
                <Link className="checkout-secondary-link" to="/cart">
                  ← Giỏ hàng
                </Link>
                <Link className="checkout-secondary-link" to="/addresses">
                  Địa chỉ
                </Link>
              </div>
            </div>

            {!itemIds.length ? (
              <div className="checkout-empty">
                <p>Bạn chưa chọn sản phẩm nào để thanh toán.</p>
                <Link className="checkout-primary" to="/cart">
                  Quay lại giỏ hàng
                </Link>
              </div>
            ) : (
              <>
                {loading && <div className="checkout-loading">Đang xử lý...</div>}
                {error && <div className="checkout-error">{error}</div>}

                {preview && (
                  <>
                    <div className="checkout-section">
                      <h2 className="checkout-section-title">Giao đến</h2>
                      <div className="checkout-address">
                        <div className="checkout-address-name">
                          <b>{preview.address.fullName}</b> • {preview.address.phone}
                        </div>
                        <div className="checkout-address-text">{preview.address.formattedAddress}</div>
                        <div className="checkout-address-hint">
                          Nếu sai địa chỉ, hãy đặt địa chỉ mặc định ở trang <b>Địa chỉ</b>.
                        </div>
                      </div>
                    </div>

                    <div className="checkout-section">
                      <h2 className="checkout-section-title">Sản phẩm theo shop</h2>

                      <div className="checkout-orders">
                        {preview.orders.map((g) => (
                          <div key={g.shop.id} className="checkout-order-group">
                            <div className="checkout-order-group-title">
                              🏪 {g.shop.name}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: '#667085',
                                marginBottom: 10,
                              }}
                            >
                              Shop ID: {g.shop.id}
                              {g.distanceKm > 0 ? ` • Khoảng cách ước tính: ${g.distanceKm} km` : ''}
                            </div>

                            <div className="checkout-items">
                              {g.items.map((it) => (
                                <div key={it.id} className="checkout-item">
                                  <div className="checkout-item-left">
                                    {it.imageUrl ? (
                                      <img
                                        className="checkout-item-image"
                                        src={it.imageUrl}
                                        alt={it.name}
                                      />
                                    ) : (
                                      <div className="checkout-item-image checkout-item-image--placeholder" />
                                    )}

                                    <div className="checkout-item-info">
                                      <div className="checkout-item-name">{it.name}</div>
                                      <div className="checkout-item-qty">
                                        Số lượng: x{it.quantity}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="checkout-item-total">
                                    {formatMoney(it.totalLine)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="checkout-shipping-fee">
                              <div>
                                Tạm tính shop: <b>{formatMoney(g.subtotal)}</b>
                              </div>
                              <div>
                                Phí ship shop: <b>{formatMoney(g.shippingFee)}</b>
                              </div>
                              <div style={{ marginTop: 4 }}>
                                Tổng shop: <b>{formatMoney(g.total)}</b>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="checkout-section">
                      <h2 className="checkout-section-title">Tổng tiền</h2>

                      <div className="checkout-summary">
                        <div className="checkout-summary-row">
                          <span className="checkout-summary-label">Tạm tính</span>
                          <b className="checkout-summary-value">
                            {formatMoney(preview.summary.subtotal)}
                          </b>
                        </div>

                        <div className="checkout-summary-row">
                          <span className="checkout-summary-label">Phí ship</span>
                          <b className="checkout-summary-value">
                            {formatMoney(preview.summary.shippingFee)}
                          </b>
                        </div>

                        <div className="checkout-summary-total">
                          <span className="checkout-summary-total-label">Tổng cộng</span>
                          <b className="checkout-summary-total-value">
                            {formatMoney(preview.summary.total)}
                          </b>
                        </div>
                      </div>
                    </div>

                    <div className="checkout-section">
                      <h2 className="checkout-section-title">Phương thức thanh toán</h2>

                      <label className="checkout-radio">
                        <input
                          type="radio"
                          checked={method === 'COD'}
                          onChange={() => setMethod('COD')}
                        />
                        <span>Thanh toán khi nhận hàng (COD)</span>
                      </label>

                      <label className="checkout-radio">
                        <input
                          type="radio"
                          checked={method === 'VNPAY'}
                          onChange={() => setMethod('VNPAY')}
                        />
                        <span>VNPAY (chuyển sang cổng thanh toán VNPAY)</span>
                      </label>

                      <div className="checkout-note">
                        <div className="checkout-note-label">Ghi chú (tuỳ chọn)</div>
                        <input
                          className="checkout-note-input"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ví dụ: giao giờ hành chính..."
                          maxLength={255}
                        />
                      </div>

                      <button onClick={pay} disabled={loading} className="checkout-pay">
                        {method === 'VNPAY' ? 'Thanh toán VNPAY' : 'Đặt hàng COD'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}