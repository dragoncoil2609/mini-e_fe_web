import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressesApi } from '../../api/addresses.api';
import type {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
} from '../../api/types';
import './AddressesPage.css';

import VietnamAddressSelector from '../../components/VietnamAddressSelector';
import LocationPicker from '../../components/LocationPicker';

export default function AddressesPage() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSession, setFormSession] = useState(0);

  const [formData, setFormData] = useState<CreateAddressDto>({
    fullName: '',
    phone: '',
    formattedAddress: '',
    lat: undefined,
    lng: undefined,
    isDefault: false,
  });

  useEffect(() => {
    void loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    setError(null);

    try {
      const list = await AddressesApi.list();
      setAddresses(list);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Không tải được danh sách địa chỉ. Vui lòng đăng nhập.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      formattedAddress: '',
      lat: undefined,
      lng: undefined,
      isDefault: false,
    });
    setEditingId(null);
    setFormSession((value) => value + 1);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
    setError(null);
    setMessage(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
    setError(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelectorChange = (fullAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      formattedAddress: fullAddress,
    }));
  };

  const handleSelectorLatLngChange = (latStr: string, lngStr: string) => {
    const latNum = Number.parseFloat(latStr);
    const lngNum = Number.parseFloat(lngStr);

    if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
      setFormData((prev) => ({
        ...prev,
        lat: latNum,
        lng: lngNum,
      }));
    }
  };

  const handleMapLocationChange = (coords: { lat?: string; lng?: string }) => {
    if (!coords.lat || !coords.lng) return;

    const latNum = Number.parseFloat(coords.lat);
    const lngNum = Number.parseFloat(coords.lng);

    if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
      setFormData((prev) => ({
        ...prev,
        lat: latNum,
        lng: lngNum,
      }));
    }
  };

  const validate = () => {
    if (!formData.fullName?.trim()) {
      return 'Vui lòng nhập họ và tên.';
    }

    if (formData.fullName.trim().length > 120) {
      return 'Họ và tên tối đa 120 ký tự.';
    }

    if (!formData.phone?.trim()) {
      return 'Vui lòng nhập số điện thoại.';
    }

    if (!/^(?:\+?84|0)\d{9,10}$/.test(formData.phone.trim())) {
      return 'Số điện thoại không hợp lệ.';
    }

    if (
      !formData.formattedAddress?.trim() ||
      formData.formattedAddress.trim().length < 5
    ) {
      return 'Vui lòng chọn địa chỉ đầy đủ.';
    }

    return null;
  };

  const handleCreate = async () => {
    const validateMessage = validate();
    if (validateMessage) {
      setError(validateMessage);
      return;
    }

    setUpdating((prev) => new Set(prev).add(-1));
    setError(null);
    setMessage(null);

    try {
      const payload: CreateAddressDto = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        formattedAddress: formData.formattedAddress.trim(),
        lat: formData.lat,
        lng: formData.lng,
        isDefault: !!formData.isDefault,
      };

      await AddressesApi.create(payload);

      setMessage('Đã thêm địa chỉ mới thành công.');
      setShowForm(false);
      resetForm();
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Thêm địa chỉ thất bại. Vui lòng thử lại.',
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(-1);
        return next;
      });
    }
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    const validateMessage = validate();
    if (validateMessage) {
      setError(validateMessage);
      return;
    }

    setUpdating((prev) => new Set(prev).add(editingId));
    setError(null);
    setMessage(null);

    try {
      const payload: UpdateAddressDto = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        formattedAddress: formData.formattedAddress.trim(),
        lat: formData.lat,
        lng: formData.lng,
        isDefault: !!formData.isDefault,
      };

      await AddressesApi.update(editingId, payload);

      setMessage('Đã cập nhật địa chỉ thành công.');
      setShowForm(false);
      resetForm();
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Cập nhật địa chỉ thất bại. Vui lòng thử lại.',
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(editingId);
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId != null) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormSession((value) => value + 1);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      formattedAddress: address.formattedAddress,
      lat: address.lat ? Number.parseFloat(address.lat) : undefined,
      lng: address.lng ? Number.parseFloat(address.lng) : undefined,
      isDefault: address.isDefault,
    });
    setShowForm(true);
    setError(null);
    setMessage(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    setUpdating((prev) => new Set(prev).add(id));
    setError(null);

    try {
      const result = await AddressesApi.remove(id);

      if (!result.success) {
        setError('Xóa địa chỉ thất bại.');
        return;
      }

      setMessage('Đã xóa địa chỉ thành công.');
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xóa địa chỉ thất bại.');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    setUpdating((prev) => new Set(prev).add(id));
    setError(null);

    try {
      const result = await AddressesApi.setDefault(id);

      if (!result.success) {
        setError('Đặt mặc định thất bại.');
        return;
      }

      setMessage('Đã đặt địa chỉ mặc định.');
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Đặt mặc định thất bại.');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="addresses-container">
        <div className="addresses-card">
          <div className="addresses-loading">Đang tải danh sách địa chỉ...</div>
        </div>
      </div>
    );
  }

  const currentUpdatingKey = editingId ?? -1;

  return (
    <div className="addresses-container">
      <div className="addresses-card">
        <div className="addresses-topbar">
          <button
            type="button"
            className="addresses-back-button"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>

        <div className="addresses-header">
          <div className="addresses-icon">📍</div>
          <h1 className="addresses-title">Địa chỉ của tôi</h1>
          <p className="addresses-subtitle">
            Quản lý địa chỉ giao hàng để đặt hàng nhanh hơn và chính xác hơn.
          </p>
        </div>

        {error && <div className="addresses-error">{error}</div>}
        {message && <div className="addresses-message">{message}</div>}

        {!showForm && (
          <button
            type="button"
            onClick={openCreateForm}
            className="addresses-add-button"
          >
            + Thêm địa chỉ mới
          </button>
        )}

        {showForm && (
          <div className="addresses-form-section">
            <h2 className="addresses-form-title">
              {editingId != null ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>

            <form onSubmit={handleSubmit} className="addresses-form">
              <div className="addresses-form-row">
                <div className="addresses-form-group">
                  <label className="addresses-form-label">Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    maxLength={120}
                    className="addresses-form-input"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="addresses-form-group">
                  <label className="addresses-form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    pattern="^(?:\+?84|0)\d{9,10}$"
                    className="addresses-form-input"
                    placeholder="0912..."
                  />
                </div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-label">Địa chỉ nhận hàng *</label>

                <VietnamAddressSelector
                  key={`selector-${formSession}`}
                  fullAddress={formData.formattedAddress}
                  onFullAddressChange={handleAddressSelectorChange}
                  onLatLngChange={handleSelectorLatLngChange}
                />

                <div className="addresses-selected-address">
                  Địa chỉ đã chọn: <span>{formData.formattedAddress || '(Chưa chọn)'}</span>
                </div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-label">Vị trí trên bản đồ</label>

                <div className="addresses-map-wrapper">
                  <LocationPicker
                    key={`map-${formSession}`}
                    address={formData.formattedAddress}
                    lat={
                      formData.lat !== undefined && formData.lat !== null
                        ? String(formData.lat)
                        : ''
                    }
                    lng={
                      formData.lng !== undefined && formData.lng !== null
                        ? String(formData.lng)
                        : ''
                    }
                    onChange={handleMapLocationChange}
                  />
                </div>

                <div className="addresses-map-hint">
                  Chọn tỉnh/quận/phường sẽ làm bản đồ tự nhảy theo khu vực. Bạn cũng có
                  thể click hoặc kéo marker để chỉnh vị trí chính xác hơn.
                </div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-checkbox-label">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={!!formData.isDefault}
                    onChange={handleInputChange}
                    className="addresses-form-checkbox"
                  />
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="addresses-form-actions">
                <button
                  type="submit"
                  disabled={updating.has(currentUpdatingKey)}
                  className="addresses-form-submit"
                >
                  {updating.has(currentUpdatingKey)
                    ? 'Đang xử lý...'
                    : editingId != null
                    ? 'Cập nhật'
                    : 'Thêm mới'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={updating.has(currentUpdatingKey)}
                  className="addresses-form-cancel"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {addresses.length === 0 && !showForm && (
          <div className="addresses-empty">
            <p>Bạn chưa có địa chỉ nào.</p>
            <small>Hãy thêm một địa chỉ để bắt đầu mua sắm.</small>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="addresses-list">
            {addresses.map((address) => {
              const isUpdating = updating.has(address.id);

              return (
                <div
                  key={address.id}
                  className={`addresses-item ${
                    address.isDefault ? 'addresses-item-default' : ''
                  }`}
                >
                  {address.isDefault && (
                    <div className="addresses-item-badge">Mặc định</div>
                  )}

                  <div className="addresses-item-content">
                    <div className="addresses-item-name">{address.fullName}</div>
                    <div className="addresses-item-phone">{address.phone}</div>
                    <div className="addresses-item-address">
                      {address.formattedAddress}
                    </div>

                    {(address.lat || address.lng) && (
                      <div className="addresses-item-coords">
                        lat: {address.lat} – lng: {address.lng}
                      </div>
                    )}
                  </div>

                  <div className="addresses-item-actions">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => void handleSetDefault(address.id)}
                        disabled={isUpdating}
                        className="addresses-action-button addresses-action-default"
                      >
                        Đặt mặc định
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEdit(address)}
                      disabled={isUpdating}
                      className="addresses-action-button addresses-action-edit"
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(address.id)}
                      disabled={isUpdating}
                      className="addresses-action-button addresses-action-delete"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}