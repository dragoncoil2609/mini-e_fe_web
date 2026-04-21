import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMe,
  updateMe,
  deleteMe,
  type UpdateMePayload,
} from '../../api/users.api';
import type { User } from '../../api/types';
import './MeProfilePage.css';

const formatDateVN = (dateString?: string | Date | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

type Gender = 'MALE' | 'FEMALE' | 'OTHER' | '';

interface MeFormState {
  name: string;
  phone: string;
  avatarUrl: string;
  birthday: string;
  gender: Gender;
  password: string;
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await getMe();
        setProfile(me);
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
        setError(err?.response?.data?.message || 'Không load được thông tin user');
      } finally {
        setLoading(false);
      }
    };

    void fetchMe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập họ và tên.';
    if (form.phone.trim() && !/^(?:\+?84|0)\d{9,10}$/.test(form.phone.trim())) {
      return 'Số điện thoại không hợp lệ.';
    }
    if (form.password.trim() && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password.trim())) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ và số.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const validateMessage = validate();
    if (validateMessage) {
      setError(validateMessage);
      setMessage(null);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload: UpdateMePayload = {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
        birthday: form.birthday || undefined,
        gender: (form.gender as any) || undefined,
        password: form.password.trim() || undefined,
      };

      const updated = await updateMe(payload);
      setProfile(updated);
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage('Cập nhật hồ sơ thành công.');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn chắc chắn muốn xoá tài khoản?')) return;

    try {
      await deleteMe();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Xoá tài khoản thất bại');
    }
  };

  const handleShopAction = () => {
    if (profile?.role === 'USER') navigate('/shops/register');
    else navigate('/shops/me');
  };

  const displayContact = useMemo(() => {
    if (profile?.email) return profile.email;
    if (profile?.phone) return profile.phone;
    return 'Chưa cập nhật email / số điện thoại';
  }, [profile]);

  const displayAvatar = form.avatarUrl || profile?.avatarUrl || '';

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
        <div className="me-top-bar">
          <button
            onClick={() => navigate('/home')}
            className="me-top-bar-button me-top-bar-button--ghost"
            type="button"
          >
            ← Trang chủ
          </button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/addresses')}
              className="me-top-bar-button me-top-bar-button--ghost"
              type="button"
            >
              📍 Địa chỉ của tôi
            </button>
            <button
              onClick={handleShopAction}
              className="me-top-bar-button me-top-bar-button--primary"
              type="button"
            >
              {profile.role === 'USER' ? '🏪 Đăng ký bán hàng' : '⚙️ Vào cửa hàng của tôi'}
            </button>
          </div>
        </div>

        <section className="me-header-card">
          <div className="me-header-text">
            <h1 className="me-page-title">Tài khoản của bạn</h1>
            <p className="me-page-subtitle">
              Quản lý hồ sơ cá nhân, thông tin liên hệ và bảo mật tài khoản.
            </p>
          </div>

          <div className="me-summary-section">
            <div className="me-avatar-col">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="me-avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="me-avatar-img" style={{ display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800 }}>
                  {(profile.name || 'U').trim().charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="me-info-col">
              <div className="me-name-row">
                <h2 className="me-display-name">{profile.name || 'Người dùng chưa đặt tên'}</h2>
                {profile.role !== 'USER' && <span className="badge-role">{profile.role}</span>}
                {profile.isVerified && <span className="badge-verified">✅ Đã xác minh</span>}
              </div>
              <div className="me-email-row">
                Liên hệ: <span className="email-text">{displayContact}</span>
                {profile.email && <span className="readonly-tag">Email không sửa tại đây</span>}
              </div>
              <p className="me-member-since">Thành viên từ: {formatDateVN(profile.createdAt)}</p>
            </div>
          </div>
        </section>

        <div className="me-tabs-container">
          <button className="me-tab active" type="button">Thông tin chung</button>
          <button className="me-tab disabled" type="button">Lịch sử mua hàng</button>
          <button className="me-tab disabled" type="button">Ví / Voucher</button>
        </div>

        <section className="me-form-card">
          {error && <div className="me-error-message">{error}</div>}
          {message && (
            <div
              className="me-error-message"
              style={{ background: '#dcfce7', color: '#166534', marginBottom: 16 }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="me-main-form">
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

            <div className="form-group-row">
              <label className="form-label">Avatar URL</label>
              <div className="form-input-col">
                <input
                  type="text"
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={handleChange}
                  className="form-input-sketch"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="form-group-row">
              <label className="form-label">Ngày sinh</label>
              <div className="form-input-col">
                <input
                  type="date"
                  name="birthday"
                  value={form.birthday || ''}
                  onChange={handleChange}
                  className="form-input-sketch input-date"
                />
              </div>
            </div>

            <div className="form-group-row">
              <label className="form-label">Giới tính</label>
              <div className="form-input-col radio-group">
                <label className="radio-label">
                  <input type="radio" name="gender" value="MALE" checked={form.gender === 'MALE'} onChange={handleChange} /> Nam
                </label>
                <label className="radio-label">
                  <input type="radio" name="gender" value="FEMALE" checked={form.gender === 'FEMALE'} onChange={handleChange} /> Nữ
                </label>
                <label className="radio-label">
                  <input type="radio" name="gender" value="OTHER" checked={form.gender === 'OTHER'} onChange={handleChange} /> Khác
                </label>
              </div>
            </div>

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
                <span className="me-password-hint">* Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số.</span>
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" disabled={saving} className="btn-update-sketch">
                {saving ? 'ĐANG LƯU...' : 'CẬP NHẬT'}
              </button>
            </div>
          </form>
        </section>

        <div className="me-footer-section">
          <p className="me-footer-note">Cần xoá tài khoản? Hành động này sẽ đưa tài khoản vào trạng thái xoá mềm.</p>
          <button onClick={handleDeleteAccount} className="btn-delete-sketch" type="button">
            Xoá tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeProfilePage;
