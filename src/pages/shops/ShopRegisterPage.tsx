import { useMemo, useState, type FormEvent } from 'react';
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

const phoneRegex = /^(0|\+84)\d{9,10}$/;

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

  const trimmedName = form.name.trim();
  const trimmedPhone = form.shopPhone.trim();
  const trimmedAddress = form.shopAddress.trim();

  const phoneValid = !trimmedPhone || phoneRegex.test(trimmedPhone);

  const submitDisabled = useMemo(() => {
    if (loading) return true;
    if (!trimmedName) return true;
    if (!trimmedPhone) return true;
    if (!trimmedAddress) return true;
    if (!phoneValid) return true;
    if (nameExists === true) return true;
    return false;
  }, [loading, trimmedName, trimmedPhone, trimmedAddress, phoneValid, nameExists]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);

    if (name === 'name') {
      setNameExists(null);
    }
  };

  const handleCheckName = async () => {
    const value = form.name.trim();
    if (!value) return;

    setCheckingName(true);
    setError(null);

    try {
      const res = await checkShopName(value);
      if (res.success) {
        setNameExists(!!res.data.exists);
      } else {
        setError(res.message || 'Không kiểm tra được tên shop.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không kiểm tra được tên shop.');
    } finally {
      setCheckingName(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trimmedName) {
      setError('Vui lòng nhập tên shop.');
      return;
    }

    if (!trimmedPhone) {
      setError('Vui lòng nhập số điện thoại shop.');
      return;
    }

    if (!phoneValid) {
      setError('Số điện thoại chưa đúng định dạng.');
      return;
    }

    if (!trimmedAddress) {
      setError('Vui lòng nhập địa chỉ shop.');
      return;
    }

    if (nameExists === true) {
      setError('Tên shop đã tồn tại. Vui lòng chọn tên khác.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: trimmedName,
        shopAddress: trimmedAddress,
        shopPhone: trimmedPhone,
      };

      if (form.email.trim()) payload.email = form.email.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.shopLat) payload.shopLat = parseFloat(form.shopLat);
      if (form.shopLng) payload.shopLng = parseFloat(form.shopLng);
      if (form.shopPlaceId.trim()) payload.shopPlaceId = form.shopPlaceId.trim();

      const res = await registerShop(payload);

      if (res.success) {
        setSuccessOpen(true);
      } else {
        setError(res.message || 'Đăng ký shop thất bại.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-register-page">
      <div className="shop-register-container">
        <div className="shop-register-topbar">
          <button
            type="button"
            className="shop-topbar-btn shop-topbar-btn--ghost"
            onClick={() => navigate('/home')}
          >
            ← Trang chủ
          </button>
        </div>

        <div className="shop-register-header">
          <h1 className="shop-register-title">Đăng ký mở shop</h1>
          <p className="shop-register-subtitle">
            Điền thông tin cơ bản để gửi yêu cầu mở shop. Sau khi admin duyệt,
            bạn mới có thể đăng bán sản phẩm và xử lý đơn hàng.
          </p>
        </div>

        {error && <div className="global-error">{error}</div>}

        <div
          style={{
            marginBottom: 18,
            padding: '14px 16px',
            borderRadius: 16,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Quy trình mở shop
          </div>
          <div>1. Gửi thông tin đăng ký shop.</div>
          <div>2. Admin kiểm tra và phê duyệt shop.</div>
          <div>3. Sau khi được duyệt, bạn có thể quản lý sản phẩm và đơn hàng.</div>
        </div>

        {successOpen && (
          <div
            className="shop-success-overlay"
            onMouseDown={() => setSuccessOpen(false)}
          >
            <div
              className="shop-success-modal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="shop-success-title">Gửi đăng ký thành công</div>
              <div className="shop-success-text">
                Shop của bạn đã được tạo ở trạng thái <b>chờ duyệt</b>. Bạn vẫn có
                thể vào trang shop của mình để xem và cập nhật thông tin trong lúc
                chờ <b>ADMIN</b> phê duyệt.
              </div>

              <div
                style={{
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}
              >
                <div>• Chưa thể đăng bán sản phẩm khi shop còn chờ duyệt.</div>
                <div>• Sau khi duyệt, shop sẽ được kích hoạt để bán hàng.</div>
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
            <div className="info-column">
              <h3 className="section-heading">Thông tin cơ bản</h3>

              <div className="form-group">
                <label className="form-label">Tên shop (*)</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="Ví dụ: Mini E Fashion"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={150}
                  />
                  <button
                    type="button"
                    className="btn-check-name"
                    onClick={handleCheckName}
                    disabled={checkingName || !trimmedName}
                  >
                    {checkingName ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                </div>

                {nameExists === true && (
                  <div className="msg-helper msg-error">
                    Tên shop đã tồn tại. Vui lòng chọn tên khác.
                  </div>
                )}
                {nameExists === false && (
                  <div className="msg-helper msg-success">
                    Tên shop có thể sử dụng.
                  </div>
                )}
              </div>

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
                {!!trimmedPhone && !phoneValid && (
                  <div className="msg-helper msg-error">
                    Vui lòng nhập số điện thoại hợp lệ.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ shop (*)</label>
                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={(full) =>
                    setForm((prev) => ({
                      ...prev,
                      shopAddress: full,
                    }))
                  }
                  onLatLngChange={(lat, lng) =>
                    setForm((prev) => ({
                      ...prev,
                      shopLat: lat || '',
                      shopLng: lng || '',
                    }))
                  }
                />
                <div className="msg-helper" style={{ color: '#6b7280' }}>
                  Hãy chọn địa chỉ càng chính xác càng tốt để shipper dễ tìm shop.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email liên hệ</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="shop@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả shop</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Giới thiệu ngắn gọn về shop của bạn..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="map-column">
              <h3 className="section-heading">Vị trí trên bản đồ</h3>
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
                Bạn có thể kéo ghim để điều chỉnh vị trí chính xác hơn.
              </p>
            </div>
          </div>

          <div className="register-footer">
            <button
              type="submit"
              className="btn-submit-main"
              disabled={submitDisabled}
            >
              {loading ? 'Đang gửi đăng ký...' : 'Gửi đăng ký shop'}
            </button>
            <p className="terms-text">
              Sau khi gửi đăng ký, shop sẽ ở trạng thái chờ duyệt trước khi được
              phép bán hàng.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopRegisterPage;