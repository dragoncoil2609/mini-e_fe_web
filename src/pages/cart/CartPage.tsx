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

  const getErrorMessage = (err: any, fallback: string): string => {
    return err?.response?.data?.message || err?.message || fallback;
  };

  const syncCartState = (
    nextCart: Cart | null,
    options?: { preserveSelection?: boolean },
  ) => {
    setCart(nextCart);
    setBrokenImages(new Set());

    if (!nextCart) {
      setSelectedIds(new Set());
      return;
    }

    const preserveSelection = options?.preserveSelection ?? true;

    if (!preserveSelection) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds((prev) => {
      const validIds = new Set(nextCart.items.map((item) => item.id));
      const next = new Set<number>();

      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });

      return next;
    });
  };

  const loadCart = async (options?: { preserveSelection?: boolean }) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.getCart();

      if (res.success) {
        syncCartState(res.data, {
          preserveSelection: options?.preserveSelection ?? false,
        });
      } else {
        setError(res.message || 'Không tải được giỏ hàng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        getErrorMessage(err, 'Không tải được giỏ hàng. Vui lòng đăng nhập.'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart({ preserveSelection: false });
  }, []);

  const normalizeUrl = (u: string | null | undefined): string | null => {
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `${backendBaseUrl}${u.startsWith('/') ? '' : '/'}${u}`;
  };

  const getItemImageUrl = (item: CartItem): string | null => {
    if (item.imageUrl) return normalizeUrl(item.imageUrl);
    return null;
  };

  const markImageBroken = (itemId: number) => {
    setBrokenImages((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const formatPrice = (price: string | number): string => {
    const num = Number(price);
    if (Number.isNaN(num)) return String(price);
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
        syncCartState(res.data, { preserveSelection: true });

        if (newQuantity === 0) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }

        setMessage(
          newQuantity === 0
            ? 'Đã xóa sản phẩm khỏi giỏ hàng.'
            : 'Đã cập nhật số lượng.',
        );
      } else {
        setError(res.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        getErrorMessage(err, 'Cập nhật số lượng thất bại. Vui lòng thử lại.'),
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
        syncCartState(res.data, { preserveSelection: true });

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
      setError(
        getErrorMessage(err, 'Xóa sản phẩm thất bại. Vui lòng thử lại.'),
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!cart || cart.items.length === 0) return;

    const ok = window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng không?');
    if (!ok) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.clear();

      if (res.success) {
        syncCartState(res.data, { preserveSelection: false });
        setMessage('Đã xóa toàn bộ giỏ hàng.');
      } else {
        setError(res.message || 'Xóa toàn bộ giỏ hàng thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        getErrorMessage(
          err,
          'Xóa toàn bộ giỏ hàng thất bại. Vui lòng thử lại.',
        ),
      );
    } finally {
      setLoading(false);
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
    if (!cart || cart.items.length === 0) return;

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

    for (const item of cart.items) {
      if (!selectedIds.has(item.id)) continue;
      count += 1;
      qty += item.quantity;
      subtotal += Number(item.price) * item.quantity;
    }

    return { count, qty, subtotal };
  }, [cart, selectedIds]);

  const goCheckout = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    navigate(`/checkout?itemIds=${ids.join(',')}`);
  };

  const currency = cart?.currency ?? 'VND';
  const cartItems = cart?.items ?? [];
  const allSelected =
    cartItems.length > 0 && cartItems.every((item) => selectedIds.has(item.id));

  return (
    <div className="cart-container">
      <header className="cart-headerbar">
        <div className="cart-headerbar-content">
          <button
            className="cart-brand"
            onClick={() => navigate('/home')}
            aria-label="Go Home"
          >
            🛍️ Mini-E
          </button>

          <div className="cart-headerbar-right">
            <Link className="cart-chip" to="/home">
              🏠 Trang chủ
            </Link>
            <Link className="cart-chip" to="/orders">
              📦 Đơn hàng
            </Link>
            <button
              className="cart-chip cart-chip--ghost"
              onClick={() => navigate(-1)}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </header>

      <main className="cart-main">
        <div className="cart-content">
          <div className="cart-pagehead">
            <div className="cart-pagehead-left">
              <h1 className="cart-title">Giỏ hàng</h1>
              <p className="cart-subtitle">
                Chọn sản phẩm để thanh toán • Cập nhật số lượng • Xóa nhanh •
                Tính tổng tự động.
              </p>
            </div>

            <div className="cart-pagehead-actions">
              <button
                onClick={toggleAll}
                className="cart-secondary-button"
                disabled={!cart || cartItems.length === 0}
              >
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>

              <button
                onClick={handleClearCart}
                className="cart-secondary-button"
                disabled={!cart || cartItems.length === 0 || loading}
              >
                Xóa toàn bộ
              </button>

              <Link to="/addresses" className="cart-secondary-link">
                📍 Địa chỉ
              </Link>

              <Link to="/home" className="cart-primary">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {error && <div className="cart-error">{error}</div>}
          {message && <div className="cart-message">{message}</div>}

          {loading ? (
            <div className="cart-card">
              <div className="cart-loading">Đang tải giỏ hàng...</div>
            </div>
          ) : !cart || cartItems.length === 0 ? (
            <div className="cart-card">
              <div className="cart-empty">
                <p>Giỏ hàng của bạn đang trống.</p>
                <Link to="/home" className="cart-empty-link">
                  Về trang chủ & mua sắm
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-grid">
              <section className="cart-left">
                <div className="cart-card cart-card--flat">
                  <div className="cart-items-list">
                    {cartItems.map((item) => {
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
                                  onError={() => markImageBroken(item.id)}
                                />
                              ) : (
                                <div className="cart-item-image-placeholder">
                                  📦
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="cart-item-info">
                            <Link
                              to={`/products/${item.productId}`}
                              className="cart-item-title"
                            >
                              {item.title}
                            </Link>

                            <div className="cart-item-variant">
                              Biến thể:{' '}
                              {item.variantName ?? `#${item.variantId}`}
                            </div>

                            {item.sku && (
                              <div className="cart-item-sku">
                                SKU: {item.sku}
                              </div>
                            )}

                            <div className="cart-item-price">
                              {formatPrice(item.price)} {currency} / sản phẩm
                            </div>
                          </div>

                          <div className="cart-item-quantity">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  Math.max(0, item.quantity - 1),
                                )
                              }
                              disabled={isUpdating}
                              className="cart-quantity-button"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>

                            <span className="cart-quantity-value">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                )
                              }
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
                        {formatPrice(selectedSummary.subtotal.toFixed(2))}{' '}
                        {currency}
                      </span>
                    </div>

                    <div className="cart-summary-divider" />

                    <button
                      className="cart-checkout-button"
                      disabled={selectedIds.size === 0}
                      onClick={goCheckout}
                      title={
                        selectedIds.size === 0
                          ? 'Chọn ít nhất 1 sản phẩm'
                          : 'Thanh toán'
                      }
                    >
                      Thanh toán
                    </button>

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