import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentResultPage.css';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const status = (sp.get('status') || 'unknown').toLowerCase();
  const code = sp.get('code') || '';
  const rc = sp.get('rc') || '';
  const msg = sp.get('msg') || '';

  const tone: Tone =
    status === 'success' || status === 'paid' || status === 'ok'
      ? 'success'
      : status === 'finalize_error'
      ? 'warning'
      : status === 'invalid' ||
        status === 'failed' ||
        status === 'session_not_found' ||
        status === 'amount_mismatch' ||
        status === 'canceled' ||
        status === 'cancelled'
      ? 'danger'
      : 'neutral';

  const icon =
    tone === 'success' ? '✅' : tone === 'warning' ? '⚠️' : tone === 'danger' ? '❌' : 'ℹ️';

  const title =
    tone === 'success'
      ? 'Thanh toán thành công'
      : tone === 'warning'
      ? 'Thanh toán thành công nhưng tạo đơn chưa hoàn tất'
      : tone === 'danger'
      ? 'Thanh toán thất bại'
      : 'Kết quả thanh toán';

  const description = (() => {
    switch (status) {
      case 'invalid':
        return 'Chữ ký thanh toán không hợp lệ.';
      case 'session_not_found':
        return 'Không tìm thấy phiên thanh toán.';
      case 'amount_mismatch':
        return 'Số tiền trả về không khớp với phiên thanh toán.';
      case 'failed':
        return `Thanh toán thất bại${rc ? ` (ResponseCode=${rc})` : ''}.`;
      case 'finalize_error':
        return `Thanh toán thành công nhưng hệ thống tạo đơn gặp lỗi${msg ? `: ${msg}` : '.'}`;
      case 'canceled':
      case 'cancelled':
        return 'Bạn đã huỷ giao dịch thanh toán.';
      case 'success':
      case 'paid':
      case 'ok':
        return 'Giao dịch đã được xác nhận thành công.';
      default:
        return 'Không rõ trạng thái thanh toán.';
    }
  })();

  const pillText =
    tone === 'success'
      ? 'SUCCESS'
      : tone === 'warning'
      ? 'WARNING'
      : tone === 'danger'
      ? 'FAILED'
      : 'UNKNOWN';

  return (
    <div className="payres-container">
      <div className="payres-headerbar">
        <div className="payres-headerbar-content">
          <button className="payres-brand" onClick={() => navigate('/home')}>
            Mini-E
          </button>

          <div className="payres-headerbar-right">
            <Link className="payres-chip" to="/products">
              Sản phẩm
            </Link>
            <Link className="payres-chip" to="/cart">
              Giỏ hàng
            </Link>
            <Link className="payres-chip" to="/orders">
              Đơn hàng
            </Link>
          </div>
        </div>
      </div>

      <main className="payres-main">
        <div className="payres-content">
          <div className="payres-card">
            <div className="payres-hero">
              <div
                className={
                  'payres-icon ' +
                  (tone === 'success'
                    ? 'payres-icon-success'
                    : tone === 'warning'
                    ? 'payres-icon-warning'
                    : tone === 'danger'
                    ? 'payres-icon-danger'
                    : '')
                }
                aria-hidden
              >
                {icon}
              </div>

              <div>
                <h1 className="payres-title">{title}</h1>
                <p className="payres-subtitle">{description}</p>
                <div
                  className={
                    'payres-pill ' +
                    (tone === 'success'
                      ? 'payres-pill-success'
                      : tone === 'warning'
                      ? 'payres-pill-warning'
                      : tone === 'danger'
                      ? 'payres-pill-danger'
                      : '')
                  }
                >
                  Trạng thái: {pillText}
                </div>
              </div>
            </div>

            <div className="payres-section">
              <div className="payres-kv">
                <div className="payres-k">Session / TxnRef</div>
                <div className="payres-v">{code || '—'}</div>

                <div className="payres-k">Status</div>
                <div className="payres-v">{status || '—'}</div>

                <div className="payres-k">ResponseCode (rc)</div>
                <div className="payres-v">{rc || '—'}</div>

                <div className="payres-k">Message</div>
                <div className="payres-v">{msg || '—'}</div>
              </div>
            </div>

            <div className="payres-actions">
              <Link to="/orders" className="payres-btn payres-btn-primary">
                Xem đơn hàng
              </Link>
              <Link to="/cart" className="payres-btn">
                Về giỏ hàng
              </Link>
              <Link to="/products" className="payres-btn">
                Tiếp tục mua sắm
              </Link>
            </div>

            <div className="payres-note">
              Nếu bạn đã thanh toán thành công nhưng chưa thấy đơn hàng, hãy vào trang Đơn hàng và tải lại sau vài giây.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}