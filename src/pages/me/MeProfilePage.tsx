import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMe,
  updateMe,
  deleteMe,
  type UpdateMePayload,
} from '../../api/users.api';
import type { User } from '../../api/types';
import './MeProfilePage.css';

// Helper format ngày tháng VN
const formatDateVN = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

type Gender = 'MALE' | 'FEMALE' | 'OTHER' | '';

interface MeFormState {
  name: string;
  phone: string;
  avatarUrl: string;
  birthday: string; // YYYY-MM-DD
  gender: Gender;
  password: string; // Mật khẩu mới
}

const defaultForm: MeFormState = {
  name: '',
  phone: '',
  avatarUrl: '',
  birthday: '',
  gender: '',
  password: '',
};

const MeProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [form, setForm] = useState<MeFormState>(defaultForm);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load thông tin user
  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const me = await getMe();
        setProfile(me);

        // Map dữ liệu từ API vào Form
        setForm({
          name: me.name || '',
          phone: me.phone || '',
          avatarUrl: me.avatarUrl || '',
          birthday: me.birthday || '',
          gender: (me.gender as Gender) || '',
          password: '',
        });
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message || 'Không load được thông tin user',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit cập nhật profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const payload: UpdateMePayload = {
        name: form.name || undefined,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
        birthday: form.birthday || undefined,
        gender: (form.gender as any) || undefined,
        password: form.password ? form.password : undefined,
      };

      const updated = await updateMe(payload);
      setProfile(updated);
      alert('Cập nhật hồ sơ thành công!');

      // Reset password sau khi lưu thành công
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn chắc chắn muốn xoá tài khoản?')) {
      return;
    }
    try {
      await deleteMe();
      alert('Tài khoản đã được xoá. Hẹn gặp lại!');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Xoá tài khoản thất bại');
    }
  };

  const handleShopAction = () => {
    if (profile?.role === 'USER') {
      navigate('/shops/register');
    } else {
      navigate('/shops/me');
    }
  };

  // Hiển thị avatar realtime khi nhập URL, nếu lỗi thì dùng avatar cũ hoặc placeholder
  const displayAvatar =
    form.avatarUrl || profile?.avatarUrl || 'https://via.placeholder.com/150';

  if (loading) {
    return (
      <div className="me-page-root">
        <div className="me-page-loading">Đang tải...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="me-page-root">
        <div className="me-page-error">{error || 'Lỗi tải trang'}</div>
      </div>
    );
  }

  return (
    <div className="me-page-root">
      <div className="me-page-container">
        {/* Top bar giống định dạng gọn như Home */}
        <div className="me-top-bar">
          <button
            onClick={() => navigate('/home')}
            className="me-top-bar-button me-top-bar-button--ghost"
          >
            ← Trang chủ
          </button>
          <button
            onClick={handleShopAction}
            className="me-top-bar-button me-top-bar-button--primary"
          >
            {profile.role === 'USER'
              ? '🏪 Đăng ký bán hàng'
              : '⚙️ Vào cửa hàng của tôi'}
          </button>
        </div>

        {/* Header + avatar */}
        <section className="me-header-card">
          <div className="me-header-text">
            <h1 className="me-page-title">Tài khoản của bạn</h1>
            <p className="me-page-subtitle">
              Quản lý thông tin hồ sơ, bảo mật và tuỳ chọn cá nhân.
            </p>
          </div>

          <div className="me-summary-section">
            <div className="me-avatar-col">
              <img
                src={displayAvatar}
                alt="Avatar"
                className="me-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150';
                }}
              />
            </div>
            <div className="me-info-col">
              <div className="me-name-row">
                <h2 className="me-display-name">
                  {profile.name || 'Người dùng chưa đặt tên'}
                </h2>
                {profile.role !== 'USER' && (
                  <span className="badge-role">{profile.role}</span>
                )}
                {profile.isVerified && (
                  <span className="badge-verified">✅ Verified</span>
                )}
              </div>
              <div className="me-email-row">
                Email: <span className="email-text">{profile.email}</span>
                <span className="readonly-tag">Read-only</span>
              </div>
              <p className="me-member-since">
                Thành viên từ: {formatDateVN(profile.createdAt)}
              </p>
            </div>
          </div>
        </section>

        {/* Tabs hàng ngang giống style Home */}
        <div className="me-tabs-container">
          <button className="me-tab active">Thông tin chung</button>
          <button className="me-tab disabled">Lịch sử mua hàng</button>
          <button className="me-tab disabled">Ví Vouchers</button>
        </div>

        {/* Form card */}
        <section className="me-form-card">
          {error && <div className="me-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="me-main-form">
            {/* 1. Họ và tên */}
            <div className="form-group-row">
              <label className="form-label">Họ và tên</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input-sketch"
                  placeholder="Nhập tên hiển thị"
                  required
                />
              </div>
            </div>

            {/* 2. Số điện thoại */}
            <div className="form-group-row">
              <label className="form-label">Số điện thoại</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-input-sketch"
                  placeholder="Ví dụ: 0901234567"
                />
              </div>
            </div>

            {/* 3. Avatar URL */}
            <div className="form-group-row">
              <label className="form-label">Avatar URL</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={handleChange}
                  className="form-input-sketch"
                  placeholder="https://example.com/anh.jpg"
                />
              </div>
            </div>

            {/* 4. Ngày sinh */}
            <div className="form-group-row">
              <label className="form-label">Ngày sinh</label>
              <div className="form-input-col date-input-group">
                <input
                  type="date"
                  name="birthday"
                  value={form.birthday || ''}
                  onChange={handleChange}
                  className="form-input-sketch input-date"
                />
              </div>
            </div>

            {/* 5. Giới tính */}
            <div className="form-group-row">
              <label className="form-label">Giới tính</label>
              <div className="form-input-col radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={form.gender === 'MALE'}
                    onChange={handleChange}
                  />{' '}
                  Nam
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={form.gender === 'FEMALE'}
                    onChange={handleChange}
                  />{' '}
                  Nữ
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="OTHER"
                    checked={form.gender === 'OTHER'}
                    onChange={handleChange}
                  />{' '}
                  Khác
                </label>
              </div>
            </div>

            {/* 6. Mật khẩu mới */}
            <div className="form-group-row">
              <label className="form-label">Mật khẩu mới</label>
              <div className="form-input-col">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input-sketch"
                  placeholder="Để trống nếu không đổi"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group-row me-password-hint-row">
              <label className="form-label" />
              <div className="form-input-col">
                <span className="me-password-hint">
                  * Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số.
                </span>
              </div>
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                disabled={saving}
                className="btn-update-sketch"
              >
                {saving ? 'ĐANG LƯU...' : 'CẬP NHẬT'}
              </button>
            </div>
          </form>
        </section>

        {/* Footer hành động */}
        <div className="me-footer-section">
          <p className="me-footer-note">
            Cần xoá tài khoản? Hành động này không thể hoàn tác.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="btn-delete-sketch"
          >
            Xoá tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeProfilePage;
