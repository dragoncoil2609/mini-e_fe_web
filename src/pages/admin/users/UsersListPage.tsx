// src/pages/admin/UsersListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getUsers,
  createUser,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
} from '../../../api/users.api';
import type { CreateUserPayload, UpdateUserPayload } from '../../../api/users.api';
import type { User, UserListQuery } from '../../../api/types';
import './UsersListPage.css';

interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

// ================== MODAL TẠO / SỬA USER ==================

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingUser: User | null;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  avatarUrl: string;
  birthday: string;
  gender: '' | 'MALE' | 'FEMALE' | 'OTHER';
  role: 'USER' | 'SELLER' | 'ADMIN';
  isVerified: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  onClose,
  onSaved,
  editingUser,
}) => {
  const [form, setForm] = useState<UserFormState>({
    name: '',
    email: '',
    password: '',
    phone: '',
    avatarUrl: '',
    birthday: '',
    gender: '',
    role: 'USER',
    isVerified: false,
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!editingUser;

  React.useEffect(() => {
    if (editingUser) {
      setForm({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '',
        phone: editingUser.phone || '',
        avatarUrl: editingUser.avatarUrl || '',
        birthday: editingUser.birthday || '',
        gender: (editingUser.gender as any) || '',
        role: editingUser.role,
        isVerified: editingUser.isVerified,
      });
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        avatarUrl: '',
        birthday: '',
        gender: '',
        role: 'USER',
        isVerified: false,
      });
    }
  }, [editingUser, open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (isEdit && editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          avatarUrl: form.avatarUrl || null,
          birthday: form.birthday || null,
          gender: (form.gender as any) || null,
          role: form.role,
          isVerified: form.isVerified,
        };

        if (form.password) {
          payload.password = form.password;
        }

        await updateUser(editingUser.id, payload);
      } else {
        if (!form.password) {
          alert('Vui lòng nhập mật khẩu cho user mới');
          return;
        }

        const payload: CreateUserPayload = {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          avatarUrl: form.avatarUrl || undefined,
          birthday: form.birthday || undefined,
          gender: (form.gender as any) || undefined,
          role: form.role,
          isVerified: form.isVerified,
        };

        await createUser(payload);
      }

      alert(isEdit ? 'Cập nhật user thành công!' : 'Tạo user thành công!');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Lưu user thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-form-modal-overlay">
      <div className="user-form-modal-content">
        <h2 className="user-form-modal-title">
          {isEdit ? 'Sửa user' : 'Tạo user mới'}
        </h2>

        <form onSubmit={handleSubmit} className="user-form-modal-form">
          <label className="user-form-modal-label">
            Tên
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Mật khẩu {isEdit && '(bỏ trống nếu không đổi)'}
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Số điện thoại
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Avatar URL
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Ngày sinh
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
              className="user-form-modal-input"
            />
          </label>

          <label className="user-form-modal-label">
            Giới tính
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="user-form-modal-select"
            >
              <option value="">-- Chọn --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>

          <label className="user-form-modal-label">
            Vai trò
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="user-form-modal-select"
            >
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label className="user-form-modal-checkbox-label">
            <input
              type="checkbox"
              name="isVerified"
              checked={form.isVerified}
              onChange={handleChange}
              className="user-form-modal-checkbox"
            />
            Đã xác minh email?
          </label>

          <div className="user-form-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="user-form-modal-cancel-button"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="user-form-modal-save-button"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================== PAGE LIST USER ==================

const UsersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [list, setList] = useState<UserListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<UserListQuery>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async (params: UserListQuery = query) => {
    try {
      setLoading(true);
      const data = await getUsers(params);
      setList(data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Không load được danh sách user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: searchInput || undefined,
    }));
  };

  const handleSoftDelete = async (id: number) => {
    if (!window.confirm('Xoá mềm user này?')) return;
    try {
      await softDeleteUser(id);
      await loadUsers(query);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Xoá mềm thất bại');
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!window.confirm('Xoá vĩnh viễn user này?')) return;
    try {
      await hardDeleteUser(id);
      await loadUsers(query);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Xoá vĩnh viễn thất bại');
    }
  };

  const totalPages =
    list && list.limit > 0 ? Math.ceil(list.total / list.limit) : 1;

  return (
    <div className="users-list-container">
      <h1 className="users-list-title">Quản lý user</h1>

      <div className="users-list-toolbar">
        <form
          onSubmit={handleSearchSubmit}
          className="users-list-search-form"
        >
          <input
            placeholder="Tìm theo tên / email / phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="users-list-search-input"
          />
          <button type="submit" className="users-list-search-button">
            Tìm kiếm
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/admin/users/deleted')}
          className="users-list-deleted-button"
        >
          User đã xoá mềm
        </button>

        <button
          className="users-list-create-button"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          + Tạo user
        </button>
      </div>

      {loading && <div className="users-list-loading">Đang tải...</div>}

      {!loading && list && (
        <>
          <table className="users-list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isVerified ? '✔️' : '❌'}</td>
                  <td>
                    <div className="users-list-action-buttons">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setModalOpen(true);
                        }}
                        className="users-list-edit-button"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleSoftDelete(u.id)}
                        className="users-list-soft-delete-button"
                      >
                        Xoá mềm
                      </button>
                      <button
                        onClick={() => handleHardDelete(u.id)}
                        className="users-list-hard-delete-button"
                      >
                        Xoá vĩnh viễn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="users-list-table-empty">
                    Không có user nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="users-list-pagination">
            <div className="users-list-pagination-info">
              Trang {list.page} / {totalPages || 1} — Tổng: {list.total} user
            </div>
            <div className="users-list-pagination-buttons">
              <button
                disabled={list.page <= 1}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: (prev.page || 1) - 1,
                  }))
                }
                className="users-list-pagination-button"
              >
                &lt; Trước
              </button>
              <button
                disabled={list.page >= totalPages}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: (prev.page || 1) + 1,
                  }))
                }
                className="users-list-pagination-button"
              >
                Sau &gt;
              </button>
            </div>
          </div>
        </>
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingUser={editingUser}
        onSaved={() => loadUsers(query)}
      />
    </div>
  );
};

export default UsersListPage;
