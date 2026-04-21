import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressesApi } from '../../api/addresses.api';
import type { Address, CreateAddressDto, UpdateAddressDto } from '../../api/types';
import './AddressesPage.css';
import VietnamAddressSelector from '../../components/VietnamAddressSelector';
import LocationPicker from '../../components/LocationPicker';

function unwrapAddressList(result: any): Address[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function unwrapAddress(result: any): Address | null {
  if (result && typeof result === 'object' && 'id' in result) return result as Address;
  if (result?.data && typeof result.data === 'object' && 'id' in result.data) return result.data as Address;
  return null;
}

function unwrapSuccess(result: any): boolean {
  if (typeof result?.success === 'boolean') return result.success;
  return true;
}

export default function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
    try {
      const result = await AddressesApi.list();
      setAddresses(unwrapAddressList(result));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Không tải được danh sách địa chỉ. Vui lòng đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const defaultAddressId = useMemo(
    () => addresses.find((item) => item.isDefault)?.id ?? null,
    [addresses],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddressSelectorChange = (fullAddress: string) => {
    setFormData((prev) => ({ ...prev, formattedAddress: fullAddress }));
  };

  const handleSelectorLatLngChange = (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setFormData((prev) => ({ ...prev, lat, lng }));
    }
  };

  const handleMapLocationChange = (coords: { lat?: string; lng?: string }) => {
    const lat = coords.lat ? parseFloat(coords.lat) : NaN;
    const lng = coords.lng ? parseFloat(coords.lng) : NaN;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setFormData((prev) => ({ ...prev, lat, lng }));
    }
  };

  const validate = () => {
    if (!formData.fullName?.trim()) return 'Vui lòng nhập họ và tên.';
    if (!formData.phone?.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!/^(?:\+?84|0)\d{9,10}$/.test(formData.phone.trim())) return 'Số điện thoại không hợp lệ.';
    if (!formData.formattedAddress?.trim() || formData.formattedAddress.trim().length < 5) {
      return 'Vui lòng chọn địa chỉ đầy đủ (Tỉnh/Huyện/Xã + địa chỉ chi tiết).';
    }
    return '';
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
    resetForm();
    setError(null);
    setMessage(null);
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
    await AddressesApi.create(formData);
    setMessage('Đã thêm địa chỉ mới thành công.');
    setShowForm(false);
    resetForm();
    await loadAddresses();
  } catch (err: any) {
    console.error(err);
    setError(err?.response?.data?.message || 'Thêm địa chỉ thất bại. Vui lòng thử lại.');
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

  const validateMessage = validate();
  if (validateMessage) {
    setError(validateMessage);
    return;
  }

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
      isDefault: formData.isDefault,
    };

    await AddressesApi.update(editingId, updateDto);
    setMessage('Đã cập nhật địa chỉ thành công.');
    setShowForm(false);
    resetForm();
    await loadAddresses();
  } catch (err: any) {
    console.error(err);
    setError(err?.response?.data?.message || 'Cập nhật địa chỉ thất bại. Vui lòng thử lại.');
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
    if (editingId) await handleUpdate();
    else await handleCreate();
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
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    setUpdating((prev) => new Set(prev).add(id));
    setError(null);
    setMessage(null);

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
    setMessage(null);

    try {
      const result = await AddressesApi.setDefault(id);
      if (!result.success) {
        setError('Lỗi đặt mặc định.');
        return;
      }
      setMessage('Đã đặt địa chỉ làm mặc định.');
      await loadAddresses();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Lỗi đặt mặc định.');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const currentUpdatingKey = editingId ?? -1;

  if (loading) {
    return (
      <div className="addresses-container">
        <div className="addresses-card">
          <div className="addresses-loading">Đang tải danh sách địa chỉ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="addresses-container">
      <div className="addresses-card">
        <div className="addresses-topbar">
          <button type="button" className="addresses-back-button" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>

        <div className="addresses-header">
          <div className="addresses-icon">📍</div>
          <h1 className="addresses-title">Địa chỉ của tôi</h1>
          <p className="addresses-subtitle">Quản lý địa chỉ giao hàng để đặt hàng nhanh hơn và chính xác hơn.</p>
        </div>

        {error && <div className="addresses-error">{error}</div>}
        {message && <div className="addresses-message">{message}</div>}

        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="addresses-add-button"
            type="button"
          >
            + Thêm địa chỉ mới
          </button>
        )}

        {showForm && (
          <div className="addresses-form-section">
            <h2 className="addresses-form-title">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>

            <form onSubmit={handleSubmit} className="addresses-form">
              <div className="addresses-form-row">
                <div className="addresses-form-group">
                  <label className="addresses-form-label">Họ và tên *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required maxLength={120} className="addresses-form-input" placeholder="Nguyễn Văn A" />
                </div>
                <div className="addresses-form-group">
                  <label className="addresses-form-label">Số điện thoại *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required pattern="^(?:\+?84|0)\d{9,10}$" className="addresses-form-input" placeholder="0912..." />
                </div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-label">Địa chỉ nhận hàng *</label>
                <VietnamAddressSelector
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
                    address={formData.formattedAddress}
                    lat={formData.lat != null ? String(formData.lat) : ''}
                    lng={formData.lng != null ? String(formData.lng) : ''}
                    onChange={handleMapLocationChange}
                  />
                </div>
                <div className="addresses-map-hint">Bạn có thể kéo marker để chỉnh lại vị trí chính xác hơn.</div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-checkbox-label">
                  <input type="checkbox" name="isDefault" checked={!!formData.isDefault} onChange={handleInputChange} className="addresses-form-checkbox" />
                  {editingId ? 'Đặt địa chỉ này làm mặc định' : 'Đặt làm địa chỉ mặc định'}
                </label>
              </div>

              <div className="addresses-form-actions">
                <button type="submit" disabled={updating.has(currentUpdatingKey)} className="addresses-form-submit">
                  {updating.has(currentUpdatingKey) ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" onClick={handleCancelForm} disabled={updating.has(currentUpdatingKey)} className="addresses-form-cancel">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && addresses.length === 0 && (
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
                <div key={address.id} className={`addresses-item ${address.isDefault ? 'addresses-item-default' : ''}`}>
                  {address.isDefault && <div className="addresses-item-badge">Mặc định</div>}
                  <div className="addresses-item-content">
                    <div className="addresses-item-name">{address.fullName}</div>
                    <div className="addresses-item-phone">{address.phone}</div>
                    <div className="addresses-item-address">{address.formattedAddress}</div>
                    {(address.lat || address.lng) && (
                      <div className="addresses-item-coords">lat: {address.lat} – lng: {address.lng}</div>
                    )}
                  </div>

                  <div className="addresses-item-actions">
                    {!address.isDefault && (
                      <button type="button" onClick={() => void handleSetDefault(address.id)} disabled={isUpdating || address.id === defaultAddressId} className="addresses-action-button addresses-action-default">
                        Đặt mặc định
                      </button>
                    )}
                    <button type="button" onClick={() => handleEdit(address)} disabled={isUpdating} className="addresses-action-button addresses-action-edit">
                      Sửa
                    </button>
                    <button type="button" onClick={() => void handleDelete(address.id)} disabled={isUpdating} className="addresses-action-button addresses-action-delete">
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
