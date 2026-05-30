import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi';

import {
  getDeletedUsers,
  hardDeleteUser,
  restoreUser,
} from '../../../api/users.api';
import type { User, UserRole } from '../../../api/types';

import './style/DeletedUsersPage.css';

type RoleFilter = '' | UserRole;

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  return (
    date.toLocaleDateString('vi-VN') +
    ' ' +
    date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function roleLabel(role: UserRole) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SELLER') return 'Seller';
  return 'User';
}

export default function DeletedUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const pageCount = Math.max(Math.ceil(total / limit), 1);

  async function fetchDeletedUsers() {
    try {
      setLoading(true);
      setMessage('');

      const data = await getDeletedUsers({
        page,
        limit,
        search: search.trim() || undefined,
        role: role || undefined,
        sortBy: 'deletedAt',
        sortOrder: 'DESC',
      });

      setUsers(data.items);
      setTotal(data.meta.total);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          'Không thể tải danh sách user đã xóa',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDeletedUsers();
  }, [page, role]);

  function handleSearch() {
    if (page === 1) {
      void fetchDeletedUsers();
      return;
    }

    setPage(1);
  }

  async function handleRestore(user: User) {
    const ok = window.confirm(`Khôi phục user "${user.name}"?`);
    if (!ok) return;

    try {
      await restoreUser(user.id);
      await fetchDeletedUsers();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Khôi phục user thất bại');
    }
  }

  async function handleHardDelete(user: User) {
    const ok = window.confirm(
      `Xóa vĩnh viễn user "${user.name}"? Hành động này không thể khôi phục.`,
    );

    if (!ok) return;

    try {
      await hardDeleteUser(user.id);
      await fetchDeletedUsers();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Xóa vĩnh viễn user thất bại');
    }
  }

  return (
    <div className="deleted-users-page">
      <div className="deleted-users-header">
        <div>
          <Link to="/admin/users" className="deleted-users-back">
            <FiArrowLeft />
            Quay lại quản lý user
          </Link>

          <h1>User đã xóa mềm</h1>
          <p>Danh sách người dùng đã bị xóa mềm trong hệ thống</p>
        </div>
      </div>

      <section className="deleted-users-card">
        <div className="deleted-users-filter">
          <div className="deleted-users-search">
            <FiSearch />
            <input
              value={search}
              placeholder="Tìm theo tên, email, số điện thoại..."
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
          >
            <option value="">Vai trò: Tất cả</option>
            <option value="USER">User</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button onClick={handleSearch}>
            <FiRefreshCw />
            Lọc
          </button>
        </div>

        {message && <div className="deleted-users-message">{message}</div>}

        <div className="deleted-users-table-wrap">
          <table className="deleted-users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th>Ngày xóa</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="deleted-users-empty">
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="deleted-users-empty">
                    Chưa có user đã xóa
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{(page - 1) * limit + index + 1}</td>

                    <td>
                      <div className="deleted-users-user">
                        <div className="deleted-users-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>ID: {user.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{user.email || '—'}</td>
                    <td>{user.phone || '—'}</td>

                    <td>
                      <span className={`deleted-users-role ${user.role.toLowerCase()}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.deletedAt)}</td>

                    <td>
                      <div className="deleted-users-actions">
                        <button
                          className="restore"
                          title="Khôi phục"
                          onClick={() => handleRestore(user)}
                        >
                          <FiRotateCcw />
                        </button>

                        <button
                          className="hard-delete"
                          title="Xóa vĩnh viễn"
                          onClick={() => handleHardDelete(user)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="deleted-users-pagination">
          <span>
            Hiển thị {users.length} / {total} user đã xóa
          </span>

          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ‹
            </button>

            <strong>{page}</strong>

            <button
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}