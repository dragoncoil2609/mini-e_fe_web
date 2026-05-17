import React, { useEffect, useState } from 'react';
import {
  getDeletedUsers,
  hardDeleteUser,
  restoreUser,
} from '../../../api/users.api';
import type { User } from '../../../api/types';
import './style/DeletedUsersPage.css';

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

export default function DeletedUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<ListMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pageCount: 1,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const loadData = async (page = meta.page, limit = meta.limit, keyword = search) => {
    try {
      setLoading(true);
      const data = await getDeletedUsers({
        page,
        limit,
        search: keyword || undefined,
        sortBy: 'deletedAt',
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
        message: err?.response?.data?.message || 'Không tải được user đã xoá',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1, 10, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (user: User) => {
    if (isProtectedUser(user)) {
      setToast({ type: 'error', message: 'Không thao tác với tài khoản admin gốc.' });
      return;
    }

    try {
      await restoreUser(user.id);
      setToast({ type: 'success', message: 'Khôi phục user thành công.' });
      await loadData(meta.page, meta.limit, search);
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Khôi phục thất bại',
      });
    }
  };

  const handleHardDelete = async (user: User) => {
    if (isProtectedUser(user)) {
      setToast({ type: 'error', message: 'Không thao tác với tài khoản admin gốc.' });
      return;
    }

    if (!window.confirm(`Xoá vĩnh viễn user "${user.name}"?`)) return;

    try {
      await hardDeleteUser(user.id);
      setToast({ type: 'success', message: 'Đã xoá vĩnh viễn user.' });
      await loadData(meta.page, meta.limit, search);
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err?.response?.data?.message || 'Xoá vĩnh viễn thất bại',
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
          <h1 className="admin-users__title">Người dùng đã xoá</h1>
          <div className="admin-users__subtitle">
            Danh sách user đã bị xoá mềm, có thể khôi phục hoặc xoá vĩnh viễn.
          </div>
        </div>

        <div className="admin-users__top-actions">
          <button className="btn btn--ghost" onClick={() => (window.location.href = '/admin/users')}>
            Quay lại user đang hoạt động
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-toolbar__search" onSubmit={submitSearch}>
            <input
              className="input"
              placeholder="Tìm user đã xoá..."
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
          <div className="empty">Không có user đã xoá.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const protectedUser = isProtectedUser(user);

                  return (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.name}</td>
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
                        <span className="badge badge--red">Đã xoá mềm</span>
                      </td>
                      <td className="col-actions">
                        <div className="actions">
                          <button
                            className="btn btn--primary btn--sm"
                            type="button"
                            onClick={() => void handleRestore(user)}
                            disabled={protectedUser}
                          >
                            Khôi phục
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            type="button"
                            onClick={() => void handleHardDelete(user)}
                            disabled={protectedUser}
                          >
                            Xoá vĩnh viễn
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