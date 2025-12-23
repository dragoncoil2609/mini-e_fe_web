import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentResultPage() {
  const [sp] = useSearchParams();
  const status = sp.get('status') || 'unknown';
  const code = sp.get('code') || '';
  const rc = sp.get('rc') || '';
  const msg = sp.get('msg') || '';

  const text =
    status === 'invalid'
      ? 'Sai chữ ký (invalid signature).'
      : status === 'session_not_found'
      ? 'Không tìm thấy phiên thanh toán.'
      : status === 'failed'
      ? `Thanh toán thất bại (ResponseCode=${rc}).`
      : status === 'finalize_error'
      ? `Thanh toán OK nhưng tạo đơn lỗi: ${msg}`
      : 'Không rõ trạng thái.';

  return (
    <div style={{ padding: 20 }}>
      <h2>Kết quả thanh toán</h2>
      <p><b>Session/TxnRef:</b> {code}</p>
      <p>{text}</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/orders">Xem đơn hàng</Link>
        <Link to="/cart">Về giỏ hàng</Link>
      </div>
    </div>
  );
}
