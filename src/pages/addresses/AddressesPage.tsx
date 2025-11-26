// src/pages/addresses/AddressesPage.tsx
import { useEffect, useState } from 'react';
import { AddressesApi } from '../../api/addresses.api';
import type { Address, CreateAddressDto, UpdateAddressDto, ApiResponse } from '../../api/types';
import './AddressesPage.css';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    loadAddresses();
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
        setError(res.message || 'Không tải được danh sách địa chỉ.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Không tải được danh sách địa chỉ. Vui lòng đăng nhập.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'lat' || name === 'lng') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseFloat(value) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
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
        setError(res.message || 'Cập nhật địa chỉ thất bại.');
      }
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
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      return;
    }

    setUpdating((prev) => new Set(prev).add(id));
    setError(null);
    setMessage(null);

    try {
      const res = await AddressesApi.remove(id);
      if (res.success) {
        setMessage('Đã xóa địa chỉ thành công.');
        await loadAddresses();
      } else {
        setError(res.message || 'Xóa địa chỉ thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xóa địa chỉ thất bại. Vui lòng thử lại.');
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
      const res = await AddressesApi.setDefault(id);
      if (res.success) {
        setMessage('Đã đặt địa chỉ làm mặc định.');
        await loadAddresses();
      } else {
        setError(res.message || 'Đặt mặc định thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Đặt mặc định thất bại. Vui lòng thử lại.');
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
          <div className="addresses-loading">Đang tải danh sách địa chỉ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="addresses-container">
      <div className="addresses-card">
        <div className="addresses-header">
          <div className="addresses-icon">📍</div>
          <h1 className="addresses-title">Địa chỉ của tôi</h1>
        </div>

        {error && <div className="addresses-error">{error}</div>}
        {message && <div className="addresses-message">{message}</div>}

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

        {showForm && (
          <div className="addresses-form-section">
            <h2 className="addresses-form-title">
              {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            <form onSubmit={handleSubmit} className="addresses-form">
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
                  placeholder="Nhập họ và tên"
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
                  placeholder="0912345678"
                />
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-label">Địa chỉ *</label>
                <textarea
                  name="formattedAddress"
                  value={formData.formattedAddress}
                  onChange={handleInputChange}
                  required
                  maxLength={300}
                  rows={3}
                  className="addresses-form-textarea"
                  placeholder="Nhập địa chỉ đầy đủ"
                />
              </div>

              <div className="addresses-form-row">
                <div className="addresses-form-group">
                  <label className="addresses-form-label">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    name="lat"
                    value={formData.lat || ''}
                    onChange={handleInputChange}
                    step="any"
                    className="addresses-form-input"
                    placeholder="10.762622"
                  />
                </div>

                <div className="addresses-form-group">
                  <label className="addresses-form-label">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    name="lng"
                    value={formData.lng || ''}
                    onChange={handleInputChange}
                    step="any"
                    className="addresses-form-input"
                    placeholder="106.660172"
                  />
                </div>
              </div>

              <div className="addresses-form-group">
                <label className="addresses-form-label">Place ID</label>
                <input
                  type="text"
                  name="placeId"
                  value={formData.placeId}
                  onChange={handleInputChange}
                  className="addresses-form-input"
                  placeholder="ChIJ..."
                />
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
                  disabled={updating.has(editingId || -1)}
                  className="addresses-form-submit"
                >
                  {updating.has(editingId || -1)
                    ? 'Đang xử lý...'
                    : editingId
                      ? 'Cập nhật'
                      : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={updating.has(editingId || -1)}
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
            <p>Hãy thêm địa chỉ để nhận hàng.</p>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="addresses-list">
            {addresses.map((address) => {
              const isUpdating = updating.has(address.id);

              return (
                <div
                  key={address.id}
                  className={`addresses-item ${address.isDefault ? 'addresses-item-default' : ''}`}
                >
                  {address.isDefault && (
                    <div className="addresses-item-badge">Mặc định</div>
                  )}

                  <div className="addresses-item-content">
                    <div className="addresses-item-name">{address.fullName}</div>
                    <div className="addresses-item-phone">{address.phone}</div>
                    <div className="addresses-item-address">{address.formattedAddress}</div>
                    {address.lat && address.lng && (
                      <div className="addresses-item-coords">
                        📍 {address.lat}, {address.lng}
                      </div>
                    )}
                  </div>

                  <div className="addresses-item-actions">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
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
                      onClick={() => handleDelete(address.id)}
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

