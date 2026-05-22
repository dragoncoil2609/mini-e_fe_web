import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './MeProfilePage.css';

import { clearAccessToken } from '../../api/authToken';
import { getMe, updateMe } from '../../api/users.api';
import type { User } from '../../api/types';

import basketChick from '../../assets/brand/basket_chick.png';
import bunnyBear from '../../assets/brand/bunny_bear_original.png';
import loginBunnyBear from '../../assets/brand/login_bunny_bear.png';

type GenderValue = 'MALE' | 'FEMALE' | 'OTHER' | '';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  gender: GenderValue;
  birthday: string;
  avatarUrl: string;
}

const sidebarItems = [
  {
    label: 'Tổng quan',
    icon: '▦',
    to: '/me',
    disabled: true,
  },
  {
    label: 'Thông tin cá nhân',
    icon: '👤',
    to: '/me',
    active: true,
  },
  {
    label: 'Địa chỉ của tôi',
    icon: '⌖',
    to: '/addresses',
  },
  {
    label: 'Đơn hàng của tôi',
    icon: '▣',
    to: '/orders',
  },
  {
    label: 'Sản phẩm yêu thích',
    icon: '♡',
    to: '#',
    disabled: true,
  },
  {
    label: 'Voucher của tôi',
    icon: '✿',
    to: '#',
    disabled: true,
  },
  {
    label: 'Đổi mật khẩu',
    icon: '🔒',
    to: '#',
    disabled: true,
  },
];

