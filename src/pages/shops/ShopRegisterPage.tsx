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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#f8f9fa',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            🏬
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Đăng ký shop
          </h1>
        </div>

        {error && (
          <div
            style={{
              color: '#dc2626',
              marginBottom: '16px',
              padding: '12px',
              background: '#fee2e2',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              color: '#16a34a',
              marginBottom: '16px',
              padding: '12px',
              background: '#dcfce7',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Tên shop (*)
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={150}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
            <button
              type="button"
              onClick={handleCheckName}
              disabled={checkingName || !form.name.trim()}
              style={{
                padding: '12px 20px',
                background: checkingName || !form.name.trim() ? '#9ca3af' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: checkingName || !form.name.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {checkingName ? 'Đang kiểm tra...' : 'Kiểm tra tên'}
            </button>
          </div>
          {nameExists === true && (
            <div
              style={{
                color: '#dc2626',
                marginTop: '4px',
                fontSize: '14px',
                padding: '8px',
                background: '#fee2e2',
                borderRadius: '8px',
              }}
            >
              Tên shop đã tồn tại.
            </div>
          )}
          {nameExists === false && (
            <div
              style={{
                color: '#16a34a',
                marginTop: '4px',
                fontSize: '14px',
                padding: '8px',
                background: '#dcfce7',
                borderRadius: '8px',
              }}
            >
              Tên shop có thể sử dụng.
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '25px',
              border: '1px solid #ddd',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Mô tả
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '15px',
              border: '1px solid #ddd',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Địa chỉ / Vị trí trên bản đồ
          </label>
          <div
            style={{
              borderRadius: '15px',
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
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
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Vĩ độ (lat)
            </label>
            <input
              type="number"
              step="0.0000001"
              name="shopLat"
              value={form.shopLat}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Kinh độ (lng)
            </label>
            <input
              type="number"
              step="0.0000001"
              name="shopLng"
              value={form.shopLng}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Google Place ID
          </label>
          <input
            type="text"
            name="shopPlaceId"
            value={form.shopPlaceId}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '25px',
              border: '1px solid #ddd',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#555',
              fontWeight: '500',
            }}
          >
            Số điện thoại
          </label>
          <input
            type="text"
            name="shopPhone"
            value={form.shopPhone}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '25px',
              border: '1px solid #ddd',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#9ca3af' : '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
          }}
        >
          {loading ? 'Đang tạo shop...' : 'Tạo shop'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default ShopRegisterPage;
