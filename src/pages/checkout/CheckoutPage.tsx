import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { PaymentMethod, PreviewOrderResponse } from '../../api/types';

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
        return;
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!itemIds.length) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Checkout</h2>
        <p>Bạn chưa chọn sản phẩm nào.</p>
        <Link to="/cart">Quay lại giỏ hàng</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <h2>Thanh toán</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/cart">← Giỏ hàng</Link>
          <Link to="/addresses">Địa chỉ</Link>
        </div>
      </div>

      {loading && <p>Đang xử lý...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {preview && (
        <>
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <h3>Giao đến</h3>
            <div><b>{preview.address.fullName}</b> - {preview.address.phone}</div>
            <div>{preview.address.formattedAddress}</div>
            <small>Nếu sai địa chỉ, hãy đặt địa chỉ mặc định ở trang Địa chỉ.</small>
          </div>

          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <h3>Sản phẩm</h3>
            {preview.orders.map((g, idx) => (
              <div key={idx} style={{ padding: 10, borderTop: idx ? '1px dashed #ddd' : 'none' }}>
                <div style={{ fontWeight: 600 }}>{g.product.title}</div>
                {g.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eee' }} />
                      )}
                      <div>
                        <div>{it.name}</div>
                        <small>x{it.quantity}</small>
                      </div>
                    </div>
                    <div>{new Intl.NumberFormat('vi-VN').format(it.totalLine)} VND</div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <small>Phí ship: <b>{new Intl.NumberFormat('vi-VN').format(g.shippingFee)} VND</b></small>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <h3>Tổng tiền</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tạm tính</span>
              <b>{new Intl.NumberFormat('vi-VN').format(preview.summary.subtotal)} VND</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Phí ship</span>
              <b>{new Intl.NumberFormat('vi-VN').format(preview.summary.shippingFee)} VND</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span>Tổng cộng</span>
              <b>{new Intl.NumberFormat('vi-VN').format(preview.summary.total)} VND</b>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <h3>Phương thức thanh toán</h3>
            <label style={{ display: 'block', marginTop: 6 }}>
              <input type="radio" checked={method === 'COD'} onChange={() => setMethod('COD')} /> Thanh toán khi nhận hàng (COD)
            </label>
            <label style={{ display: 'block', marginTop: 6 }}>
              <input type="radio" checked={method === 'VNPAY'} onChange={() => setMethod('VNPAY')} /> VNPAY (quét QR trên trang VNPAY)
            </label>

            <div style={{ marginTop: 10 }}>
              <div>Ghi chú (tuỳ chọn)</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: giao giờ hành chính..."
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
              />
            </div>

            <button
              onClick={pay}
              disabled={loading}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#111',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {method === 'VNPAY' ? 'Thanh toán VNPay' : 'Đặt hàng COD'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
