// src/pages/cart/CartPage.tsx
import { useEffect, useMemo, useState } from 'react';
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
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const backendBaseUrl = useMemo(() => {
    const fromEnv =
      import.meta.env.VITE_BACKEND_BASE_URL ||
      (import.meta.env.VITE_API_BASE_URL?.startsWith('http')
        ? new URL(import.meta.env.VITE_API_BASE_URL).origin
        : window.location.origin);

    return String(fromEnv).replace(/\/$/, '');
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.getCart();
      if (res.success) {
        setCart(res.data);
        setSelectedIds(new Set()); // reset selection khi reload
      } else {
        setError(res.message || 'Không tải được giỏ hàng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Không tải được giỏ hàng. Vui lòng đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const getBackendOrigin = () => backendBaseUrl;

  const normalizeUrl = (u: string | null | undefined): string | null => {
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const origin = getBackendOrigin();
    return `${origin}${u.startsWith('/') ? '' : '/'}${u}`;
  };

  const getItemImageUrl = (item: CartItem): string | null => {
    if (item.imageUrl) return normalizeUrl(item.imageUrl);
    if (!item.imageId) return null;
    return `${getBackendOrigin()}/uploads/products/${item.imageId}.jpg`;
  };

  const formatPrice = (price: string): string => {
    const num = Number(price);
    if (Number.isNaN(num)) return price;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdating((prev) => new Set(prev).add(itemId));
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.updateItem(itemId, { quantity: newQuantity });
      if (res.success) {
        setCart(res.data);

        // nếu qty = 0 coi như remove -> bỏ chọn
        if (newQuantity === 0) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }

        setMessage(newQuantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng.' : 'Đã cập nhật số lượng.');
      } else {
        setError(res.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Cập nhật số lượng thất bại. Vui lòng thử lại.');
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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
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

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!cart) return;
    const allIds = cart.items.map((i) => i.id);
    setSelectedIds((prev) => {
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  };

  const selectedSummary = useMemo(() => {
    if (!cart) return { count: 0, qty: 0, subtotal: 0 };
    let count = 0;
    let qty = 0;
    let subtotal = 0;

    for (const it of cart.items) {
      if (!selectedIds.has(it.id)) continue;
      count++;
      qty += it.quantity;
      subtotal += Number(it.price) * it.quantity;
    }
    return { count, qty, subtotal };
  }, [cart, selectedIds]);

  const goCheckout = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    navigate(`/checkout?itemIds=${ids.join(',')}`);
  };

  const currency = cart?.currency ?? 'VND';
  const allSelected = cart?.items?.length ? cart.items.every((i) => selectedIds.has(i.id)) : false;

  return (
    <div className="cart-container">
      {/* Top bar */}
      <header className="cart-headerbar">
        <div className="cart-headerbar-content">
          <button className="cart-brand" onClick={() => navigate('/home')} aria-label="Go Home">
            🛍️ Mini-E
          </button>

          <div className="cart-headerbar-right">
            {/* ĐỔI /products -> /home theo yêu cầu */}
            <Link className="cart-chip" to="/home">
              🏠 Trang chủ
            </Link>
            <Link className="cart-chip" to="/orders">
              📦 Đơn hàng
            </Link>
            <button className="cart-chip cart-chip--ghost" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>
          </div>
        </div>
      </header>

      <main className="cart-main">
        <div className="cart-content">
          {/* Page head */}
          <div className="cart-pagehead">
            <div className="cart-pagehead-left">
              <h1 className="cart-title">Giỏ hàng</h1>
              <p className="cart-subtitle">
                Chọn sản phẩm để thanh toán • Cập nhật số lượng • Xóa nhanh • Tính tổng tự động.
              </p>
            </div>

            <div className="cart-pagehead-actions">
              <button onClick={toggleAll} className="cart-secondary-button" disabled={!cart || cart.items.length === 0}>
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>

              <Link to="/addresses" className="cart-secondary-link">
                📍 Địa chỉ
              </Link>

              {/* ĐỔI /products -> /home theo yêu cầu */}
              <Link to="/home" className="cart-primary">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {error && <div className="cart-error">{error}</div>}
          {message && <div className="cart-message">{message}</div>}

          {/* Loading */}
          {loading ? (
            <div className="cart-card">
              <div className="cart-loading">Đang tải giỏ hàng...</div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="cart-card">
              <div className="cart-empty">
                <p>Giỏ hàng của bạn đang trống.</p>
                {/* ĐỔI /products -> /home theo yêu cầu */}
                <Link to="/home" className="cart-empty-link">
                  Về trang chủ & mua sắm
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-grid">
              {/* LEFT: items */}
              <section className="cart-left">
                <div className="cart-card cart-card--flat">
                  <div className="cart-items-list">
                    {cart.items.map((item) => {
                      const imageUrl = getItemImageUrl(item);
                      const itemTotal = Number(item.price) * item.quantity;
                      const isUpdating = updating.has(item.id);

                      return (
                        <div key={item.id} className="cart-item">
                          <div className="cart-check-wrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleItem(item.id)}
                              aria-label="Select item"
                            />

                            <div className="cart-item-image">
                              {imageUrl && !brokenImages.has(item.id) ? (
                                <img
                                  src={imageUrl}
                                  alt={item.title}
                                  onError={() => setBrokenImages((prev) => new Set(prev).add(item.id))}
                                />
                              ) : (
                                <div className="cart-item-image-placeholder">📦</div>
                              )}
                            </div>
                          </div>

                          <div className="cart-item-info">
                            <Link to={`/products/${item.productId}`} className="cart-item-title">
                              {item.title}
                            </Link>

                            <div className="cart-item-variant">Biến thể: {item.variantName ?? `#${item.variantId}`}</div>
                            {item.sku && <div className="cart-item-sku">SKU: {item.sku}</div>}

                            <div className="cart-item-price">
                              {formatPrice(item.price)} {currency} / sản phẩm
                            </div>
                          </div>

                          <div className="cart-item-quantity">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              disabled={isUpdating}
                              className="cart-quantity-button"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>

                            <span className="cart-quantity-value">{item.quantity}</span>

                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isUpdating}
                              className="cart-quantity-button"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <div className="cart-item-total">
                            <div className="cart-item-total-label">Tổng:</div>
                            <div className="cart-item-total-value">
                              {formatPrice(itemTotal.toFixed(2))} {currency}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating}
                            className="cart-item-remove"
                            title="Xóa sản phẩm"
                            aria-label="Remove item"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* RIGHT: summary */}
              <aside className="cart-right">
                <div className="cart-summary-card">
                  <div className="cart-summary-title">Tóm tắt thanh toán</div>

                  <div className="cart-summary">
                    <div className="cart-summary-row">
                      <span className="cart-summary-label">Đã chọn:</span>
                      <span className="cart-summary-value">
                        {selectedSummary.count} dòng / {selectedSummary.qty} món
                      </span>
                    </div>

                    <div className="cart-summary-row">
                      <span className="cart-summary-label">Tạm tính:</span>
                      <span className="cart-summary-value">
                        {formatPrice(selectedSummary.subtotal.toFixed(2))} {currency}
                      </span>
                    </div>

                    <div className="cart-summary-divider" />

                    <button
                      className="cart-checkout-button"
                      disabled={selectedIds.size === 0}
                      onClick={goCheckout}
                      title={selectedIds.size === 0 ? 'Chọn ít nhất 1 sản phẩm' : 'Thanh toán'}
                    >
                      Thanh toán
                    </button>

                    {/* CTA phụ: đổi /products -> /home */}
                    <Link to="/home" className="cart-continue-link">
                      ← Tiếp tục mua sắm
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
