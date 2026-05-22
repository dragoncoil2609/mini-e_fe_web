import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './MeProfilePage.css';

import AccountSidebar from '../../components/account/AccountSidebar';
import { getMe, updateMe } from '../../api/users.api';
import type { User } from '../../api/types';

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

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  onEdit: () => void;
}

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
  return error?.response?.data?.message || error?.message || fallback;
}

function InfoRow({ icon, label, value, onEdit }: InfoRowProps) {
  return (
    <div className="me-info-row">
      <div className="me-info-label">
        <span>{icon}</span>
        <p>{label}</p>
      </div>

      <div className="me-info-value">{value}</div>

      <button type="button" onClick={onEdit}>
        Chỉnh sửa
      </button>
    </div>
  );
}

export default function MeProfilePage() {
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

  return (
    <div className="mochi-page me-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>›</span>
          <span>Tài khoản của tôi</span>
          <span>›</span>
          <strong>Thông tin cá nhân</strong>

          {isEditing && (
            <>
              <span>›</span>
              <strong>Chỉnh sửa</strong>
            </>
          )}
        </div>

        <div className="me-layout">
          <aside className="me-sidebar">
            <AccountSidebar />
          </aside>

          <main className="me-main">
            <section className="mochi-card me-profile-card">
              {isLoading ? (
                <div className="me-state">
                  <span>Đang tải thông tin...</span>
                </div>
              ) : errorMessage && !user ? (
                <div className="me-state error">{errorMessage}</div>
              ) : !user ? (
                <div className="me-state error">
                  Không tìm thấy thông tin người dùng.
                </div>
              ) : (
                <>
                  <div className="me-avatar-panel">
                    <div className="me-avatar-frame">
                      <img src={avatarSrc} alt="Avatar" />

                      <button
                        type="button"
                        className="me-avatar-camera"
                        onClick={() => {
                          if (!isEditing) {
                            openEditMode();
                          } else {
                            handleChangeAvatar();
                          }
                        }}
                        title="Đổi ảnh đại diện"
                      >
                        📷
                      </button>
                    </div>

                    <button
                      type="button"
                      className="mochi-btn mochi-btn-outline mochi-btn-sm me-avatar-btn"
                      onClick={() => {
                        if (!isEditing) {
                          openEditMode();
                        } else {
                          handleChangeAvatar();
                        }
                      }}
                    >
                      Đổi ảnh đại diện
                    </button>

                    <p>Nhập URL ảnh đại diện</p>
                  </div>

                  <div className="me-profile-content">
                    {!isEditing ? (
                      <>
                        <h1 className="me-profile-title">Thông tin cá nhân</h1>

                        {successMessage && (
                          <div className="me-alert success">
                            {successMessage}
                          </div>
                        )}

                        {errorMessage && (
                          <div className="me-alert error">{errorMessage}</div>
                        )}

                        <div className="me-info-list">
                          <InfoRow
                            icon="♙"
                            label="Họ và tên"
                            value={user.name || 'Chưa cập nhật'}
                            onEdit={openEditMode}
                          />

                          <InfoRow
                            icon="✉"
                            label="Email"
                            value={user.email || 'Chưa cập nhật'}
                            onEdit={openEditMode}
                          />

                          <InfoRow
                            icon="☎"
                            label="Số điện thoại"
                            value={user.phone || 'Chưa cập nhật'}
                            onEdit={openEditMode}
                          />

                          <InfoRow
                            icon="⚲"
                            label="Giới tính"
                            value={genderLabel(user.gender)}
                            onEdit={openEditMode}
                          />

                          <InfoRow
                            icon="▣"
                            label="Ngày sinh"
                            value={formatBirthday(user.birthday)}
                            onEdit={openEditMode}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="me-profile-title">
                          Chỉnh sửa thông tin cá nhân
                        </h1>

                        {errorMessage && (
                          <div className="me-alert error">{errorMessage}</div>
                        )}

                        <div className="mochi-form me-edit-form">
                          <div className="mochi-form-row">
                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-name"
                              >
                                Họ và tên{' '}
                                <span className="me-required">*</span>
                              </label>

                              <input
                                id="profile-name"
                                className="mochi-input"
                                value={form.name}
                                onChange={(event) =>
                                  updateField('name', event.target.value)
                                }
                                placeholder="Nhập họ và tên"
                              />
                            </div>

                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-email"
                              >
                                Email
                              </label>

                              <input
                                id="profile-email"
                                className="mochi-input"
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                  updateField('email', event.target.value)
                                }
                                placeholder="Nhập email"
                              />
                            </div>
                          </div>

                          <div className="mochi-form-row">
                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-phone"
                              >
                                Số điện thoại
                              </label>

                              <input
                                id="profile-phone"
                                className="mochi-input"
                                value={form.phone}
                                onChange={(event) =>
                                  updateField('phone', event.target.value)
                                }
                                placeholder="Nhập số điện thoại"
                              />
                            </div>

                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-gender"
                              >
                                Giới tính
                              </label>

                              <select
                                id="profile-gender"
                                className="mochi-select"
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
                          </div>

                          <div className="mochi-form-row">
                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-birthday"
                              >
                                Ngày sinh
                              </label>

                              <input
                                id="profile-birthday"
                                className="mochi-input"
                                type="date"
                                value={form.birthday}
                                onChange={(event) =>
                                  updateField('birthday', event.target.value)
                                }
                              />
                            </div>

                            <div className="mochi-form-group">
                              <label
                                className="mochi-label"
                                htmlFor="profile-avatar"
                              >
                                URL ảnh đại diện
                              </label>

                              <input
                                id="profile-avatar"
                                className="mochi-input"
                                value={form.avatarUrl}
                                onChange={(event) =>
                                  updateField('avatarUrl', event.target.value)
                                }
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="me-edit-actions">
                          <button
                            type="button"
                            className="mochi-btn mochi-btn-outline"
                            onClick={closeEditMode}
                            disabled={isSaving}
                          >
                            Hủy bỏ
                          </button>

                          <button
                            type="button"
                            className="mochi-btn mochi-btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="me-profile-hero">
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