// src/pages/payments/PaymentResultPage.tsx
import { Link, useLocation } from 'react-router-dom';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './PaymentResultPage.css';

function getMessage(status: string, rc: string | null, msg: string | null) {
  if (status === 'invalid') return 'Chữ ký thanh toán không hợp lệ.';
  if (status === 'session_not_found') return 'Không tìm thấy phiên thanh toán.';
  if (status === 'amount_mismatch') return 'Số tiền thanh toán không khớp.';
  if (status === 'finalize_error') return msg || 'Thanh toán thành công nhưng tạo đơn bị lỗi.';
  if (status === 'failed') return `Thanh toán thất bại${rc ? `, mã lỗi ${rc}` : ''}.`;

  return 'Không xác định được kết quả thanh toán.';
}

export default function PaymentResultPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const status = params.get('status') ?? '';
  const code = params.get('code') ?? '';
  const rc = params.get('rc');
  const msg = params.get('msg');

  const message = getMessage(status, rc, msg);

  return (
    <div className="mochi-page payment-result-page">
      <div className="mochi-container">
        <section className="payment-result-card mochi-card">
          <img src={bunnyImg} alt="Kết quả thanh toán" />

          <h1>Thanh toán chưa hoàn tất</h1>
          <p>{message}</p>

          {code ? (
            <div className="payment-result-code">
              <span>Mã phiên thanh toán</span>
              <b>{code}</b>
            </div>
          ) : null}

          <div className="payment-result-actions">
            <Link to="/cart" className="mochi-btn mochi-btn-outline">
              Quay lại giỏ hàng
            </Link>

            <Link to="/orders" className="mochi-btn mochi-btn-primary">
              Xem đơn hàng
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}