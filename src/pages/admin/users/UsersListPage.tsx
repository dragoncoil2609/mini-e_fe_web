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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          width: 480,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2>{isEdit ? 'Sửa user' : 'Tạo user mới'}</h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
          }}
        >
          <label>
            Tên
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Mật khẩu {isEdit && '(bỏ trống nếu không đổi)'}
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Số điện thoại
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Avatar URL
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Ngày sinh
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Giới tính
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            >
              <option value="">-- Chọn --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>

          <label>
            Vai trò
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{ width: '100%', padding: 6, marginTop: 4 }}
            >
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              name="isVerified"
              checked={form.isVerified}
              onChange={handleChange}
            />
            Đã xác minh email?
          </label>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
              }}
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
    <div style={{ padding: 16 }}>
      <h1>Quản lý user</h1>

      <div
        style={{
          margin: '16px 0',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            placeholder="Tìm theo tên / email / phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ padding: 6, minWidth: 260 }}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        {/* Nút sang danh sách user đã xoá mềm */}
        <button
          type="button"
          onClick={() => navigate('/admin/users/deleted')}
          style={{
            marginLeft: 8,
            padding: '6px 10px',
            borderRadius: 4,
            border: '1px solid #ddd',
            cursor: 'pointer',
          }}
        >
          User đã xoá mềm
        </button>

        <button
          style={{
            marginLeft: 'auto',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 4,
            padding: '6px 10px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          + Tạo user
        </button>
      </div>

      {loading && <div>Đang tải...</div>}

      {!loading && list && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Tên
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Verified
                </th>
                <th
                  style={{
                    borderBottom: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{
                      borderBottom: '1px solid #eee',
                      padding: '4px 0',
                    }}
                  >
                    {u.id}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.name}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.email}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.role}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>
                    {u.isVerified ? '✔️' : '❌'}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee' }}>
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setModalOpen(true);
                      }}
                    >
                      Sửa
                    </button>{' '}
                    <button onClick={() => handleSoftDelete(u.id)}>
                      Xoá mềm
                    </button>{' '}
                    <button onClick={() => handleHardDelete(u.id)}>
                      Xoá vĩnh viễn
                    </button>
                  </td>
                </tr>
              ))}

              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 8 }}>
                    Không có user nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              Trang {list.page} / {totalPages || 1} — Tổng: {list.total} user
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={list.page <= 1}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: (prev.page || 1) - 1,
                  }))
                }
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
