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
      : status === 'invalid' || status === 'failed' || status === 'session_not_found'
      ? 'danger'
      : 'neutral';

  const icon = tone === 'success' ? '✅' : tone === 'warning' ? '⚠️' : tone === 'danger' ? '❌' : 'ℹ️';

  const title =
    tone === 'success'
      ? 'Thanh toán thành công'
      : tone === 'warning'
      ? 'Thanh toán thành công (nhưng có lỗi)'
      : tone === 'danger'
      ? 'Thanh toán thất bại'
      : 'Kết quả thanh toán';

  const description =
    status === 'invalid'
      ? 'Sai chữ ký (invalid signature).'
      : status === 'session_not_found'
      ? 'Không tìm thấy phiên thanh toán.'
      : status === 'failed'
      ? `Thanh toán thất bại (ResponseCode=${rc || 'N/A'}).`
      : status === 'finalize_error'
      ? `Thanh toán OK nhưng tạo đơn lỗi: ${msg || 'Không rõ nguyên nhân.'}`
      : status === 'success' || status === 'paid' || status === 'ok'
      ? 'Giao dịch đã được xác nhận.'
      : 'Không rõ trạng thái.';

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
            <Link className="payres-chip" to="/products">Sản phẩm</Link>
            <Link className="payres-chip" to="/cart">Giỏ hàng</Link>
            <Link className="payres-chip" to="/orders">Đơn hàng</Link>
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

                <div className="payres-k">status</div>
                <div className="payres-v">{status}</div>

                <div className="payres-k">ResponseCode (rc)</div>
                <div className="payres-v">{rc || '—'}</div>

                <div className="payres-k">message</div>
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
              Nếu bạn đã thanh toán thành công nhưng chưa thấy đơn hàng, hãy thử tải lại trang Đơn hàng sau vài giây.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
