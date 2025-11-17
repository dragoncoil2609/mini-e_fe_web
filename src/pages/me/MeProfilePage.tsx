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

  if (loading) return <div style={{ padding: 16 }}>Đang tải hồ sơ...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;
  if (!profile) return <div style={{ padding: 16 }}>Không tìm thấy user.</div>;

  // Avatar hiển thị: ưu tiên form.avatarUrl (đang nhập), sau đó profile.avatarUrl
  const avatarSrc = form.avatarUrl || profile.avatarUrl || '';
  const avatarInitial =
    (profile.name && profile.name.charAt(0).toUpperCase()) ||
    (profile.email && profile.email.charAt(0).toUpperCase()) ||
    '?';

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '24px auto',
        padding: 16,
        border: '1px solid #ddd',
        borderRadius: 8,
      }}
    >
      {/* Header + Avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Vòng tròn avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#4b5563',
            flexShrink: 0,
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            avatarInitial
          )}
        </div>

        <div>
          <h1 style={{ margin: 0, marginBottom: 4 }}>Hồ sơ cá nhân</h1>
          <p style={{ margin: 0 }}>
            <strong>Email:</strong> {profile.email}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Vai trò:</strong> {profile.role}
          </p>
        </div>
      </div>

      {/* Nút Shop */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleGoShop}
          disabled={checkingShop}
          style={{
            padding: '8px 16px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {checkingShop ? 'Đang kiểm tra shop...' : 'Shop của tôi'}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <label>
          Tên hiển thị
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Số điện thoại
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Avatar URL
          <input
            type="text"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Ngày sinh
          <input
            type="date"
            name="birthday"
            value={form.birthday || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Giới tính
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </label>

        <label>
          Mật khẩu mới (nếu muốn đổi)
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '8px 16px',
            marginTop: 8,
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <hr style={{ margin: '24px 0' }} />

      <button
        onClick={handleDeleteAccount}
        style={{
          padding: '8px 16px',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Xoá tài khoản của tôi
      </button>
    </div>
  );
};

export default MeProfilePage;
