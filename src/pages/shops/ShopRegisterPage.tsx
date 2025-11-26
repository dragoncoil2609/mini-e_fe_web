// src/pages/shops/ShopRegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerShop, checkShopName } from '../../api/shop.api';
import LocationPicker from '../../components/LocationPicker';
import VietnamAddressSelector from '../../components/VietnamAddressSelector';
import './ShopRegisterPage.css';

interface FormState {
  name: string;
  email: string;
  description: string;
  shopAddress: string;
  shopLat: string;
  shopLng: string;
  shopPlaceId: string;
  shopPhone: string;
}

const ShopRegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    description: '',
    shopAddress: '',
    shopLat: '',
    shopLng: '',
    shopPlaceId: '',
    shopPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameExists, setNameExists] =
    useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] =
    useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setNameExists(null);
    }
  };

  const handleCheckName = async () => {
    if (!form.name.trim()) return;
    setCheckingName(true);
    setError(null);

    try {
      const res = await checkShopName(form.name.trim());
      if (res.success) {
        setNameExists(res.data.exists);
      } else {
        setError(
          res.message || 'Không kiểm tra được tên shop.',
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Có lỗi khi kiểm tra tên shop.',
      );
    } finally {
      setCheckingName(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        name: form.name.trim(),
      };

      if (form.email.trim()) payload.email = form.email.trim();
      if (form.description.trim())
        payload.description = form.description.trim();
      if (form.shopAddress.trim())
        payload.shopAddress = form.shopAddress.trim();
      if (form.shopPlaceId.trim())
        payload.shopPlaceId = form.shopPlaceId.trim();
      if (form.shopPhone.trim())
        payload.shopPhone = form.shopPhone.trim();
      if (form.shopLat.trim())
        payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng.trim())
        payload.shopLng = parseFloat(form.shopLng);

      const res = await registerShop(payload);

      if (res.success) {
        setSuccessMsg('Đăng ký shop thành công!');
        // Chuyển sang trang xem shop của tôi
        navigate('/shops/me');
      } else {
        setError(res.message || 'Đăng ký shop thất bại.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Đăng ký shop thất bại. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-register-page">
      <div className="shop-register-card">
        <div className="shop-register-header">
          <div className="shop-register-icon">🏬</div>
          <h1 className="shop-register-title">
            Đăng ký shop
          </h1>
        </div>

        {error && (
          <div className="shop-register-error">{error}</div>
        )}
        {successMsg && (
          <div className="shop-register-success">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="shop-register-form-group">
            <label className="shop-register-label">
              Tên shop (*)
            </label>
            <div className="shop-register-name-row">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={150}
                className="shop-register-input shop-register-name-input"
              />
              <button
                type="button"
                onClick={handleCheckName}
                disabled={checkingName || !form.name.trim()}
                className="shop-register-check-button"
              >
                {checkingName
                  ? 'Đang kiểm tra...'
                  : 'Kiểm tra tên'}
              </button>
            </div>
            {nameExists === true && (
              <div className="shop-register-name-error">
                Tên shop đã tồn tại.
              </div>
            )}
            {nameExists === false && (
              <div className="shop-register-name-ok">
                Tên shop có thể sử dụng.
              </div>
            )}
          </div>

          <div className="shop-register-form-group">
            <label className="shop-register-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="shop-register-input"
            />
          </div>

          <div className="shop-register-form-group">
            <label className="shop-register-label">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="shop-register-textarea"
            />
          </div>

          {/* Địa chỉ 3 cấp + địa chỉ cụ thể */}
          <div className="shop-register-form-group">
            <label className="shop-register-label">
              Địa chỉ shop
            </label>
            <VietnamAddressSelector
              fullAddress={form.shopAddress}
              onFullAddressChange={(full) => {
                setForm((prev) => ({
                  ...prev,
                  shopAddress: full,
                }));
              }}
            />
          </div>

          {/* Map */}
          <div className="shop-register-form-group">
            <label className="shop-register-label">
              Vị trí trên bản đồ
            </label>
            <div className="shop-register-map-wrapper">
              <LocationPicker
                address={form.shopAddress}
                lat={form.shopLat}
                lng={form.shopLng}
                onChange={({ lat, lng }) => {
                  setForm((prev) => ({
                    ...prev,
                    shopLat: lat ?? prev.shopLat,
                    shopLng: lng ?? prev.shopLng,
                  }));
                }}
              />
            </div>
          </div>

          <div className="shop-register-row">
            <div className="shop-register-row-item">
              <label className="shop-register-label">
                Vĩ độ (lat)
              </label>
              <input
                type="number"
                step="0.0000001"
                name="shopLat"
                value={form.shopLat}
                onChange={handleChange}
                className="shop-register-input"
              />
            </div>
            <div className="shop-register-row-item">
              <label className="shop-register-label">
                Kinh độ (lng)
              </label>
              <input
                type="number"
                step="0.0000001"
                name="shopLng"
                value={form.shopLng}
                onChange={handleChange}
                className="shop-register-input"
              />
            </div>
          </div>

          <div className="shop-register-form-group">
            <label className="shop-register-label">
              Google Place ID
            </label>
            <input
              type="text"
              name="shopPlaceId"
              value={form.shopPlaceId}
              onChange={handleChange}
              className="shop-register-input"
            />
          </div>

          <div className="shop-register-form-group">
            <label className="shop-register-label">
              Số điện thoại
            </label>
            <input
              type="text"
              name="shopPhone"
              value={form.shopPhone}
              onChange={handleChange}
              className="shop-register-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="shop-register-submit"
          >
            {loading ? 'Đang tạo shop...' : 'Tạo shop'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegisterPage;
