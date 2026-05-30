import { useEffect, useMemo, useState } from 'react';
import {
  FiEdit3,
  FiEye,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUsers,
  FiShield,
  FiShoppingBag,
} from 'react-icons/fi';

import {
  createUser,
  getUsers,
  softDeleteUser,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../../../api/users.api';
import type { User, UserRole } from '../../../api/types';

import './style/AdminUsersPage.css';
import { Link } from 'react-router-dom';

type RoleFilter = '' | UserRole;
type StatusFilter = '' | 'VERIFIED' | 'UNVERIFIED';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'USER' as UserRole,
  gender: '' as '' | 'MALE' | 'FEMALE' | 'OTHER',
  birthday: '',
  avatarUrl: '',
  isVerified: true,
};

function roleLabel(role: UserRole) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SELLER') return 'Seller';
  return 'User';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const pageCount = Math.max(Math.ceil(total / limit), 1);

  const stats = useMemo(() => {
    return {
      total,
      users: users.filter((u) => u.role === 'USER').length,
      sellers: users.filter((u) => u.role === 'SELLER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      blocked: users.filter((u) => !u.isVerified).length,
    };
  }, [users, total]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setMessage('');

      const data = await getUsers({
        page,
        limit,
        search: search.trim() || undefined,
        role: role || undefined,
        isVerified:
          status === 'VERIFIED'
            ? true
            : status === 'UNVERIFIED'
              ? false
              : undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      setUsers(data.items);
      setTotal(data.meta.total);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || 'Không thể tải danh sách người dùng',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
  }, [page, role, status]);

  function openCreate() {
    setSelectedUser(null);
    setForm(emptyForm);
    setModalMode('create');
  }

  function openView(user: User) {
    setSelectedUser(user);
    setModalMode('view');
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      gender: user.gender || '',
      birthday: user.birthday?.slice(0, 10) || '',
      avatarUrl: user.avatarUrl || '',
      isVerified: user.isVerified,
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    try {
      setLoading(true);

      if (modalMode === 'create') {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          password: form.password,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          role: form.role,
          gender: form.gender || null,
          birthday: form.birthday || null,
          avatarUrl: form.avatarUrl.trim() || null,
          isVerified: form.isVerified,
        };

        await createUser(payload);
      }

      if (modalMode === 'edit' && selectedUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          role: form.role,
          gender: form.gender || null,
          birthday: form.birthday || null,
          avatarUrl: form.avatarUrl.trim() || null,
          isVerified: form.isVerified,
        };

        if (form.password.trim()) payload.password = form.password;

        await updateUser(selectedUser.id, payload);
      }

      closeModal();
      await fetchUsers();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Lưu người dùng thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: User) {
    const ok = window.confirm(`Bạn chắc muốn xóa mềm user "${user.name}"?`);
    if (!ok) return;

    try {
      await softDeleteUser(user.id);
      await fetchUsers();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Xóa user thất bại');
    }
  }

  function handleSearchSubmit() {
    if (page === 1) {
      void fetchUsers();
      return;
    }

    setPage(1);
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Trang chủ › Quản lý người dùng</p>
        </div>

        <div className="admin-users-header-actions">
          <Link to="/admin/users/deleted" className="admin-users-deleted-btn">
            <FiTrash2 />
            User đã xóa
          </Link>

          <button className="admin-users-primary-btn" onClick={openCreate}>
            <FiPlus />
            Thêm người dùng
          </button>
        </div>
      </div>

      <div className="admin-users-stats">
        <StatCard icon={<FiUsers />} label="Tổng người dùng" value={stats.total} />
        <StatCard icon={<FiUser />} label="Người dùng" value={stats.users} />
        <StatCard icon={<FiShoppingBag />} label="Người bán" value={stats.sellers} />
        <StatCard icon={<FiShield />} label="Quản trị viên" value={stats.admins} />
        <StatCard icon={<FiLock />} label="Chưa xác thực" value={stats.blocked} />
      </div>

      <section className="admin-users-card">
        <div className="admin-users-filter">
          <div className="admin-users-search">
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
            />
          </div>

          <select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)}>
            <option value="">Vai trò: Tất cả</option>
            <option value="USER">User</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="">Trạng thái: Tất cả</option>
            <option value="VERIFIED">Đã xác thực</option>
            <option value="UNVERIFIED">Chưa xác thực</option>
          </select>

          <button onClick={handleSearchSubmit}>
            <FiRefreshCw />
            Lọc
          </button>
        </div>

        {message && <div className="admin-users-message">{message}</div>}

        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="admin-users-empty">Đang tải...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-users-empty">Chưa có người dùng</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>
                      <div className="admin-users-user">
                        <img src={user.avatarUrl || '/src/assets/brand/login_bunny_bear.png'} />
                        <div>
                          <strong>{user.name}</strong>
                          <span>ID: {user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || '—'}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <span className={`admin-users-role ${user.role.toLowerCase()}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={user.isVerified ? 'admin-users-status active' : 'admin-users-status lock'}>
                        {user.isVerified ? 'Hoạt động' : 'Chưa xác thực'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-users-actions">
                        <button onClick={() => openView(user)}><FiEye /></button>
                        <button onClick={() => openEdit(user)}><FiEdit3 /></button>
                        <button onClick={() => handleDelete(user)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-pagination">
          <span>Hiển thị {users.length} / {total} người dùng</span>

          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <strong>{page}</strong>
            <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        </div>
      </section>

      {modalMode && (
        <div className="admin-users-modal-backdrop">
          <div className="admin-users-modal">
            <h2>
              {modalMode === 'create' && 'Thêm người dùng'}
              {modalMode === 'edit' && 'Chỉnh sửa người dùng'}
              {modalMode === 'view' && 'Chi tiết người dùng'}
            </h2>

            {modalMode === 'view' && selectedUser ? (
              <div className="admin-users-detail">
                <p><b>Họ tên:</b> {selectedUser.name}</p>
                <p><b>Email:</b> {selectedUser.email || '—'}</p>
                <p><b>SĐT:</b> {selectedUser.phone || '—'}</p>
                <p><b>Vai trò:</b> {roleLabel(selectedUser.role)}</p>
                <p><b>Trạng thái:</b> {selectedUser.isVerified ? 'Hoạt động' : 'Chưa xác thực'}</p>
                <p><b>Ngày tạo:</b> {formatDate(selectedUser.createdAt)}</p>
              </div>
            ) : (
              <div className="admin-users-form">
                <input placeholder="Họ và tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input placeholder="URL avatar" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
                <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />

                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                  <option value="">Giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>

                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  <option value="USER">User</option>
                  <option value="SELLER">Seller</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <select value={String(form.isVerified)} onChange={(e) => setForm({ ...form, isVerified: e.target.value === 'true' })}>
                  <option value="true">Hoạt động</option>
                  <option value="false">Chưa xác thực</option>
                </select>

                <input
                  type="password"
                  placeholder={modalMode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới nếu muốn đổi'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}

            <div className="admin-users-modal-actions">
              <button onClick={closeModal}>Hủy bỏ</button>
              {modalMode !== 'view' && <button onClick={handleSave}>Lưu thay đổi</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="admin-users-stat">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}