import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { checkShopName, registerShop } from '../../api/shop.api';

import VietnamAddressSelector from '../../components/address/VietnamAddressSelector';
import LocationPicker from '../../components/address/LocationPicker';

import bunnyImg from '../../assets/brand/register_bunny_gift.png';

import './style/ShopRegisterPage.css';

type RegisterForm = {
  name: string;
  description: string;
  email: string;
  shopPhone: string;
  shopAddress: string;
  shopLat: string;
  shopLng: string;
};

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể đăng ký shop.'
  );
}

function toNumberOrUndefined(value: string) {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : undefined;
}

export default function ShopRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    description: '',
    email: '',
    shopPhone: '',
    shopAddress: '',
    shopLat: '',
    shopLng: '',
  });

  const [checkingName, setCheckingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');
  const [nameExists, setNameExists] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange =
    (field: keyof RegisterForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      if (field === 'name') {
        setNameMessage('');
        setNameExists(false);
      }
    };

  const handleCheckName = async () => {
    const name = form.name.trim();

    if (!name) {
      setNameMessage('');
      return;
    }

    setCheckingName(true);
    setNameMessage('');

    try {
      const res = await checkShopName(name);
      const exists = Boolean(res?.data?.exists);

      if (exists) {
        setNameExists(true);
        setNameMessage('Tên shop này đã tồn tại.');
      } else {
        setNameExists(false);
        setNameMessage('Tên shop có thể sử dụng.');
      }
    } catch {
      setNameMessage('Chưa kiểm tra được tên shop.');
    } finally {
      setCheckingName(false);
    }
  };

  const handleFullAddressChange = (nextAddress: string) => {
    setForm((prev) => ({
      ...prev,
      shopAddress: nextAddress,
    }));
  };

  const handleLatLngChange = (lat: string, lng: string) => {
    setForm((prev) => ({
      ...prev,
      shopLat: lat,
      shopLng: lng,
    }));
  };

  const handleMapChange = (value: { lat?: string; lng?: string }) => {
    setForm((prev) => ({
      ...prev,
      shopLat: value.lat ?? prev.shopLat,
      shopLng: value.lng ?? prev.shopLng,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const shopAddress = form.shopAddress.trim();

    if (!name) {
      setError('Tên shop không được để trống.');
      return;
    }

    if (nameExists) {
      setError('Tên shop đã tồn tại, vui lòng chọn tên khác.');
      return;
    }

    if (!shopAddress) {
      setError('Địa chỉ shop không được để trống.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await registerShop({
        name,
        description: form.description.trim() || undefined,
        email: form.email.trim() || undefined,
        shopPhone: form.shopPhone.trim() || undefined,

        shopAddress,
        shopLat: toNumberOrUndefined(form.shopLat),
        shopLng: toNumberOrUndefined(form.shopLng),
        shopPlaceId: undefined,
      });

      navigate('/shops/me', { replace: true });
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mochi-page shop-register-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Đăng ký shop</b>
        </div>

        <div className="shop-register-layout">
          <section className="shop-register-card mochi-card">
            <div className="shop-register-heading">
              <span className="shop-register-eyebrow">Mochi Seller ♡</span>

              <h1>Đăng ký shop bán hàng</h1>

              <p>
                Sau khi gửi thông tin, shop sẽ ở trạng thái chờ duyệt. Admin
                duyệt xong thì bạn mới có thể đăng bán sản phẩm.
              </p>
            </div>

            {error ? <div className="shop-register-error">{error}</div> : null}

            <form className="mochi-form" onSubmit={handleSubmit}>
              <div className="mochi-form-group">
                <label className="mochi-label">
                  Tên shop <span className="shop-register-required">*</span>
                </label>

                <div className="shop-name-check-row">
                  <input
                    className="mochi-input"
                    value={form.name}
                    onChange={handleChange('name')}
                    onBlur={handleCheckName}
                    placeholder="Ví dụ: Mochi Store"
                  />

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    onClick={handleCheckName}
                    disabled={checkingName || !form.name.trim()}
                  >
                    {checkingName ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </button>
                </div>

                {nameMessage ? (
                  <small
                    className={
                      nameExists
                        ? 'shop-register-field-danger'
                        : 'shop-register-field-success'
                    }
                  >
                    {nameMessage}
                  </small>
                ) : null}
              </div>

              <div className="mochi-form-group">
                <label className="mochi-label">Mô tả shop</label>

                <textarea
                  className="mochi-textarea"
                  value={form.description}
                  onChange={handleChange('description')}
                  placeholder="Mô tả ngắn về cửa hàng của bạn..."
                />
              </div>

              <div className="mochi-form-row">
                <div className="mochi-form-group">
                  <label className="mochi-label">Email liên hệ</label>

                  <input
                    className="mochi-input"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="shop@example.com"
                  />
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Số điện thoại shop</label>

                  <input
                    className="mochi-input"
                    value={form.shopPhone}
                    onChange={handleChange('shopPhone')}
                    placeholder="0123 456 789"
                  />
                </div>
              </div>

              <div className="shop-register-address-block">
                <div className="shop-register-address-head">
                  <div>
                    <label className="mochi-label">
                      Địa chỉ shop <span className="shop-register-required">*</span>
                    </label>

                    <p>
                      Chọn tỉnh/thành, quận/huyện, phường/xã rồi nhập số nhà,
                      tên đường để hệ thống lấy tọa độ.
                    </p>
                  </div>
                </div>

                <VietnamAddressSelector
                  fullAddress={form.shopAddress}
                  onFullAddressChange={handleFullAddressChange}
                  onLatLngChange={handleLatLngChange}
                />

                <div className="shop-register-coordinate-row">
                  <div className="mochi-form-group">
                    <label className="mochi-label">Vĩ độ</label>

                    <input
                      className="mochi-input"
                      value={form.shopLat}
                      onChange={handleChange('shopLat')}
                      placeholder="Latitude"
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Kinh độ</label>

                    <input
                      className="mochi-input"
                      value={form.shopLng}
                      onChange={handleChange('shopLng')}
                      placeholder="Longitude"
                    />
                  </div>
                </div>

                <div className="shop-register-map-box">
                  <LocationPicker
                    address={form.shopAddress}
                    lat={form.shopLat}
                    lng={form.shopLng}
                    onChange={handleMapChange}
                  />
                </div>
              </div>

              <div className="shop-register-actions">
                <Link to="/shops/me" className="mochi-btn mochi-btn-outline">
                  Hủy bỏ
                </Link>

                <button
                  type="submit"
                  className="mochi-btn mochi-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                </button>
              </div>
            </form>
          </section>

          <aside className="shop-register-art mochi-card">
            <img src={bunnyImg} alt="Đăng ký shop" />

            <h2>Bắt đầu bán hàng cùng Mochi</h2>

            <p>
              Tạo shop, chọn địa chỉ có tọa độ, chờ admin duyệt và bắt đầu bán
              hàng trên Mochi.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}