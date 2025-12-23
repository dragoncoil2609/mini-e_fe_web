// src/pages/addresses/AddressesPage.tsx
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

// Import 2 component chọn địa chỉ của bạn
import VietnamAddressSelector from '../../components/VietnamAddressSelector';
import LocationPicker from '../../components/LocationPicker';

export default function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form controls
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateAddressDto>({
    fullName: '',
    phone: '',
    formattedAddress: '',
    placeId: '',
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
    setMessage(null);
    try {
      const res = await AddressesApi.list();
      if (res.success) {
        setAddresses(res.data);
      } else {
        setError(
          res.message || 'Không tải được danh sách địa chỉ.',
        );
      }
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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- XỬ LÝ SỰ KIỆN TỪ COMPONENT CON ---

  // 1. Khi chọn Tỉnh/Huyện/Xã -> Cập nhật chuỗi địa chỉ
  const handleAddressSelectorChange = (fullAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      formattedAddress: fullAddress,
    }));
  };

  // 2. Khi Selector gợi ý tọa độ (từ Nominatim)
  const handleSelectorLatLngChange = (
    latStr: string,
    lngStr: string,
  ) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      setFormData((prev) => ({ ...prev, lat, lng }));
    }
  };

  // 3. Khi kéo thả/click trên bản đồ LocationPicker
  const handleMapLocationChange = (coords: {
    lat?: string;
    lng?: string;
  }) => {
    if (coords.lat && coords.lng) {
      const lat = parseFloat(coords.lat);
      const lng = parseFloat(coords.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormData((prev) => ({ ...prev, lat, lng }));
      }
    }
  };

  // ----------------------------------------

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    // Validate cơ bản
    if (
      !formData.formattedAddress ||
      formData.formattedAddress.length < 5
    ) {
      setError(
        'Vui lòng chọn địa chỉ đầy đủ (Tỉnh/Huyện/Xã + địa chỉ chi tiết).',
      );
      return;
    }

    setUpdating((prev) => new Set(prev).add(-1));
    setError(null);
    setMessage(null);

    try {
      const res = await AddressesApi.create(formData);
      if (res.success) {
        setMessage('Đã thêm địa chỉ mới thành công.');
        setShowForm(false);
        resetForm();
        await loadAddresses();
      } else {
        setError(res.message || 'Thêm địa chỉ thất bại.');
      }
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
    if (!editingId) return;

    setUpdating((prev) => new Set(prev).add(editingId));
    setError(null);
    setMessage(null);

    try {
      const updateDto: UpdateAddressDto = {
        fullName: formData.fullName,
        phone: formData.phone,
        formattedAddress: formData.formattedAddress,
        placeId: formData.placeId,
        lat: formData.lat,
        lng: formData.lng,
      };

      const res = await AddressesApi.update(editingId, updateDto);
      if (res.success) {
        setMessage('Đã cập nhật địa chỉ thành công.');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        await loadAddresses();
      } else {
        setError(
          res.message || 'Cập nhật địa chỉ thất bại.',
        );
      }
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

  const handleEdit = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      formattedAddress: address.formattedAddress,
      placeId: address.placeId || '',
      lat: address.lat ? parseFloat(address.lat) : undefined,
      lng: address.lng ? parseFloat(address.lng) : undefined,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
    setError(null);
    setMessage(null);

    // Lưu ý: VietnamAddressSelector hiện tại chỉ nhận output chuỗi,
    // nên khi Edit, dropdown Tỉnh/Huyện sẽ chưa tự select lại ID cũ
    // (logic 1 chiều). Người dùng vẫn thấy địa chỉ text và có thể chọn lại nếu cần.
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    setUpdating((prev) => new Set(prev).add(id));
    try {
      const res = await AddressesApi.remove(id);
      if (res.success) {
        setMessage('Đã xóa địa chỉ thành công.');
        await loadAddresses();
      } else {
        setError(res.message || 'Xóa địa chỉ thất bại.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Xóa thất bại.',
      );
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
    try {
      const res = await AddressesApi.setDefault(id);
      if (res.success) {
        setMessage('Đã đặt địa chỉ làm mặc định.');
        await loadAddresses();
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Lỗi đặt mặc định.',
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      formattedAddress: '',
      placeId: '',
      lat: undefined,
      lng: undefined,
      isDefault: false,
    });
    setEditingId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
    setError(null);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="addresses-container">
        <div className="addresses-card">
          <div className="addresses-loading">
            Đang tải danh sách địa chỉ...
          </div>
        </div>
      </div>
    );
  }

  const currentUpdatingKey = editingId ?? -1;

  return (
    <div className="addresses-container">
      <div className="addresses-card">
        {/* Top bar */}
        <div className="addresses-topbar">
          <button
            type="button"
            className="addresses-back-button"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>

        {/* Header */}
        <div className="addresses-header">
          <div className="addresses-icon">📍</div>
          <h1 className="addresses-title">Địa chỉ của tôi</h1>
          <p className="addresses-subtitle">
            Quản lý địa chỉ giao hàng để đặt hàng nhanh hơn và chính
            xác hơn.
          </p>
        </div>

        {error && (
          <div className="addresses-error">{error}</div>
        )}
        {message && (
          <div className="addresses-message">{message}</div>
        )}

        {/* Nút thêm mới */}
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className="addresses-add-button"
          >
            + Thêm địa chỉ mới
          </button>
        )}

        {/* Form thêm / sửa */}
        {showForm && (
          <div className="addresses-form-section">
            <h2 className="addresses-form-title">
              {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="addresses-form"
            >
              {/* Họ tên & Phone */}
              <div className="addresses-form-row">
                <div className="addresses-form-group">
                  <label className="addresses-form-label">
                    Họ và tên *
                  </label>
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
                  <label className="addresses-form-label">
                    Số điện thoại *
                  </label>
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

              {/* Tích hợp Selector */}
              <div className="addresses-form-group">
                <label className="addresses-form-label">
                  Địa chỉ nhận hàng *
                </label>

                <VietnamAddressSelector
                  fullAddress={formData.formattedAddress}
                  onFullAddressChange={handleAddressSelectorChange}
                  onLatLngChange={handleSelectorLatLngChange}
                />

                <div className="addresses-selected-address">
                  Địa chỉ đã chọn:{' '}
                  <span>
                    {formData.formattedAddress || '(Chưa chọn)'}
                  </span>
                </div>
              </div>

              {/* Map */}
              <div className="addresses-form-group">
                <label className="addresses-form-label">
                  Vị trí trên bản đồ
                </label>
                <div className="addresses-map-wrapper">
                  <LocationPicker
                    address={formData.formattedAddress}
                    lat={
                      formData.lat !== undefined &&
                      formData.lat !== null
                        ? String(formData.lat)
                        : ''
                    }
                    lng={
                      formData.lng !== undefined &&
                      formData.lng !== null
                        ? String(formData.lng)
                        : ''
                    }
                    onChange={handleMapLocationChange}
                  />
                </div>
                <div className="addresses-map-hint">
                  Bạn có thể kéo marker để chỉnh lại vị trí chính
                  xác hơn.
                </div>
              </div>

              {!editingId && (
                <div className="addresses-form-group">
                  <label className="addresses-form-checkbox-label">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="addresses-form-checkbox"
                    />
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              )}

              <div className="addresses-form-actions">
                <button
                  type="submit"
                  disabled={updating.has(currentUpdatingKey)}
                  className="addresses-form-submit"
                >
                  {updating.has(currentUpdatingKey)
                    ? 'Đang xử lý...'
                    : editingId
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

        {/* Danh sách địa chỉ */}
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
                    address.isDefault
                      ? 'addresses-item-default'
                      : ''
                  }`}
                >
                  {address.isDefault && (
                    <div className="addresses-item-badge">
                      Mặc định
                    </div>
                  )}

                  <div className="addresses-item-content">
                    <div className="addresses-item-name">
                      {address.fullName}
                    </div>
                    <div className="addresses-item-phone">
                      {address.phone}
                    </div>
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
                        onClick={() =>
                          void handleSetDefault(address.id)
                        }
                        disabled={isUpdating}
                        className="addresses-action-button addresses-action-default"
                      >
                        Đặt mặc định
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      disabled={isUpdating}
                      className="addresses-action-button addresses-action-edit"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() =>
                        void handleDelete(address.id)
                      }
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
