import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { CartApi } from '../../api/cart.api';
import { AddressesApi } from '../../api/addresses.api';
import type { Address, Cart, CartItem } from '../../api/types';

import basketImg from '../../assets/brand/basket_chick.png';
import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './CartPage.css';

const FREE_SHIP_MIN = 300000;
const DEFAULT_SHIPPING_FEE = 30000;

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat('vi-VN').format(toNumber(value)) + 'đ';
}

function getApiMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý giỏ hàng.'
  );
}

function getItemVariantText(item: CartItem): string {
  const values = [
    item.variantName,
    item.value1,
    item.value2,
    item.value3,
    item.value4,
    item.value5,
  ].filter(Boolean);

  if (values.length > 0) {
    return values.join(' • ');
  }

  return item.sku ? `SKU: ${item.sku}` : 'Sản phẩm Mochi';
}

function calcItemsQuantity(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
}

function calcItemsSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
    0,
  );
}

function isAddressDefault(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const items = cart?.items ?? [];

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const selectedQuantity = useMemo(
    () => calcItemsQuantity(selectedItems),
    [selectedItems],
  );

  const selectedSubtotal = useMemo(
    () => calcItemsSubtotal(selectedItems),
    [selectedItems],
  );

  const shippingFee =
    selectedSubtotal <= 0 || selectedSubtotal >= FREE_SHIP_MIN
      ? 0
      : DEFAULT_SHIPPING_FEE;

  const total = selectedSubtotal + shippingFee;

  async function loadCart() {
    setLoading(true);
    setError('');

    try {
      const res = await CartApi.getCart();
      const nextCart = res.data;

      setCart(nextCart);
      setSelectedIds((nextCart.items ?? []).map((item) => item.id));
    } catch (err: any) {
      setError(getApiMessage(err));
      setCart(null);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDefaultAddress() {
    setAddressLoading(true);

    try {
      const addresses = await AddressesApi.list();

      const nextDefaultAddress =
        addresses.find((address) => isAddressDefault(address.isDefault)) ?? null;

      setDefaultAddress(nextDefaultAddress);
    } catch {
      setDefaultAddress(null);
    } finally {
      setAddressLoading(false);
    }
  }

  async function updateQuantity(item: CartItem, nextQuantity: number) {
    const safeQuantity = Math.max(1, nextQuantity);

    setUpdatingItemId(item.id);
    setError('');

    try {
      const res = await CartApi.updateItem(item.id, {
        quantity: safeQuantity,
      });

      setCart(res.data);
      window.dispatchEvent(new Event('mochi-cart-updated'));
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function removeItem(item: CartItem) {
    const ok = window.confirm(`Xóa "${item.title}" khỏi giỏ hàng?`);
    if (!ok) return;

    setUpdatingItemId(item.id);
    setError('');

    try {
      const res = await CartApi.removeItem(item.id);

      setCart(res.data);
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      window.dispatchEvent(new Event('mochi-cart-updated'));
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function clearCart() {
    if (items.length <= 0) return;

    const ok = window.confirm('Bạn muốn xóa toàn bộ giỏ hàng?');
    if (!ok) return;

    setClearing(true);
    setError('');

    try {
      const res = await CartApi.clear();

      setCart(res.data);
      setSelectedIds([]);
      window.dispatchEvent(new Event('mochi-cart-updated'));
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setClearing(false);
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(items.map((item) => item.id));
  }

  function toggleSelectItem(itemId: number) {
    setSelectedIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  }

  function goCheckout() {
    if (selectedIds.length <= 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

    navigate(`/checkout?items=${selectedIds.join(',')}`);
  }

  useEffect(() => {
    void loadCart();
    void loadDefaultAddress();
  }, []);

  if (loading) {
    return (
      <div className="mochi-page cart-page">
        <div className="mochi-container">
          <div className="mochi-card cart-loading-card">
            <div className="mochi-loading-spinner" />
            <p>Đang tải giỏ hàng của bạn...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || items.length <= 0) {
    return (
      <div className="mochi-page cart-page">
        <div className="mochi-container">
          <section className="cart-empty mochi-card">
            <img src={bunnyImg} alt="Giỏ hàng trống" />

            <h1>Giỏ hàng đang trống</h1>
            <p>
              Bạn hãy chọn vài món đồ dễ thương để Mochi giữ giúp trong giỏ hàng nhé.
            </p>

            {error ? <div className="cart-error">{error}</div> : null}

            <Link to="/products" className="mochi-btn mochi-btn-primary">
              Khám phá sản phẩm
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page cart-page">
      <div className="mochi-container">
        <section className="cart-hero mochi-card">
          <div className="cart-hero-content">
            <h1>Giỏ hàng của bạn</h1>
            <p>
              🐻 Có <b>{cart.itemsQuantity}</b> sản phẩm trong giỏ hàng 💗
            </p>
          </div>

          <img src={basketImg} alt="Mochi cart" className="cart-hero-img" />

          <div className="cart-hero-actions">
            <button
              type="button"
              className="mochi-btn mochi-btn-outline"
              onClick={toggleSelectAll}
            >
              {allSelected ? '☑ Bỏ chọn tất cả' : '☑ Chọn tất cả'} ({items.length})
            </button>

            <button
              type="button"
              className="mochi-btn mochi-btn-outline"
              disabled={clearing}
              onClick={clearCart}
            >
              🗑 {clearing ? 'Đang xóa...' : 'Xóa toàn bộ'}
            </button>
          </div>
        </section>

        {error ? <div className="cart-error">{error}</div> : null}

        <section className="cart-layout">
          <div className="cart-items-card mochi-card">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const updating = updatingItemId === item.id;

              return (
                <article
                  key={item.id}
                  className={`cart-item ${selected ? 'is-selected' : ''}`}
                >
                  <label className="cart-check">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                    <span />
                  </label>

                  <Link to={`/products/${item.productId}`} className="cart-item-img">
                    <img
                      src={item.imageUrl || bunnyImg}
                      alt={item.title}
                      onError={(event) => {
                        event.currentTarget.src = bunnyImg;
                      }}
                    />
                  </Link>

                  <div className="cart-item-info">
                    <Link to={`/products/${item.productId}`}>
                      <h3>{item.title}</h3>
                    </Link>

                    <p>Phân loại: {getItemVariantText(item)}</p>

                    <strong>{formatMoney(item.price)}</strong>
                  </div>

                  <div className="cart-item-quantity">
                    <button
                      type="button"
                      disabled={updating || item.quantity <= 1}
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {formatMoney(toNumber(item.price) * item.quantity)}
                  </div>

                  <button
                    type="button"
                    className="cart-item-remove"
                    disabled={updating}
                    onClick={() => removeItem(item)}
                    aria-label="Xóa sản phẩm"
                  >
                    🗑
                  </button>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary mochi-card">
            <h2>♡ Tóm tắt đơn hàng</h2>

            <div className="cart-summary-row">
              <span>Tạm tính ({selectedQuantity} sản phẩm)</span>
              <strong>{formatMoney(selectedSubtotal)}</strong>
            </div>

            <div className="cart-summary-row">
              <span>Phí vận chuyển ⓘ</span>
              <strong className={shippingFee === 0 ? 'is-free' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : formatMoney(shippingFee)}
              </strong>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <span>Thành tiền</span>
              <strong>{formatMoney(total)}</strong>
            </div>

            <button
              type="button"
              className="mochi-btn mochi-btn-primary cart-checkout-btn"
              disabled={selectedIds.length <= 0}
              onClick={goCheckout}
            >
              🛍 Thanh toán
            </button>

            {addressLoading ? (
              <div className="cart-default-address cart-default-address-loading">
                <span className="cart-default-address-icon">📍</span>
                <div>
                  <b>Đang tải địa chỉ mặc định...</b>
                  <p>Vui lòng chờ một chút.</p>
                </div>
              </div>
            ) : defaultAddress ? (
              <div className="cart-default-address">
                <span className="cart-default-address-icon">📍</span>

                <div className="cart-default-address-content">
                  <div className="cart-default-address-head">
                    <b>Địa chỉ mặc định</b>
                    <em>Mặc định</em>
                  </div>

                  <strong>{defaultAddress.fullName}</strong>

                  <p className="cart-default-address-phone">
                    ☎ {defaultAddress.phone}
                  </p>

                  <p className="cart-default-address-text">
                    {defaultAddress.formattedAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="cart-default-address cart-default-address-empty">
                <span className="cart-default-address-icon">📍</span>

                <div>
                  <b>Chưa có địa chỉ mặc định</b>
                  <p>Hãy thêm hoặc đặt một địa chỉ mặc định để giao hàng nhanh hơn.</p>
                </div>
              </div>
            )}

            <Link to="/addresses" className="cart-address-btn">
              📍 Chọn địa chỉ giao hàng
            </Link>

            <div className="cart-free-note">
              <span>🐰</span>
              <div>
                {selectedSubtotal >= FREE_SHIP_MIN ? (
                  <>
                    <b>Bạn được miễn phí vận chuyển!</b>
                    <p>Đơn hàng của bạn đã đủ điều kiện.</p>
                  </>
                ) : (
                  <>
                    <b>Thêm {formatMoney(FREE_SHIP_MIN - selectedSubtotal)} để freeship!</b>
                    <p>Đơn từ 300k sẽ được miễn phí vận chuyển.</p>
                  </>
                )}
              </div>
            </div>
          </aside>
        </section>

        <Link to="/products" className="cart-continue-btn">
          ← Tiếp tục mua sắm
        </Link>

        <section className="cart-service-strip">
          <div>
            <span>🚚</span>
            <div>
              <b>Miễn phí vận chuyển</b>
              <p>Cho đơn từ 300K</p>
            </div>
          </div>

          <div>
            <span>🔁</span>
            <div>
              <b>Đổi trả dễ dàng</b>
              <p>Trong vòng 7 ngày</p>
            </div>
          </div>

          <div>
            <span>🛡</span>
            <div>
              <b>Thanh toán an toàn</b>
              <p>Bảo mật tuyệt đối</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}