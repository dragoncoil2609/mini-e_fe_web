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

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '18px',
        }}
      >
        Đang tải hồ sơ...
      </div>
    );
  if (error)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#f8f9fa',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      </div>
    );
  if (!profile)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#f8f9fa',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          Không tìm thấy user.
        </div>
      </div>
    );

  const avatarSrc = form.avatarUrl || profile.avatarUrl || '';
  const avatarInitial =
    (profile.name && profile.name.charAt(0).toUpperCase()) ||
    (profile.email && profile.email.charAt(0).toUpperCase()) ||
    '?';

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
          maxWidth: '700px',
          margin: '0 auto',
          background: '#f8f9fa',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        <button
          onClick={() => navigate('/home')}
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            padding: '10px 20px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5568d3';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#667eea';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🏠 Về trang chủ
        </button>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#4b5563',
              margin: '0 auto 20px',
              border: '4px solid #667eea',
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
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
            }}
          >
            Hồ sơ cá nhân
          </h1>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
            <strong>Email:</strong> {profile.email}
          </p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
            <strong>Vai trò:</strong> {profile.role}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleGoShop}
            disabled={checkingShop}
            style={{
              width: '100%',
              padding: '14px',
              background: checkingShop ? '#9ca3af' : '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: checkingShop ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
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
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Tên hiển thị
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
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

          <div>
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
              name="phone"
              value={form.phone}
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Avatar URL
            </label>
            <input
              type="text"
              name="avatarUrl"
              value={form.avatarUrl}
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Ngày sinh
            </label>
            <input
              type="date"
              name="birthday"
              value={form.birthday || ''}
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Giới tính
            </label>
            <select
              name="gender"
              value={form.gender}
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
                background: '#fff',
                cursor: 'pointer',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Mật khẩu mới (nếu muốn đổi)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
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
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#9ca3af' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              marginTop: '8px',
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <button
          onClick={handleDeleteAccount}
          style={{
            width: '100%',
            padding: '14px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
        >
          Xoá tài khoản của tôi
        </button>
      </div>
    </div>
  );
};

export default MeProfilePage;
