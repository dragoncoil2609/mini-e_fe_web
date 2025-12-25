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
  const [nameExists, setNameExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') setNameExists(null);
  };

  const handleCheckName = async () => {
    if (!form.name.trim()) return;
    setCheckingName(true);
    try {
      const res = await checkShopName(form.name.trim());
      if (res.success) setNameExists(res.data.exists);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingName(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        shopAddress: form.shopAddress.trim(),
        shopPhone: form.shopPhone.trim(),
      };

      // Map optional fields
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.shopLat) payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng) payload.shopLng = parseFloat(form.shopLng);

      const res = await registerShop(payload);

      if (res.success) {
        setSuccessOpen(true); // ✅ hiển thị thông báo chờ admin duyệt
      } else {
        setError(res.message || 'Đăng ký thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-register-page">
      <div className="shop-register-container">
        {/* Top bar giống format Me/Home */}
        <div className="shop-register-topbar">
          <button
            type="button"
            className="shop-topbar-btn shop-topbar-btn--ghost"
            onClick={() => navigate('/home')}
          >
            ← Trang chủ
          </button>
        </div>

        {/* Header card */}
        <div className="shop-register-header">
          <h1 className="shop-register-title">Đăng ký mở shop</h1>
          <p className="shop-register-subtitle">
            Tạo cửa hàng của riêng bạn, quản lý sản phẩm và đơn hàng dễ dàng hơn.
          </p>
        </div>

        {error && <div className="global-error">{error}</div>}

        {successOpen && (
          <div className="shop-success-overlay" onMouseDown={() => setSuccessOpen(false)}>
            <div className="shop-success-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="shop-success-title">Đăng ký shop thành công</div>
              <div className="shop-success-text">
                Bạn đã đăng ký shop thành công. Vui lòng chờ <b>ADMIN</b> phê duyệt để shop được kích hoạt.
              </div>
              <div className="shop-success-actions">
                <button
                  type="button"
                  className="shop-success-btn shop-success-btn--ghost"
                  onClick={() => {
                    setSuccessOpen(false);
                    navigate('/home');
                  }}
                >
                  Về trang chủ
                </button>
                <button
                  type="button"
                  className="shop-success-btn shop-success-btn--primary"
                  onClick={() => {
                    setSuccessOpen(false);
                    navigate('/shops/me');
                  }}
                >
                  Xem shop của tôi
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="shop-register-content">
            {/* --- CỘT TRÁI: THÔNG TIN CƠ BẢN --- */}
            <div className="info-column">
              <h3 className="section-heading">Thông tin cơ bản</h3>

              {/* 1. Tên Shop */}
              <div className="form-group">
                <label className="form-label">Tên Shop (*)</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="Nhập tên shop của bạn..."
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={150}
                  />
                  <button
                    type="button"
                    className="btn-check-name"
                    onClick={handleCheckName}
                    disabled={checkingName || !form.name}
                  >
                    {checkingName ? '...' : 'Kiểm tra'}
                  </button>
                </div>
                {nameExists === true && (
                  <div className="msg-helper msg-error">
                    Tên shop đã tồn tại!
                  </div>
                )}
                {nameExists === false && (
                  <div className="msg-helper msg-success">
                    Tên shop hợp lệ.
                  </div>
                )}
              </div>

              {/* 2. Số điện thoại */}
              <div className="form-group">
                <label className="form-label">Số điện thoại (*)</label>
                <input
                  type="tel"
                  name="shopPhone"
                  className="form-input"
                  placeholder="Ví dụ: 0912345678"
                  value={form.shopPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 3. Địa chỉ hành chính + chi tiết */}
              <div className="form-group">
                <label className="form-label">
                  Địa chỉ cụ thể (Số nhà, Tên đường)
                </label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) =>
                    setForm((prev) => ({ ...prev, shopAddress: full }))
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((prev) => ({
                      ...prev,
                      shopLat: lat,
                      shopLng: lng,
                    }))
                  }
                />
              </div>

              {/* 4. Email */}
              <div className="form-group">
                <label className="form-label">Email (Tuỳ chọn)</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Email liên hệ shop"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* 5. Mô tả */}
              <div className="form-group">
                <label className="form-label">Mô tả (Tuỳ chọn)</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Giới thiệu đôi nét về cửa hàng..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* --- CỘT PHẢI: BẢN ĐỒ --- */}
            <div className="map-column">
              <h3 className="section-heading">Chọn vị trí trên bản đồ</h3>
              <div className="map-wrapper">
                <LocationPicker
                  address={form.shopAddress}
                  lat={form.shopLat}
                  lng={form.shopLng}
                  onChange={({ lat, lng }) =>
                    setForm((prev) => ({
                      ...prev,
                      shopLat: lat ?? prev.shopLat,
                      shopLng: lng ?? prev.shopLng,
                    }))
                  }
                />
              </div>
              <p className="map-helper-text">
                * Kéo/thả ghim để chọn chính xác vị trí shop của bạn để Shipper
                dễ tìm.
              </p>
            </div>
          </div>

          {/* --- FOOTER: BUTTON --- */}
          <div className="register-footer">
            <button
              type="submit"
              className="btn-submit-main"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký shop'}
            </button>
            <p className="terms-text">
              Bằng cách đăng ký, bạn đồng ý với Điều khoản và Điều kiện của
              Mini&nbsp;E.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopRegisterPage;
