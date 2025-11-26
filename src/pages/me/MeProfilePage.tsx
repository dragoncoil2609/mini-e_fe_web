// src/pages/me/MeProfilePage.tsx
import React, { useEffect, useState } from 'react';
import {
  getMe,
  updateMe,
  deleteMe,
  type UpdateMePayload,
} from '../../api/users.api';
import type { User } from '../../api/types';
import { useNavigate } from 'react-router-dom';
import { getMyShop } from '../../api/shop.api';
import './MeProfilePage.css';

type Gender = 'MALE' | 'FEMALE' | 'OTHER' | '';

interface MeFormState {
  name: string;
  phone: string;
  avatarUrl: string;
  birthday: string; // YYYY-MM-DD
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
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingShop, setCheckingShop] = useState<boolean>(false);

  // Load thông tin user hiện tại
  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
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
        password: form.password || undefined,
      };

      const updated = await updateMe(payload);
      setProfile(updated);
      alert('Cập nhật hồ sơ thành công!');
      setForm((prev) => ({
        ...prev,
        password: '',
      }));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Xóa mềm tài khoản của chính mình
  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Bạn chắc chắn muốn xoá tài khoản? Hành động này không thể hoàn tác!',
      )
    ) {
      return;
    }

    try {
      await deleteMe();
      alert(
        'Tài khoản đã được xoá (soft delete). Bạn sẽ được chuyển về trang đăng nhập.',
      );

      // TODO: tuỳ bạn đang lưu token thế nào
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      window.location.href = '/auth/login';
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Xoá tài khoản thất bại');
    }
  };

  // Nút Shop:
  // - Nếu có shop → /shops/me
  // - Nếu chưa có shop (404) → /shops/register
  const handleGoShop = async () => {
    setCheckingShop(true);
    try {
      await getMyShop(); // nếu 200 → đã có shop
      navigate('/shops/me');
    } catch (err: any) {
      const status = err?.response?.status;
      const message: string | undefined = err?.response?.data?.message;

      // BE trả 404 hoặc message "Bạn chưa có shop." → điều hướng tới trang đăng ký shop
      if (status === 404 || message?.includes('chưa có shop')) {
        navigate('/shops/register');
      } else {
        console.error(err);
        alert(message || 'Không kiểm tra được shop của bạn.');
      }
    } finally {
      setCheckingShop(false);
    }
  };

  if (loading)
    return (
      <div className="me-profile-loading">
        Đang tải hồ sơ...
      </div>
    );
  if (error)
    return (
      <div className="me-profile-container">
        <div className="me-profile-card">
          <div className="me-profile-error">{error}</div>
        </div>
      </div>
    );
  if (!profile)
    return (
      <div className="me-profile-container">
        <div className="me-profile-card">
          <div className="me-profile-error">Không tìm thấy user.</div>
        </div>
      </div>
    );

  const avatarSrc = form.avatarUrl || profile.avatarUrl || '';
  const avatarInitial =
    (profile.name && profile.name.charAt(0).toUpperCase()) ||
    (profile.email && profile.email.charAt(0).toUpperCase()) ||
    '?';

  return (
    <div className="me-profile-container">
      <div className="me-profile-card">
        <button
          onClick={() => navigate('/home')}
          className="me-profile-home-button"
        >
          🏠 Về trang chủ
        </button>
        <div className="me-profile-header">
          <div className="me-profile-avatar">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
              />
            ) : (
              avatarInitial
            )}
          </div>
          <h1 className="me-profile-title">
            Hồ sơ cá nhân
          </h1>
          <p className="me-profile-info">
            <strong>Email:</strong> {profile.email}
          </p>
          <p className="me-profile-info">
            <strong>Vai trò:</strong> {profile.role}
          </p>
        </div>

        <div className="me-profile-section">
          <button
            type="button"
            onClick={handleGoShop}
            disabled={checkingShop}
            className="me-profile-button"
            style={{ background: checkingShop ? '#9ca3af' : '#16a34a' }}
          >
            {checkingShop ? 'Đang kiểm tra shop...' : 'Shop của tôi'}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Tên hiển thị
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="me-profile-input"
            />
          </div>

          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="me-profile-input"
            />
          </div>

          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Avatar URL
            </label>
            <input
              type="text"
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              className="me-profile-input"
            />
          </div>

          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Ngày sinh
            </label>
            <input
              type="date"
              name="birthday"
              value={form.birthday || ''}
              onChange={handleChange}
              className="me-profile-input"
            />
          </div>

          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Giới tính
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="me-profile-select"
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <div className="me-profile-form-group">
            <label className="me-profile-label">
              Mật khẩu mới (nếu muốn đổi)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="me-profile-input"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="me-profile-button"
            style={{ background: saving ? '#9ca3af' : '#667eea' }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <button
          onClick={handleDeleteAccount}
          className="me-profile-button me-profile-button-danger"
        >
          Xoá tài khoản của tôi
        </button>
      </div>
    </div>
  );
};

export default MeProfilePage;
