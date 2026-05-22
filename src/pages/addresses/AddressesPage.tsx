import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import { AddressesApi } from '../../api/addresses.api';
import type { Address, CreateAddressDto } from '../../api/types';
import VietnamAddressSelector from '../../components/address/VietnamAddressSelector';
import LocationPicker from '../../components/address/LocationPicker';

import bunnyBear from '../../assets/brand/bunny_bear_original.png';

import './AddressesPage.css';

interface AddressFormState {
  fullName: string;
  phone: string;
  formattedAddress: string;
  placeId: string;
  lat: string;
  lng: string;
  isDefault: boolean;
}

const emptyForm: AddressFormState = {
  fullName: '',
  phone: '',
  formattedAddress: '',
  placeId: '',
  lat: '',
  lng: '',
  isDefault: false,
};

const accountMenus = [
  { label: 'Tổng quan', icon: '▦', href: '/me' },
  { label: 'Thông tin cá nhân', icon: '♙', href: '/me' },
  { label: 'Địa chỉ của tôi', icon: '●', href: '/addresses', active: true },
  { label: 'Đơn hàng của tôi', icon: '▣', href: '/orders' },
  { label: 'Sản phẩm yêu thích', icon: '♡', href: '/favorites' },
  { label: 'Voucher của tôi', icon: '✿', href: '/vouchers' },
  { label: 'Đổi mật khẩu', icon: '▤', href: '/change-password' },
  { label: 'Đăng xuất', icon: '↪', href: '/login' },
];

const navMenus = [
  { label: 'Trang chủ', icon: '⌂', href: '/home' },
  { label: 'Sản phẩm', icon: '♧', href: '/products' },
  { label: 'Gấu bông', icon: 'ʕ•ᴥ•ʔ', href: '/products' },
  { label: 'Văn phòng phẩm', icon: '✎', href: '/products' },
  { label: 'Phụ kiện', icon: '☆', href: '/products' },
  { label: 'Đồ dùng', icon: '▣', href: '/products' },
  { label: 'Quà tặng', icon: '🎁', href: '/products' },
  { label: 'Khuyến mãi', icon: '◈', href: '/products' },
];

function getErrorMessage(error: unknown) {
  const err = error as {
    response?: {
      data?: {
        message?: string | string[];
        error?: string;
      };
    };
    message?: string;
  };

  const message = err.response?.data?.message;

  if (Array.isArray(message)) {
    return message[0] || 'Có lỗi xảy ra, vui lòng thử lại.';
  }

  return (
    message ||
    err.response?.data?.error ||
    err.message ||
    'Có lỗi xảy ra, vui lòng thử lại.'
  );
}

