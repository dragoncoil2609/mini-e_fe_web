import React, { useEffect, useMemo, useState } from 'react';
import {
  createUser,
  getUsers,
  hardDeleteUser,
  softDeleteUser,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../../../api/users.api';
import type { Gender, User, UserRole } from '../../../api/types';
import './style/AdminUsersPage.css';

const ROOT_ADMIN_EMAIL = 'admin123@admin.com';

function isProtectedUser(user: User | null | undefined) {
  if (!user) return false;
  return user.email === ROOT_ADMIN_EMAIL || (user as any).isSystem === true;
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  pageCount?: number;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl: string;
  birthday: string;
  gender: '' | Gender;
  role: UserRole;
  isVerified: boolean;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  avatarUrl: '',
  birthday: '',
  gender: '',
  role: 'USER',
  isVerified: false,
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<ListMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pageCount: 1,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const protectedEditing = useMemo(() => isProtectedUser(editingUser), [editingUser]);

  const loadData = async (page = meta.page, limit = meta.limit, keyword = search) => {
    try {
      setLoading(true);
      const data = await getUsers({
        page,
        limit,
        search: keyword || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      setItems(Array.isArray(data.items) ? data.items : []);
      setMeta({
        page: Number(data.meta?.page || 1),
        limit: Number(data.meta?.limit || 10),
        total: Number(data.meta?.total || 0),
        pageCount: Number(data.meta?.pageCount || 1),
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Không tải được danh sách user',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1, 10, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      avatarUrl: user.avatarUrl || '',
      birthday: user.birthday || '',
      gender: (user.gender as any) || '',
      role: user.role,
      isVerified: !!user.isVerified,
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditingUser(null);
    setForm(emptyForm);
    setSaving(false);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập họ tên.';
    if (!form.email.trim() && !form.phone.trim()) {
      return 'Phải nhập email hoặc số điện thoại.';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Email không hợp lệ.';
    }
    if (form.phone.trim() && !/^(?:\+?84|0)\d{9,10}$/.test(form.phone.trim())) {
      return 'Số điện thoại không hợp lệ.';
    }
    if (!editingUser && !form.password.trim()) {
      return 'Vui lòng nhập mật khẩu.';
    }
    if (form.password.trim() && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password.trim())) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.';
    }
    return '';
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const validateMessage = validate();
    if (validateMessage) {
      setToast({ type: 'error', message: validateMessage });
      return;
    }

    if (editingUser && protectedEditing) {
      setToast({ type: 'error', message: 'Không được sửa tài khoản admin gốc.' });
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          password: form.password.trim() || undefined,
          avatarUrl: form.avatarUrl.trim() || undefined,
          birthday: form.birthday || undefined,
          gender: (form.gender as any) || undefined,
          role: form.role,
          isVerified: form.isVerified,
        };

        await updateUser(editingUser.id, payload);
        setToast({ type: 'success', message: 'Cập nhật user thành công.' });
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          password: form.password.trim(),
          avatarUrl: form.avatarUrl.trim() || undefined,
          birthday: form.birthday || undefined,
          gender: (form.gender as any) || undefined,
          role: form.role,
          isVerified: form.isVerified,
        };

        await createUser(payload);
        setToast({ type: 'success', message: 'Tạo user thành công.' });
      }

      closeForm();
      await loadData(meta.page, meta.limit, search);
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Lưu user thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (user: User) => {
    if (isProtectedUser(user)) {
      setToast({ type: 'error', message: 'Không được xoá tài khoản admin gốc.' });
      return;
    }

    if (!window.confirm(`Xoá mềm user "${user.name}"?`)) return;

    try {
      await softDeleteUser(user.id);
      setToast({ type: 'success', message: 'Đã xoá mềm user.' });
      await loadData(meta.page, meta.limit, search);
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Xoá mềm thất bại',
      });
    }
  };

  const handleHardDelete = async (user: User) => {
    if (isProtectedUser(user)) {
      setToast({ type: 'error', message: 'Không được xoá tài khoản admin gốc.' });
      return;
    }

    if (!window.confirm(`Xoá cứng user "${user.name}"? Hành động này khó khôi phục.`)) return;

    try {
      await hardDeleteUser(user.id);
      setToast({ type: 'success', message: 'Đã xoá cứng user.' });
      await loadData(meta.page, meta.limit, search);
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Xoá cứng thất bại',
      });
    }
  };

  const submitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadData(1, meta.limit, search);
  };

  return (
    <div className="admin-users">
      <div className="admin-users__topbar">
        <div className="admin-users__titlewrap">
          <h1 className="admin-users__title">Quản lý người dùng</h1>
          <div className="admin-users__subtitle">
            Danh sách user đang hoạt động trong hệ thống.
          </div>
        </div>

        <div className="admin-users__top-actions">
          <button className="btn btn--ghost" onClick={() => (window.location.href = '/admin/users/deleted')}>
            User đã xoá
          </button>
          <button className="btn btn--primary" onClick={openCreate}>
            + Thêm user
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-toolbar__search" onSubmit={submitSearch}>
            <input
              className="input"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn--primary">
              Tìm
            </button>
          </form>
        </div>

        {loading ? (
          <div className="admin-loading">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="empty">Không có user nào.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Role</th>
                  <th>Xác minh</th>
                  <th>Tạo lúc</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const protectedUser = isProtectedUser(user);

                  return (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} />
                            ) : (
                              <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <div className="stack">
                            <div className="user-cell__name">{user.name}</div>
                            {protectedUser && <span className="badge badge--amber">ROOT ADMIN</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="stack">
                          <span>{user.email || '—'}</span>
                          <span className="muted">{user.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'ADMIN' ? 'badge--blue' : 'badge--gray'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isVerified ? 'badge--green' : 'badge--red'}`}>
                          {user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                      <td className="col-actions">
                        <div className="actions">
                          <button
                            className="btn btn--ghost btn--sm"
                            type="button"
                            onClick={() => openEdit(user)}
                            disabled={protectedUser}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn--warning btn--sm"
                            type="button"
                            onClick={() => void handleSoftDelete(user)}
                            disabled={protectedUser}
                          >
                            Xoá mềm
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            type="button"
                            onClick={() => void handleHardDelete(user)}
                            disabled={protectedUser}
                          >
                            Xoá cứng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <div className="muted">
            Trang {meta.page}/{meta.pageCount || 1} — Tổng {meta.total} user
          </div>

          <div className="pager__btns">
            <button
              className="btn btn--ghost btn--sm"
              disabled={meta.page <= 1}
              onClick={() => void loadData(meta.page - 1, meta.limit, search)}
            >
              Trước
            </button>
            <button
              className="btn btn--ghost btn--sm"
              disabled={meta.page >= (meta.pageCount || 1)}
              onClick={() => void loadData(meta.page + 1, meta.limit, search)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {openForm && (
        <div className="admin-modal-overlay" onMouseDown={closeForm}>
          <div className="admin-modal admin-modal--lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {editingUser ? 'Cập nhật user' : 'Tạo user mới'}
              </h3>
            </div>

            <form className="user-form" onSubmit={handleSubmitForm}>
              <div className="user-form__grid">
                <div>
                  <label className="field__label">Họ tên</label>
                  <input
                    className="field__input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field__label">Email</label>
                  <input
                    className="field__input"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={protectedEditing}
                  />
                </div>

                <div>
                  <label className="field__label">Số điện thoại</label>
                  <input
                    className="field__input"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field__label">
                    {editingUser ? 'Mật khẩu mới (nếu đổi)' : 'Mật khẩu'}
                  </label>
                  <input
                    className="field__input"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    disabled={protectedEditing}
                  />
                </div>

                <div>
                  <label className="field__label">Avatar URL</label>
                  <input
                    className="field__input"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field__label">Ngày sinh</label>
                  <input
                    className="field__input"
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field__label">Giới tính</label>
                  <select
                    className="field__select"
                    value={form.gender}
                    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as any }))}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="field__label">Role</label>
                  <select
                    className="field__select"
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                    disabled={protectedEditing}
                  >
                    <option value="USER">USER</option>
                    <option value="SELLER">SELLER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => setForm((prev) => ({ ...prev, isVerified: e.target.checked }))}
                  disabled={protectedEditing}
                />
                Tài khoản đã xác minh
              </label>

              <div className="admin-modal__actions" style={{ paddingInline: 0, borderTop: 'none' }}>
                <button type="button" className="btn btn--ghost" onClick={closeForm}>
                  Huỷ
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingUser ? 'Lưu thay đổi' : 'Tạo user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`} role="status">
          <div className="admin-toast__dot" />
          <div className="admin-toast__text">{toast.message}</div>
          <button
            className="admin-toast__close"
            type="button"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}