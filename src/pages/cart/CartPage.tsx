// src/pages/cart/CartPage.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartApi } from '../../api/cart.api';
import type { Cart, CartItem } from '../../api/types';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await CartApi.getCart();
      if (res.success) {
        setCart(res.data);
      } else {
        setError(res.message || 'Không tải được giỏ hàng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Không tải được giỏ hàng. Vui lòng đăng nhập.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdating((prev) => new Set(prev).add(itemId));
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.updateItem(itemId, { quantity: newQuantity });
      if (res.success) {
        setCart(res.data);
        if (newQuantity === 0) {
          setMessage('Đã xóa sản phẩm khỏi giỏ hàng.');
        } else {
          setMessage('Đã cập nhật số lượng.');
        }
      } else {
        setError(res.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Cập nhật số lượng thất bại. Vui lòng thử lại.',
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating((prev) => new Set(prev).add(itemId));
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.removeItem(itemId);
      if (res.success) {
        setCart(res.data);
        setMessage('Đã xóa sản phẩm khỏi giỏ hàng.');
      } else {
        setError(res.message || 'Xóa thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xóa sản phẩm thất bại. Vui lòng thử lại.');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      return;
    }

    setUpdating((prev) => new Set(prev).add(-1));
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.clear();
      if (res.success) {
        setCart(res.data);
        setMessage('Đã xóa tất cả sản phẩm trong giỏ hàng.');
      } else {
        setError(res.message || 'Xóa thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xóa giỏ hàng thất bại. Vui lòng thử lại.');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(-1);
        return next;
      });
    }
  };

  const getItemImageUrl = (item: CartItem): string | null => {
    if (!item.imageId) return null;
    const backendBaseUrl =
      import.meta.env.VITE_BACKEND_BASE_URL ||
      (import.meta.env.VITE_API_BASE_URL?.startsWith('http')
        ? new URL(import.meta.env.VITE_API_BASE_URL).origin
        : window.location.origin);
    return `${backendBaseUrl}/uploads/products/${item.imageId}.jpg`;
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="cart-card">
          <div className="cart-loading">Đang tải giỏ hàng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-card">
        <div className="cart-header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
          <div className="cart-icon">🛒</div>
          <h1 className="cart-title">Giỏ hàng của tôi</h1>
        </div>

        {error && <div className="cart-error">{error}</div>}
        {message && <div className="cart-message">{message}</div>}

        {!cart || cart.items.length === 0 ? (
          <div className="cart-empty">
            <p>Giỏ hàng của bạn đang trống.</p>
            <Link to="/products" className="cart-empty-link">
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items-section">
              <div className="cart-items-header">
                <h2 className="cart-items-title">Sản phẩm ({cart.itemsCount})</h2>
                {cart.items.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    disabled={updating.has(-1)}
                    className="cart-clear-button"
                  >
                    {updating.has(-1) ? 'Đang xóa...' : 'Xóa tất cả'}
                  </button>
                )}
              </div>

              <div className="cart-items-list">
                {cart.items.map((item) => {
                  const imageUrl = getItemImageUrl(item);
                  const itemTotal = parseFloat(item.price) * item.quantity;
                  const isUpdating = updating.has(item.id);

                  return (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.title} />
                        ) : (
                          <div className="cart-item-image-placeholder">📦</div>
                        )}
                      </div>

                      <div className="cart-item-info">
                        <Link
                          to={`/products/${item.productId}`}
                          className="cart-item-title"
                        >
                          {item.title}
                        </Link>
                        {item.variantName && (
                          <div className="cart-item-variant">
                            Biến thể: {item.variantName}
                          </div>
                        )}
                        {item.sku && (
                          <div className="cart-item-sku">SKU: {item.sku}</div>
                        )}
                        <div className="cart-item-price">
                          {formatPrice(item.price)} {cart.currency} / sản phẩm
                        </div>
                      </div>

                      <div className="cart-item-quantity">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={isUpdating || item.quantity <= 1}
                          className="cart-quantity-button"
                        >
                          −
                        </button>
                        <span className="cart-quantity-value">{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={isUpdating}
                          className="cart-quantity-button"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-total">
                        <div className="cart-item-total-label">Tổng:</div>
                        <div className="cart-item-total-value">
                          {formatPrice(itemTotal.toFixed(2))} {cart.currency}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="cart-item-remove"
                        title="Xóa sản phẩm"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Số lượng sản phẩm:</span>
                <span className="cart-summary-value">{cart.itemsQuantity}</span>
              </div>
              <div className="cart-summary-row">
                <span className="cart-summary-label">Tạm tính:</span>
                <span className="cart-summary-value">
                  {formatPrice(cart.subtotal)} {cart.currency}
                </span>
              </div>
              <div className="cart-summary-total">
                <span className="cart-summary-total-label">Tổng cộng:</span>
                <span className="cart-summary-total-value">
                  {formatPrice(cart.subtotal)} {cart.currency}
                </span>
              </div>
              <button className="cart-checkout-button" disabled>
                Thanh toán (Sắp có)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

