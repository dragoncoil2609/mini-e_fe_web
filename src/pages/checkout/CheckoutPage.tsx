// src/pages/checkout/CheckoutPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AddressesApi } from '../../api/addresses.api';
import { OrdersApi } from '../../api/orders.api';
import type {
  Address,
  PaymentMethod,
  PreviewOrderResponse,
} from '../../api/types';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './CheckoutPage.css';

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
    'Không thể xử lý thanh toán.'
  );
}

function parseItemIds(search: string): number[] {
  const params = new URLSearchParams(search);
  const raw = params.get('items') ?? '';

  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function isAddressDefault(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function normalizeAddressList(response: any): Address[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const itemIds = useMemo(() => parseItemIds(location.search), [location.search]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | ''>('');
  const [preview, setPreview] = useState<PreviewOrderResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');

  const [addressLoading, setAddressLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedAddress = useMemo(() => {
    if (addressId === '') return null;
    return addresses.find((address) => address.id === addressId) ?? null;
  }, [addresses, addressId]);

  async function loadAddresses() {
    setAddressLoading(true);
    setError('');

    try {
      const response = await AddressesApi.list();
      const list = normalizeAddressList(response);

      setAddresses(list);

      const defaultAddress =
        list.find((address) => isAddressDefault(address.isDefault)) ?? list[0] ?? null;

      setAddressId(defaultAddress?.id ?? '');
    } catch (err: any) {
      setAddresses([]);
      setAddressId('');
      setError(getApiMessage(err));
    } finally {
      setAddressLoading(false);
    }
  }

  async function loadPreview(nextAddressId: number) {
    if (itemIds.length <= 0) {
      setPreview(null);
      setError('Bạn chưa chọn sản phẩm nào để thanh toán.');
      return;
    }

    setPreviewLoading(true);
    setError('');

    try {
      const response = await OrdersApi.previewOrder({
        addressId: nextAddressId,
        itemIds,
      });

      setPreview(response.data);
    } catch (err: any) {
      setPreview(null);
      setError(getApiMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCreateOrder() {
    if (itemIds.length <= 0) {
      setError('Bạn chưa chọn sản phẩm nào để thanh toán.');
      return;
    }

    if (!addressId) {
      setError('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await OrdersApi.createOrder({
        paymentMethod,
        addressId,
        itemIds,
        note: note.trim() || undefined,
      });

      const data = response.data;

      if ('paymentUrl' in data && data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }

      window.dispatchEvent(new Event('mochi-cart-updated'));
      window.dispatchEvent(new Event('mochi-orders-updated'));

      navigate('/orders?created=1', {
        replace: true,
        state: { createdOrders: 'orders' in data ? data.orders : [] },
      });
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadAddresses();
  }, []);

  useEffect(() => {
    if (typeof addressId === 'number') {
      void loadPreview(addressId);
    }
  }, [addressId, location.search]);

  if (itemIds.length <= 0) {
    return (
      <div className="mochi-page checkout-page">
        <div className="mochi-container">
          <section className="checkout-empty mochi-card">
            <img src={bunnyImg} alt="Không có sản phẩm" />
            <h1>Chưa có sản phẩm để thanh toán</h1>
            <p>Bạn hãy quay lại giỏ hàng và chọn sản phẩm cần mua trước nhé.</p>
            <Link to="/cart" className="mochi-btn mochi-btn-primary">
              Quay lại giỏ hàng
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page checkout-page">
      <div className="mochi-container">
        <section className="checkout-hero mochi-card">
          <div>
            <h1>Thanh toán</h1>
            <p>Kiểm tra địa chỉ, sản phẩm và chọn phương thức thanh toán.</p>
          </div>

          <img src={bunnyImg} alt="Checkout Mochi" />
        </section>

        {error ? <div className="checkout-alert checkout-alert-error">{error}</div> : null}

        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-section mochi-card">
              <div className="checkout-section-head">
                <div>
                  <h2>📍 Địa chỉ giao hàng</h2>
                  <p>Địa chỉ này sẽ được lưu snapshot vào đơn hàng.</p>
                </div>

                <Link to="/addresses" className="checkout-link-btn">
                  Quản lý địa chỉ
                </Link>
              </div>

              {addressLoading ? (
                <div className="checkout-loading-line">Đang tải địa chỉ...</div>
              ) : addresses.length <= 0 ? (
                <div className="checkout-address-empty">
                  <b>Bạn chưa có địa chỉ giao hàng.</b>
                  <p>Hãy thêm địa chỉ trước khi đặt hàng.</p>
                  <Link to="/addresses" className="mochi-btn mochi-btn-primary">
                    Thêm địa chỉ
                  </Link>
                </div>
              ) : (
                <div className="checkout-address-list">
                  {addresses.map((address) => {
                    const active = address.id === addressId;

                    return (
                      <label
                        key={address.id}
                        className={`checkout-address-card ${active ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          checked={active}
                          onChange={() => setAddressId(address.id)}
                        />

                        <span className="checkout-radio-dot" />

                        <div>
                          <div className="checkout-address-title">
                            <strong>{address.fullName}</strong>
                            {isAddressDefault(address.isDefault) ? <em>Mặc định</em> : null}
                          </div>

                          <p>☎ {address.phone}</p>
                          <p>{address.formattedAddress}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="checkout-section mochi-card">
              <div className="checkout-section-head">
                <div>
                  <h2>🧸 Sản phẩm trong đơn</h2>
                  <p>Mỗi shop sẽ được tách thành một đơn hàng riêng.</p>
                </div>
              </div>

              {previewLoading ? (
                <div className="checkout-loading-line">Đang tính lại đơn hàng...</div>
              ) : preview ? (
                <div className="checkout-shop-list">
                  {preview.orders.map((shopOrder) => (
                    <article key={shopOrder.shop.id} className="checkout-shop-card">
                      <div className="checkout-shop-head">
                        <div>
                          <h3>🏪 {shopOrder.shop.name}</h3>
                          <p>Khoảng cách giao hàng: {shopOrder.distanceKm.toFixed(1)} km</p>
                        </div>

                        <strong>{formatMoney(shopOrder.total)}</strong>
                      </div>

                      <div className="checkout-items">
                        {shopOrder.items.map((item) => (
                          <div key={item.id} className="checkout-item">
                            <img
                              src={item.imageUrl || bunnyImg}
                              alt={item.name}
                              onError={(event) => {
                                event.currentTarget.src = bunnyImg;
                              }}
                            />

                            <div>
                              <b>{item.name}</b>
                              <p>
                                {formatMoney(item.price)} × {item.quantity}
                              </p>
                            </div>

                            <strong>{formatMoney(item.totalLine)}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="checkout-shop-total">
                        <span>Tạm tính</span>
                        <b>{formatMoney(shopOrder.subtotal)}</b>
                      </div>

                      <div className="checkout-shop-total">
                        <span>Phí vận chuyển</span>
                        <b>{formatMoney(shopOrder.shippingFee)}</b>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="checkout-loading-line">Chưa có dữ liệu đơn hàng.</div>
              )}
            </section>
          </div>

          <aside className="checkout-summary mochi-card">
            <h2>♡ Xác nhận thanh toán</h2>

            <div className="checkout-summary-address">
              <span>Giao tới</span>
              <b>{selectedAddress?.fullName || preview?.address.fullName || 'Chưa chọn'}</b>
              <p>{selectedAddress?.formattedAddress || preview?.address.formattedAddress || ''}</p>
            </div>

            <div className="checkout-payment-methods">
              <label className={paymentMethod === 'COD' ? 'active' : ''}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <span>💵</span>
                <div>
                  <b>Thanh toán khi nhận hàng</b>
                  <p>Đặt đơn ngay, trả tiền khi nhận hàng.</p>
                </div>
              </label>

              <label className={paymentMethod === 'VNPAY' ? 'active' : ''}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                />
                <span>🏦</span>
                <div>
                  <b>Thanh toán VNPAY</b>
                  <p>Chuyển sang cổng thanh toán VNPAY.</p>
                </div>
              </label>
            </div>

            <label className="checkout-note-field">
              <span>Ghi chú cho đơn hàng</span>
              <textarea
                value={note}
                maxLength={255}
                placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            <div className="checkout-summary-row">
              <span>Tạm tính</span>
              <strong>{formatMoney(preview?.summary.subtotal ?? 0)}</strong>
            </div>

            <div className="checkout-summary-row">
              <span>Phí vận chuyển</span>
              <strong>{formatMoney(preview?.summary.shippingFee ?? 0)}</strong>
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-summary-total">
              <span>Tổng thanh toán</span>
              <strong>{formatMoney(preview?.summary.total ?? 0)}</strong>
            </div>

            <button
              type="button"
              className="mochi-btn mochi-btn-primary checkout-submit-btn"
              disabled={submitting || previewLoading || !preview || !addressId}
              onClick={handleCreateOrder}
            >
              {submitting
                ? 'Đang xử lý...'
                : paymentMethod === 'COD'
                  ? 'Đặt hàng COD'
                  : 'Thanh toán qua VNPAY'}
            </button>

            <Link to="/cart" className="checkout-back-link">
              ← Quay lại giỏ hàng
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}