function formatBirthday(value?: string | null) {
  if (!value) return 'Chưa cập nhật';

  const raw = value.slice(0, 10);
  const [year, month, day] = raw.split('-');

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function toInputDate(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function genderLabel(value?: string | null) {
  if (value === 'MALE') return 'Nam';
  if (value === 'FEMALE') return 'Nữ';
  if (value === 'OTHER') return 'Khác';
  return 'Chưa cập nhật';
}

function mapUserToForm(user: User): ProfileForm {
  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    gender: (user.gender as GenderValue) || '',
    birthday: toInputDate(user.birthday),
    avatarUrl: user.avatarUrl || '',
  };
}

function getApiMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function MeProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    avatarUrl: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const avatarSrc = useMemo(() => {
    if (isEditing) {
      return form.avatarUrl.trim() || loginBunnyBear;
    }

    return user?.avatarUrl?.trim() || loginBunnyBear;
  }, [form.avatarUrl, isEditing, user?.avatarUrl]);

  useEffect(() => {
    void fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const data = await getMe();

      setUser(data);
      setForm(mapUserToForm(data));
    } catch (error) {
      setErrorMessage(
        getApiMessage(error, 'Không thể tải thông tin tài khoản.'),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openEditMode() {
    if (!user) return;

    setForm(mapUserToForm(user));
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(true);
  }

  function closeEditMode() {
    if (!user) return;

    setForm(mapUserToForm(user));
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(false);
  }

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErrorMessage('Họ và tên không được để trống.');
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      setErrorMessage('Bạn cần nhập ít nhất email hoặc số điện thoại.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const updated = await updateMe({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        birthday: form.birthday || null,
        gender: form.gender
          ? (form.gender as 'MALE' | 'FEMALE' | 'OTHER')
          : null,
      });

      setUser(updated);
      setForm(mapUserToForm(updated));
      setIsEditing(false);
      setSuccessMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (error) {
      setErrorMessage(
        getApiMessage(error, 'Không thể cập nhật thông tin cá nhân.'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleChangeAvatar() {
    const next = window.prompt(
      'Nhập URL ảnh đại diện mới:',
      form.avatarUrl || user?.avatarUrl || '',
    );

    if (next === null) return;

    updateField('avatarUrl', next.trim());
  }

  function handleLogout() {
    clearAccessToken();
    navigate('/login');
  }

  return (
    <div className="mochi-me-page">
      <div className="mochi-me-container">
        <div className="mochi-me-breadcrumb">
          <Link to="/">← Trang chủ</Link>
          <span>›</span>
          <span>Tài khoản của tôi</span>
          <span>›</span>
          <span>Thông tin cá nhân</span>
          {isEditing && (
            <>
              <span>›</span>
              <strong>Chỉnh sửa ❤</strong>
            </>
          )}
        </div>

        <div className="mochi-me-layout">
          <aside className="mochi-account-sidebar">
            <div className="mochi-sidebar-card">
              <div className="mochi-sidebar-title">
                <span className="mochi-sidebar-title-icon">👤</span>
                <span>Tài khoản của tôi</span>
              </div>

              <nav className="mochi-sidebar-nav">
                {sidebarItems.map((item) => {
                  const className = [
                    'mochi-sidebar-link',
                    item.active ? 'active' : '',
                    item.disabled ? 'disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  if (item.disabled) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={className}
                        disabled
                      >
                        <span className="mochi-sidebar-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <NavLink key={item.label} to={item.to} className={className}>
                      <span className="mochi-sidebar-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <button
                  type="button"
                  className="mochi-sidebar-link logout"
                  onClick={handleLogout}
                >
                  <span className="mochi-sidebar-icon">↪</span>
                  <span>Đăng xuất</span>
                </button>
              </nav>

              <div className="mochi-sidebar-mascot">
                <img src={basketChick} alt="Mochi cute mascot" />
              </div>
            </div>
          </aside>

          <main className="mochi-profile-main">
            <section className="mochi-profile-card">
              {isLoading ? (
                <div className="mochi-profile-state">
                  <div className="mochi-loading-bubble">Đang tải thông tin...</div>
                </div>
              ) : errorMessage && !user ? (
                <div className="mochi-profile-state error">
                  {errorMessage}
                </div>
              ) : !user ? (
                <div className="mochi-profile-state error">
                  Không tìm thấy thông tin người dùng.
                </div>
              ) : (
                <>
                  <div className="mochi-profile-avatar-panel">
                    <div className="mochi-avatar-frame">
                      <img src={avatarSrc} alt="Avatar" />

                      <button
                        type="button"
                        className="mochi-avatar-camera"
                        onClick={() => {
                          if (!isEditing) openEditMode();
                          else handleChangeAvatar();
                        }}
                        title="Đổi ảnh đại diện"
                      >
                        📷
                      </button>
                    </div>

                    <button
                      type="button"
                      className="mochi-change-avatar-btn"
                      onClick={() => {
                        if (!isEditing) openEditMode();
                        else handleChangeAvatar();
                      }}
                    >
                      Đổi ảnh đại diện
                    </button>

                    <p>JPG, PNG tối đa 2MB</p>
                  </div>

                  <div className="mochi-profile-content">
                    {!isEditing ? (
                      <>
                        <h1>Thông tin cá nhân</h1>

                        {successMessage && (
                          <div className="mochi-alert success">
                            {successMessage}
                          </div>
                        )}

                        {errorMessage && (
                          <div className="mochi-alert error">
                            {errorMessage}
                          </div>
                        )}

                        <div className="mochi-info-list">
                          <div className="mochi-info-row">
                            <div className="mochi-info-label">
                              <span>♙</span>
                              <p>Họ và tên</p>
                            </div>
                            <div className="mochi-info-value">
                              {user.name || 'Chưa cập nhật'}
                            </div>
                            <button type="button" onClick={openEditMode}>
                              Chỉnh sửa
                            </button>
                          </div>

                          <div className="mochi-info-row">
                            <div className="mochi-info-label">
                              <span>✉</span>
                              <p>Email</p>
                            </div>
                            <div className="mochi-info-value">
                              {user.email || 'Chưa cập nhật'}
                            </div>
                            <button type="button" onClick={openEditMode}>
                              Chỉnh sửa
                            </button>
                          </div>

                          <div className="mochi-info-row">
                            <div className="mochi-info-label">
                              <span>☎</span>
                              <p>Số điện thoại</p>
                            </div>
                            <div className="mochi-info-value">
                              {user.phone || 'Chưa cập nhật'}
                            </div>
                            <button type="button" onClick={openEditMode}>
                              Chỉnh sửa
                            </button>
                          </div>

                          <div className="mochi-info-row">
                            <div className="mochi-info-label">
                              <span>⚲</span>
                              <p>Giới tính</p>
                            </div>
                            <div className="mochi-info-value">
                              {genderLabel(user.gender)}
                            </div>
                            <button type="button" onClick={openEditMode}>
                              Chỉnh sửa
                            </button>
                          </div>

                          <div className="mochi-info-row">
                            <div className="mochi-info-label">
                              <span>▣</span>
                              <p>Ngày sinh</p>
                            </div>
                            <div className="mochi-info-value">
                              {formatBirthday(user.birthday)}
                            </div>
                            <button type="button" onClick={openEditMode}>
                              Chỉnh sửa
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1>Chỉnh sửa thông tin cá nhân</h1>

                        {errorMessage && (
                          <div className="mochi-alert error">
                            {errorMessage}
                          </div>
                        )}

                        <div className="mochi-edit-form">
                          <div className="mochi-form-field">
                            <label htmlFor="profile-name">
                              Họ và tên <span>*</span>
                            </label>
                            <input
                              id="profile-name"
                              value={form.name}
                              onChange={(event) =>
                                updateField('name', event.target.value)
                              }
                              placeholder="Nhập họ và tên"
                            />
                          </div>

                          <div className="mochi-form-field">
                            <label htmlFor="profile-email">
                              Email <span>*</span>
                            </label>
                            <input
                              id="profile-email"
                              type="email"
                              value={form.email}
                              onChange={(event) =>
                                updateField('email', event.target.value)
                              }
                              placeholder="Nhập email"
                            />
                          </div>

                          <div className="mochi-form-field">
                            <label htmlFor="profile-phone">
                              Số điện thoại <span>*</span>
                            </label>
                            <input
                              id="profile-phone"
                              value={form.phone}
                              onChange={(event) =>
                                updateField('phone', event.target.value)
                              }
                              placeholder="Nhập số điện thoại"
                            />
                          </div>

                          <div className="mochi-form-field">
                            <label htmlFor="profile-gender">
                              Giới tính <span>*</span>
                            </label>
                            <select
                              id="profile-gender"
                              value={form.gender}
                              onChange={(event) =>
                                updateField(
                                  'gender',
                                  event.target.value as GenderValue,
                                )
                              }
                            >
                              <option value="">Chọn giới tính</option>
                              <option value="FEMALE">Nữ</option>
                              <option value="MALE">Nam</option>
                              <option value="OTHER">Khác</option>
                            </select>
                          </div>

                          <div className="mochi-form-field">
                            <label htmlFor="profile-birthday">
                              Ngày sinh <span>*</span>
                            </label>
                            <input
                              id="profile-birthday"
                              type="date"
                              value={form.birthday}
                              onChange={(event) =>
                                updateField('birthday', event.target.value)
                              }
                            />
                          </div>

                          <div className="mochi-form-field">
                            <label htmlFor="profile-avatar">
                              URL ảnh đại diện
                            </label>
                            <input
                              id="profile-avatar"
                              value={form.avatarUrl}
                              onChange={(event) =>
                                updateField('avatarUrl', event.target.value)
                              }
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div className="mochi-edit-actions">
                          <button
                            type="button"
                            className="mochi-cancel-btn"
                            onClick={closeEditMode}
                            disabled={isSaving}
                          >
                            Hủy bỏ
                          </button>

                          <button
                            type="button"
                            className="mochi-save-btn"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mochi-profile-hero">
                    <img src={bunnyBear} alt="Bunny decoration" />
                  </div>
                </>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}