function toNumberOrUndefined(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function formatCoord(value?: string | null) {
  if (!value) return '-';

  const num = Number(value);
  if (!Number.isFinite(num)) return value;

  return num.toFixed(6);
}

function getAddressIcon(index: number) {
  const icons = ['⌂', '▥', '⌘', '◇'];
  return icons[index % icons.length];
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [actionKey, setActionKey] = useState<string | null>(null);

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => {
      if (a.isDefault === b.isDefault) return b.id - a.id;
      return a.isDefault ? -1 : 1;
    });
  }, [addresses]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setPageError('');

      const data = await AddressesApi.list();
      setAddresses(data);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddress(null);
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      formattedAddress: address.formattedAddress || '',
      placeId: address.placeId || '',
      lat: address.lat || '',
      lng: address.lng || '',
      isDefault: address.isDefault,
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingAddress(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const formattedAddress = form.formattedAddress.trim();
    const placeId = form.placeId.trim();

    if (!fullName) {
      setFormError('Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (!phone) {
      setFormError('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!formattedAddress) {
      setFormError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    const dto: CreateAddressDto = {
      fullName,
      phone,
      formattedAddress,
    };

    if (placeId) {
      dto.placeId = placeId;
    }

    const lat = toNumberOrUndefined(form.lat);
    const lng = toNumberOrUndefined(form.lng);

    if (lat !== undefined && lng !== undefined) {
      dto.lat = lat;
      dto.lng = lng;
    }

    if (form.isDefault) {
      dto.isDefault = true;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingAddress) {
        await AddressesApi.update(editingAddress.id, dto);
      } else {
        await AddressesApi.create(dto);
      }

      await loadAddresses();
      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) return;

    try {
      setActionKey(`default-${address.id}`);
      await AddressesApi.setDefault(address.id);
      await loadAddresses();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setActionKey(null);
    }
  };

  const handleDelete = async (address: Address) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa địa chỉ của ${address.fullName}?`);
    if (!ok) return;

    try {
      setActionKey(`delete-${address.id}`);
      await AddressesApi.remove(address.id);
      await loadAddresses();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setActionKey(null);
    }
  };

  return (
    <div className="addresses-page">
      <div className="addresses-top-ribbon">
        <div className="addresses-top-ribbon__item">
          <span>▱</span>
          Miễn phí vận chuyển cho đơn hàng từ 300k
        </div>

        <div className="addresses-top-ribbon__item">
          <span>↺</span>
          Đổi trả trong 7 ngày
        </div>

        <div className="addresses-top-ribbon__right">
          <span>♡ Hỗ trợ</span>
          <span>ⓘ Câu hỏi thường gặp</span>
        </div>
      </div>

      <header className="addresses-header">
        <div className="addresses-container addresses-header__inner">
          <Link to="/home" className="addresses-logo">
            <span className="addresses-logo__mascot">
              <img src={bunnyBear} alt="Mochi" />
            </span>

            <span>
              <strong>Mochi</strong>
              <small>Cute things for you ♡</small>
            </span>
          </Link>

          <div className="addresses-search">
            <input placeholder="Bạn tìm gì hôm nay?" />
            <button type="button">⌕</button>
          </div>

          <div className="addresses-header-actions">
            <Link to="/me" className="addresses-header-action">
              <span>♙</span>
              Tài khoản
            </Link>

            <Link to="/cart" className="addresses-header-action addresses-cart-link">
              <span>🛒</span>
              Giỏ hàng
              <b>2</b>
            </Link>
          </div>
        </div>

        <nav className="addresses-container addresses-nav">
          {navMenus.map((item) => (
            <Link key={item.label} to={item.href} className="addresses-nav__item">
              <span>{item.icon}</span>
              {item.label}
              {item.label === 'Sản phẩm' && <small>⌄</small>}
            </Link>
          ))}
        </nav>
      </header>

      <main className="addresses-container addresses-main">
        <div className="addresses-breadcrumb">
          <Link to="/home">← Trang chủ</Link>
          <span>›</span>
          <Link to="/me">Tài khoản của tôi</Link>
          <span>›</span>
          <strong>Địa chỉ của tôi</strong>
        </div>

        <div className="addresses-layout">
          <aside className="addresses-sidebar">
            <div className="addresses-sidebar__title">
              <span>♙</span>
              <strong>Tài khoản của tôi</strong>
            </div>

            <div className="addresses-sidebar__menu">
              {accountMenus.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`addresses-sidebar__link ${
                    item.active ? 'addresses-sidebar__link--active' : ''
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="addresses-sidebar__mascot">
              <img src={bunnyBear} alt="Mochi mascot" />
            </div>
          </aside>

          <section className="addresses-content-card">
            <div className="addresses-content-head">
              <div className="addresses-content-head__icon">●</div>

              <div>
                <h1>Địa chỉ của tôi</h1>
                <p>Quản lý địa chỉ giao hàng của bạn <span>♥</span></p>
              </div>

              <button
                type="button"
                className="addresses-add-btn"
                onClick={openCreateModal}
              >
                <span>＋</span>
                Thêm địa chỉ mới
              </button>
            </div>

            {pageError && (
              <div className="addresses-alert addresses-alert--error">
                {pageError}
              </div>
            )}

            {loading ? (
              <div className="addresses-loading">
                <div className="addresses-loading__spinner" />
                Đang tải danh sách địa chỉ...
              </div>
            ) : sortedAddresses.length === 0 ? (
              <div className="addresses-empty">
                <div>⌂</div>
                <h3>Bạn chưa có địa chỉ giao hàng</h3>
                <p>Thêm địa chỉ để quá trình đặt hàng nhanh hơn nhé.</p>
                <button type="button" onClick={openCreateModal}>
                  Thêm địa chỉ đầu tiên
                </button>
              </div>
            ) : (
              <div className="addresses-list">
                {sortedAddresses.map((address, index) => (
                  <article
                    key={address.id}
                    className={`addresses-card ${
                      address.isDefault ? 'addresses-card--default' : ''
                    }`}
                  >
                    {address.isDefault && (
                      <span className="addresses-card__corner-badge">Mặc định</span>
                    )}

                    <div className="addresses-card__icon">
                      {getAddressIcon(index)}
                    </div>

                    <div className="addresses-card__body">
                      <div className="addresses-card__name-row">
                        <h2>{address.fullName}</h2>

                        {address.isDefault && (
                          <span className="addresses-default-pill">Mặc định</span>
                        )}
                      </div>

                      <p className="addresses-card__line">
                        <span>♧</span>
                        {address.phone}
                      </p>

                      <p className="addresses-card__line">
                        <span>⌖</span>
                        {address.formattedAddress}
                      </p>

                      <p className="addresses-card__coords">
                        Tọa độ:{' '}
                        <strong>
                          {formatCoord(address.lat)}, {formatCoord(address.lng)}
                        </strong>
                      </p>
                    </div>

                    <div className="addresses-card__actions">
                      <button
                        type="button"
                        className="addresses-action-btn addresses-action-btn--default"
                        disabled={address.isDefault || actionKey === `default-${address.id}`}
                        onClick={() => void handleSetDefault(address)}
                      >
                        ☆{' '}
                        {actionKey === `default-${address.id}`
                          ? 'Đang đặt...'
                          : 'Đặt mặc định'}
                      </button>

                      <button
                        type="button"
                        className="addresses-action-btn"
                        disabled={actionKey !== null}
                        onClick={() => openEditModal(address)}
                      >
                        ✎ Sửa
                      </button>

                      <button
                        type="button"
                        className="addresses-action-btn addresses-action-btn--danger"
                        disabled={actionKey === `delete-${address.id}`}
                        onClick={() => void handleDelete(address)}
                      >
                        🗑{' '}
                        {actionKey === `delete-${address.id}` ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="addresses-benefits">
          <div>
            <span>▱</span>
            <strong>Miễn phí vận chuyển</strong>
            <small>Cho đơn từ 300k</small>
          </div>

          <div>
            <span>↻</span>
            <strong>Đổi trả dễ dàng</strong>
            <small>Trong vòng 7 ngày</small>
          </div>

          <div>
            <span>▣</span>
            <strong>Thanh toán an toàn</strong>
            <small>Bảo mật tuyệt đối</small>
          </div>

          <div>
            <span>☊</span>
            <strong>Hỗ trợ 24/7</strong>
            <small>Luôn sẵn sàng hỗ trợ</small>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="addresses-modal-backdrop" role="presentation">
          <div className="addresses-modal" role="dialog" aria-modal="true">
            <div className="addresses-modal__head">
              <div>
                <h2>{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
                <p>
                  {editingAddress
                    ? 'Cập nhật lại thông tin giao hàng của bạn.'
                    : 'Nhập địa chỉ để Mochi giao hàng chính xác hơn.'}
                </p>
              </div>

              <button type="button" onClick={closeModal} disabled={saving}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="addresses-form">
              {formError && (
                <div className="addresses-alert addresses-alert--error">
                  {formError}
                </div>
              )}

              <div className="addresses-form-grid">
                <label className="addresses-form-group">
                  <span>Họ tên người nhận</span>
                  <input
                    className="addresses-form-input"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Nguyễn Thảo"
                    maxLength={120}
                  />
                </label>

                <label className="addresses-form-group">
                  <span>Số điện thoại</span>
                  <input
                    className="addresses-form-input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: 0339420356"
                    maxLength={20}
                  />
                </label>
              </div>

              <div className="addresses-form-group">
                <span>Địa chỉ giao hàng</span>

                <VietnamAddressSelector
                  fullAddress={form.formattedAddress}
                  onFullAddressChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      formattedAddress: value,
                    }))
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((prev) => ({
                      ...prev,
                      lat,
                      lng,
                    }))
                  }
                />
              </div>

              <label className="addresses-form-group">
                <span>Địa chỉ đầy đủ</span>
                <textarea
                  className="addresses-form-input addresses-form-textarea"
                  value={form.formattedAddress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      formattedAddress: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 123 Đường Hoa Hồng, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh"
                  maxLength={300}
                />
              </label>

              <div className="addresses-form-grid">
                <label className="addresses-form-group">
                  <span>Latitude</span>
                  <input
                    className="addresses-form-input"
                    value={form.lat}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lat: e.target.value,
                      }))
                    }
                    placeholder="10.801234"
                  />
                </label>

                <label className="addresses-form-group">
                  <span>Longitude</span>
                  <input
                    className="addresses-form-input"
                    value={form.lng}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lng: e.target.value,
                      }))
                    }
                    placeholder="106.669867"
                  />
                </label>
              </div>

              <div className="addresses-map-box">
                <LocationPicker
                  address={form.formattedAddress}
                  lat={form.lat}
                  lng={form.lng}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      lat: value.lat ?? prev.lat,
                      lng: value.lng ?? prev.lng,
                    }))
                  }
                />
              </div>

              <label className="addresses-check">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isDefault: e.target.checked,
                    }))
                  }
                />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>

              <div className="addresses-modal__actions">
                <button
                  type="button"
                  className="addresses-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="addresses-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingAddress
                    ? 'Lưu thay đổi'
                    : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}