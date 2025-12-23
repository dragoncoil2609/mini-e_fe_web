import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { PaymentMethod, PreviewOrderResponse } from '../../api/types';
import './CheckoutPage.css';

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
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.previewOrder({ itemIds });
      if (res.success) setPreview(res.data);
      else setError(res.message || 'Không preview được đơn hàng.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không preview được đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemIds.length) return;
    void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds.join(',')]);

  const pay = async () => {
    if (!itemIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await OrdersApi.createOrder({ paymentMethod: method, itemIds, note });
      if (!res.success) {
        setError(res.message || 'Tạo đơn thất bại');
        return;
      }

      // COD: tạo order ngay
      if ('orders' in res.data) {
        navigate('/orders?created=1');
        return;
      }

      // VNPAY: redirect sang gateway để hiện QR chuẩn
      if ('paymentUrl' in res.data) {
        window.location.href = res.data.paymentUrl;
      }
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
          <button className="checkout-brand" onClick={() => navigate('/home')}>Mini-E</button>
          <div className="checkout-headerbar-right">
            <Link className="checkout-chip" to="/products">🛍️ Sản phẩm</Link>
            <Link className="checkout-chip" to="/cart">🛒 Giỏ hàng</Link>
            <Link className="checkout-chip" to="/orders">📦 Đơn hàng</Link>
          </div>
        </div>
      </header>

      <main className="checkout-main">
        <div className="checkout-content">
          <div className="checkout-card">
            <div className="checkout-title-row">
              <div>
                <h1 className="checkout-title">Thanh toán</h1>
                <p className="checkout-subtitle">Xác nhận địa chỉ, kiểm tra đơn và chọn phương thức thanh toán.</p>
              </div>
              <div className="checkout-title-actions">
                <Link className="checkout-secondary-link" to="/cart">← Giỏ hàng</Link>
                <Link className="checkout-secondary-link" to="/addresses">Địa chỉ</Link>
              </div>
            </div>

            {!itemIds.length ? (
              <div className="checkout-empty">
                <p>Bạn chưa chọn sản phẩm nào để thanh toán.</p>
                <Link className="checkout-primary" to="/cart">Quay lại giỏ hàng</Link>
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
                      <h2 className="checkout-section-title">Sản phẩm</h2>
                      <div className="checkout-orders">
                        {preview.orders.map((g, idx) => (
                          <div key={idx} className="checkout-order-group">
                            <div className="checkout-order-group-title">{g.product.title}</div>
                            <div className="checkout-items">
                              {g.items.map((it) => (
                                <div key={it.id} className="checkout-item">
                                  <div className="checkout-item-left">
                                    {it.imageUrl ? (
                                      <img className="checkout-item-image" src={it.imageUrl} alt="" />
                                    ) : (
                                      <div className="checkout-item-image checkout-item-image--placeholder" />
                                    )}
                                    <div className="checkout-item-info">
                                      <div className="checkout-item-name">{it.name}</div>
                                      <div className="checkout-item-qty">x{it.quantity}</div>
                                    </div>
                                  </div>
                                  <div className="checkout-item-total">
                                    {new Intl.NumberFormat('vi-VN').format(it.totalLine)} VND
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="checkout-shipping-fee">
                              Phí ship: <b>{new Intl.NumberFormat('vi-VN').format(g.shippingFee)} VND</b>
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
                            {new Intl.NumberFormat('vi-VN').format(preview.summary.subtotal)} VND
                          </b>
                        </div>
                        <div className="checkout-summary-row">
                          <span className="checkout-summary-label">Phí ship</span>
                          <b className="checkout-summary-value">
                            {new Intl.NumberFormat('vi-VN').format(preview.summary.shippingFee)} VND
                          </b>
                        </div>
                        <div className="checkout-summary-total">
                          <span className="checkout-summary-total-label">Tổng cộng</span>
                          <b className="checkout-summary-total-value">
                            {new Intl.NumberFormat('vi-VN').format(preview.summary.total)} VND
                          </b>
                        </div>
                      </div>
                    </div>

                    <div className="checkout-section">
                      <h2 className="checkout-section-title">Phương thức thanh toán</h2>

                      <label className="checkout-radio">
                        <input type="radio" checked={method === 'COD'} onChange={() => setMethod('COD')} />
                        <span>Thanh toán khi nhận hàng (COD)</span>
                      </label>

                      <label className="checkout-radio">
                        <input type="radio" checked={method === 'VNPAY'} onChange={() => setMethod('VNPAY')} />
                        <span>VNPAY (quét QR trên trang VNPAY)</span>
                      </label>

                      <div className="checkout-note">
                        <div className="checkout-note-label">Ghi chú (tuỳ chọn)</div>
                        <input
                          className="checkout-note-input"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ví dụ: giao giờ hành chính..."
                        />
                      </div>

                      <button onClick={pay} disabled={loading} className="checkout-pay">
                        {method === 'VNPAY' ? 'Thanh toán VNPay' : 'Đặt hàng COD'}
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
