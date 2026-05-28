import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiPhone } from "react-icons/fi";

import './AddressesPage.css';

import AccountSidebar from '../../components/account/AccountSidebar';
import LocationPicker from '../../components/address/LocationPicker';
import VietnamAddressSelector from '../../components/address/VietnamAddressSelector';

import { AddressesApi } from '../../api/addresses.api';
import type { Address, CreateAddressDto } from '../../api/types';

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

function getApiMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra, vui lòng thử lại.',
) {
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
    return message[0] || fallback;
  }

  return message || err.response?.data?.error || err.message || fallback;
}

function toNumberOrUndefined(value: string) {
  if (!value.trim()) return undefined;

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
  const icons = ['🏠', '🏢', '🏡', '📍'];
  return icons[index % icons.length];
}

/**
 * Backend đôi khi trả isDefault dạng:
 * - true / false
 * - 1 / 0
 * - "1" / "0"
 *
 * Không được dùng trực tiếp:
 * {address.isDefault && ...}
 *
 * Vì nếu isDefault = 0, React sẽ render số 0 ra UI.
 */
function isAddressDefault(value: unknown) {
  return value === true || value === 1 || value === '1';
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [actionKey, setActionKey] = useState<string | null>(null);

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => {
      const aDefault = isAddressDefault(a.isDefault);
      const bDefault = isAddressDefault(b.isDefault);

      if (aDefault === bDefault) {
        return b.id - a.id;
      }

      return aDefault ? -1 : 1;
    });
  }, [addresses]);

  useEffect(() => {
    void fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      setIsLoading(true);
      setPageError('');

      const data = await AddressesApi.list();
      setAddresses(data);
    } catch (error) {
      setPageError(getApiMessage(error, 'Không thể tải danh sách địa chỉ.'));
    } finally {
      setIsLoading(false);
    }
  }

  function updateField<K extends keyof AddressFormState>(
    key: K,
    value: AddressFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function openCreateModal() {
    setEditingAddress(null);
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    });
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(address: Address) {
    setEditingAddress(address);

    setForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      formattedAddress: address.formattedAddress || '',
      placeId: address.placeId || '',
      lat: address.lat || '',
      lng: address.lng || '',
      isDefault: isAddressDefault(address.isDefault),
    });

    setFormError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingAddress(null);
    setForm(emptyForm);
    setFormError('');
  }

  function buildSubmitDto(): CreateAddressDto {
    const dto: CreateAddressDto = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      formattedAddress: form.formattedAddress.trim(),
      isDefault: form.isDefault,
    };

    const placeId = form.placeId.trim();
    if (placeId) {
      dto.placeId = placeId;
    }

    const lat = toNumberOrUndefined(form.lat);
    const lng = toNumberOrUndefined(form.lng);

    if (lat !== undefined && lng !== undefined) {
      dto.lat = lat;
      dto.lng = lng;
    }

    return dto;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setFormError('Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (!form.phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!form.formattedAddress.trim()) {
      setFormError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');

      const dto = buildSubmitDto();

      if (editingAddress) {
        await AddressesApi.update(editingAddress.id, dto);
      } else {
        await AddressesApi.create(dto);
      }

      await fetchAddresses();
      closeModal();
    } catch (error) {
      setFormError(getApiMessage(error, 'Không thể lưu địa chỉ.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault(address: Address) {
    if (isAddressDefault(address.isDefault)) return;

    try {
      setActionKey(`default-${address.id}`);
      setPageError('');

      await AddressesApi.setDefault(address.id);
      await fetchAddresses();
    } catch (error) {
      setPageError(getApiMessage(error, 'Không thể đặt địa chỉ mặc định.'));
    } finally {
      setActionKey(null);
    }
  }

  async function handleDelete(address: Address) {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa địa chỉ của ${address.fullName}?`,
    );

    if (!ok) return;

    try {
      setActionKey(`delete-${address.id}`);
      setPageError('');

      await AddressesApi.remove(address.id);
      await fetchAddresses();
    } catch (error) {
      setPageError(getApiMessage(error, 'Không thể xóa địa chỉ.'));
    } finally {
      setActionKey(null);
    }
  }

  return (
    <div className="mochi-page me-page addresses-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>›</span>
          <Link to="/me">Tài khoản của tôi</Link>
          <span>›</span>
          <strong>Địa chỉ của tôi</strong>
        </div>

        <div className="me-layout addresses-layout">
          <aside className="me-sidebar">
            <AccountSidebar />
          </aside>

          <main className="me-main">
            <section className="mochi-card addresses-panel">
              <div className="addresses-panel-head">
                <div className="addresses-title-block">
                  <div className="addresses-title-icon">📍</div>

                  <div>
                    <h1>Địa chỉ của tôi</h1>
                    <p>Quản lý địa chỉ giao hàng của bạn ♡</p>
                  </div>
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
                <div className="addresses-alert addresses-alert-error">
                  {pageError}
                </div>
              )}

              {isLoading ? (
                <div className="addresses-loading">
                  <div className="addresses-spinner" />
                  <p>Đang tải danh sách địa chỉ...</p>
                </div>
              ) : sortedAddresses.length === 0 ? (
                <div className="addresses-empty">
                  <div className="addresses-empty-icon">🏠</div>

                  <h2>Bạn chưa có địa chỉ giao hàng</h2>

                  <p>Thêm địa chỉ để quá trình đặt hàng nhanh hơn nhé.</p>

                  <button type="button" onClick={openCreateModal}>
                    Thêm địa chỉ đầu tiên
                  </button>
                </div>
              ) : (
                <div className="addresses-list">
                  {sortedAddresses.map((address, index) => {
                    const defaultAddress = isAddressDefault(address.isDefault);

                    return (
                      <article
                        key={address.id}
                        className={
                          defaultAddress
                            ? 'address-card address-card-default'
                            : 'address-card'
                        }
                      >
                        {defaultAddress ? (
                          <span className="address-card-badge">Mặc định</span>
                        ) : null}

                        <div className="address-card-icon">
                          {getAddressIcon(index)}
                        </div>

                        <div className="address-card-body">
                          <div className="address-card-name-row">
                            <h2>{address.fullName}</h2>

                            {defaultAddress ? (
                              <span className="address-default-pill">
                                Mặc định
                              </span>
                            ) : null}
                          </div>

                          <p className="address-card-line">
                            <span className="address-card-line-icon">
                              <FiPhone />
                            </span>

                            <span className="address-card-text">
                              {address.phone}
                            </span>
                          </p>

                          <p className="address-card-line">
                            <span className="address-card-line-icon">
                              <FiMapPin />
                            </span>

                            <span className="address-card-text">
                              {address.formattedAddress}
                            </span>
                          </p>

                          <p className="address-card-coords">
                            <span>Tọa độ:</span>{' '}
                            <strong>
                              {formatCoord(address.lat)},{' '}
                              {formatCoord(address.lng)}
                            </strong>
                          </p>
                        </div>

                        <div className="address-card-actions">
                          <button
                            type="button"
                            className="address-action-btn address-action-default"
                            disabled={
                              defaultAddress ||
                              actionKey === `default-${address.id}`
                            }
                            onClick={() => void handleSetDefault(address)}
                          >
                            ☆{' '}
                            {actionKey === `default-${address.id}`
                              ? 'Đang đặt...'
                              : 'Đặt mặc định'}
                          </button>

                          <button
                            type="button"
                            className="address-action-btn"
                            disabled={actionKey !== null}
                            onClick={() => openEditModal(address)}
                          >
                            ✎ Sửa
                          </button>

                          <button
                            type="button"
                            className="address-action-btn address-action-danger"
                            disabled={actionKey === `delete-${address.id}`}
                            onClick={() => void handleDelete(address)}
                          >
                            🗑{' '}
                            {actionKey === `delete-${address.id}`
                              ? 'Đang xóa...'
                              : 'Xóa'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>

        <section className="addresses-benefits">
          <div className="addresses-benefit-item">
            <span>🚚</span>
            <div>
              <strong>Miễn phí vận chuyển</strong>
              <small>Cho đơn từ 300k</small>
            </div>
          </div>

          <div className="addresses-benefit-item">
            <span>🔄</span>
            <div>
              <strong>Đổi trả dễ dàng</strong>
              <small>Trong vòng 7 ngày</small>
            </div>
          </div>

          <div className="addresses-benefit-item">
            <span>🔒</span>
            <div>
              <strong>Thanh toán an toàn</strong>
              <small>Bảo mật tuyệt đối</small>
            </div>
          </div>

          <div className="addresses-benefit-item">
            <span>🎧</span>
            <div>
              <strong>Hỗ trợ 24/7</strong>
              <small>Luôn sẵn sàng hỗ trợ</small>
            </div>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="addresses-modal-backdrop">
          <div className="addresses-modal" role="dialog" aria-modal="true">
            <div className="addresses-modal-head">
              <div>
                <h2>{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>

                <p>
                  {editingAddress
                    ? 'Cập nhật lại thông tin giao hàng của bạn.'
                    : 'Nhập địa chỉ để Mochi giao hàng chính xác hơn.'}
                </p>
              </div>

              <button type="button" onClick={closeModal} disabled={isSaving}>
                ×
              </button>
            </div>

            <form className="addresses-form" onSubmit={handleSubmit}>
              {formError && (
                <div className="addresses-alert addresses-alert-error">
                  {formError}
                </div>
              )}

              <div className="addresses-form-grid">
                <label className="addresses-form-group">
                  <span>Họ tên người nhận</span>

                  <input
                    value={form.fullName}
                    onChange={(event) =>
                      updateField('fullName', event.target.value)
                    }
                    placeholder="Ví dụ: Quốc Hiệp"
                    maxLength={120}
                  />
                </label>

                <label className="addresses-form-group">
                  <span>Số điện thoại</span>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField('phone', event.target.value)
                    }
                    placeholder="số điện thoại có 10 chữ số, bắt đầu bằng 0"
                    maxLength={20}
                  />
                </label>
              </div>

              <div className="addresses-form-group">
                <span>Chọn tỉnh / quận / phường</span>

                <VietnamAddressSelector
                  fullAddress={form.formattedAddress}
                  onFullAddressChange={(value) =>
                    updateField('formattedAddress', value)
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
                  value={form.formattedAddress}
                  onChange={(event) =>
                    updateField('formattedAddress', event.target.value)
                  }
                  placeholder="Chỉ cần nhập địa chỉ đây đủ để shipper có thể giao hàng, không cần ghi thêm tỉnh/quận/phường"
                  maxLength={300}
                />
              </label>

              {/* <div className="addresses-form-grid">
                <label className="addresses-form-group">
                  <span>Latitude</span>

                  <input
                    value={form.lat}
                    onChange={(event) => updateField('lat', event.target.value)}
                    placeholder="10.801234"
                  />
                </label>

                <label className="addresses-form-group">
                  <span>Longitude</span>

                  <input
                    value={form.lng}
                    onChange={(event) => updateField('lng', event.target.value)}
                    placeholder="106.669867"
                  />
                </label>
              </div> */}

              <div className="addresses-map-wrap">
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

              <label className="addresses-default-check">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateField('isDefault', event.target.checked)
                  }
                />

                <span>Đặt làm địa chỉ mặc định</span>
              </label>

              <div className="addresses-modal-actions">
                <button
                  type="button"
                  className="addresses-cancel-btn"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="addresses-save-btn"
                  disabled={isSaving}
                >
                  {isSaving
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