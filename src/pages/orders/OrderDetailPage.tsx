import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrdersApi } from '../../api/orders.api';
import type { Order } from '../../api/types';
import './OrderDetailPage.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [id]);

  if (!id) return <div className="order-detail-container"><div className="order-detail-card">Thiếu ID đơn hàng.</div></div>;
  if (loading) return <div className="order-detail-container"><div className="order-detail-card">Đang tải...</div></div>;
  if (error) return <div className="order-detail-container"><div className="order-detail-card">{error}</div></div>;
  if (!order) return null;

  return (
    <div className="order-detail-container">
      <div className="order-detail-card">
        <div className="order-detail-header">
          <div className="order-detail-header-buttons">
            <button onClick={() => navigate('/orders')} className="order-detail-back-button">← Quay lại</button>
            <button onClick={() => navigate('/home')} className="home-button">🏠 Về trang chủ</button>
          </div>
          <h1 className="order-detail-title">Chi tiết đơn hàng</h1>
        </div>

        <div className="order-detail-section">
          <div className="order-detail-info-row">
            <span className="order-detail-label">Mã đơn:</span>
            <span className="order-detail-value">{order.code}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Trạng thái:</span>
            <span className="order-detail-value">{order.status}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Thanh toán:</span>
            <span className="order-detail-value">{order.paymentMethod} - {order.paymentStatus}</span>
          </div>
          <div className="order-detail-info-row">
            <span className="order-detail-label">Ngày đặt:</span>
            <span className="order-detail-value">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
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
                    <img src={it.imageSnapshot} alt="" />
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
              <span className="order-detail-summary-value">{new Intl.NumberFormat('vi-VN').format(Number(order.subtotal))} VND</span>
            </div>
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Phí ship:</span>
              <span className="order-detail-summary-value">{new Intl.NumberFormat('vi-VN').format(Number(order.shippingFee))} VND</span>
            </div>
            <div className="order-detail-summary-total">
              <span className="order-detail-summary-total-label">Tổng cộng:</span>
              <span className="order-detail-summary-total-value">{new Intl.NumberFormat('vi-VN').format(Number(order.total))} VND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
