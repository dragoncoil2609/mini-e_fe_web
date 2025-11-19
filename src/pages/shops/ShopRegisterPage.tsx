// src/pages/shops/ShopRegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerShop, checkShopName } from '../../api/shop.api';
import LocationPicker from '../../components/LocationPicker';

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
  const [nameExists, setNameExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setError(res.message || 'Không kiểm tra được tên shop.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Có lỗi khi kiểm tra tên shop.',
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
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.shopAddress.trim()) payload.shopAddress = form.shopAddress.trim();
      if (form.shopPlaceId.trim()) payload.shopPlaceId = form.shopPlaceId.trim();
      if (form.shopPhone.trim()) payload.shopPhone = form.shopPhone.trim();
      if (form.shopLat.trim()) payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng.trim()) payload.shopLng = parseFloat(form.shopLng);

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
        err.response?.data?.message || 'Đăng ký shop thất bại. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px' }}>
      <h1>Đăng ký shop</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: 12 }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ color: 'green', marginBottom: 12 }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Tên shop (*)
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={150}
                style={{ flex: 1, padding: 8 }}
              />
              <button
                type="button"
                onClick={handleCheckName}
                disabled={checkingName || !form.name.trim()}
              >
                {checkingName ? 'Đang kiểm tra...' : 'Kiểm tra tên'}
              </button>
            </div>
          </label>
          {nameExists === true && (
            <div style={{ color: 'red', marginTop: 4 }}>
              Tên shop đã tồn tại.
            </div>
          )}
          {nameExists === false && (
            <div style={{ color: 'green', marginTop: 4 }}>
              Tên shop có thể sử dụng.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Mô tả
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Địa chỉ / Vị trí trên bản đồ
            <LocationPicker
              address={form.shopAddress}
              lat={form.shopLat}
              lng={form.shopLng}
              onChange={({ address, lat, lng }) => {
                setForm((prev) => ({
                  ...prev,
                  shopAddress: address ?? prev.shopAddress,
                  shopLat: lat ?? prev.shopLat,
                  shopLng: lng ?? prev.shopLng,
                }));
              }}
            />
          </label>
        </div>


        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label>
              Vĩ độ (lat)
              <input
                type="number"
                step="0.0000001"
                name="shopLat"
                value={form.shopLat}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Kinh độ (lng)
              <input
                type="number"
                step="0.0000001"
                name="shopLng"
                value={form.shopLng}
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Google Place ID
            <input
              type="text"
              name="shopPlaceId"
              value={form.shopPlaceId}
              onChange={handleChange}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Số điện thoại
            <input
              type="text"
              name="shopPhone"
              value={form.shopPhone}
              onChange={handleChange}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang tạo shop...' : 'Tạo shop'}
        </button>
      </form>
    </div>
  );
};

export default ShopRegisterPage;
