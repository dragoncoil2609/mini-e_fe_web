import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeletedUsers, restoreUser, hardDeleteUser } from '../../../api/users.api';
import type { User, UserListQuery, UserRole } from '../../../api/types';
import './DeletedUsersPage.css';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  pageCount?: number;
}

interface UserListResult {
  items: User[];
  meta: ListMeta;
}

function normalizeList(data: any): UserListResult {
  if (data?.meta) {
    return {
      items: Array.isArray(data.items) ? data.items : [],
      meta: {
        page: Number(data.meta.page || 1),
        limit: Number(data.meta.limit || 10),
        total: Number(data.meta.total || 0),
        pageCount: Number(data.meta.pageCount || 0) || undefined,
      },
    };
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const page = Number(data?.page || 1);
  const limit = Number(data?.limit || 10);
  const total = Number(data?.total || items.length || 0);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      pageCount: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
    },
  };
}

type ToastType = 'success' | 'error' | 'info';

const Toast: React.FC<{
  open: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
}> = ({ open, type, message, onClose }) => {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`admin-toast admin-toast--${type}`} role="status">
      <div className="admin-toast__dot" />
      <div className="admin-toast__text">{message}</div>
      <button className="admin-toast__close" onClick={onClose} aria-label="Close" type="button">
        ✕
      </button>
    </div>
  );
};

const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, title, message, confirmText = 'Xác nhận', danger, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay" onMouseDown={onCancel}>
      <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h3 className="admin-modal__title">{title}</h3>
        </div>
        <div className="admin-modal__body">{message}</div>
        <div className="admin-modal__actions">
          <button className="btn btn--ghost" onClick={onCancel} type="button">
            Huỷ
          </button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const ROOT_ADMIN_EMAIL = 'admin123@admin.com';
function isProtectedUser(user: User | null | undefined) {
  if (!user) return false;
  return user.email === ROOT_ADMIN_EMAIL || (user as any).isSystem === true;
}

const DeletedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<UserListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    limit: 10,
    sortBy: 'deletedAt' as any,
    sortOrder: 'DESC',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onConfirm?: () => void;
  }>({ open: false, title: '', message: '' });
  const [toast, setToast] = useState<{ open: boolean; type: ToastType; message: string }>({
    open: false,
    type: 'info',
    message: '',
  });

  const loadUsers = async (params: UserListQuery = query) => {
    try {
      setLoading(true);
      const data = await getDeletedUsers(params);
      setList(normalizeList(data));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Không load được user đã xoá' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.search, query.sortBy, query.sortOrder]);

  const totalPages = useMemo(() => {
    if (!list) return 1;
    if (list.meta.pageCount) return list.meta.pageCount;
    return Math.max(1, Math.ceil(list.meta.total / Math.max(list.meta.limit, 1)));
  }, [list]);

  const allOnPageSelected = useMemo(() => {
    if (!list || list.items.length === 0) return false;
    return list.items.every((u) => selectedIds.has(u.id));
  }, [list, selectedIds]);

  const someOnPageSelected = useMemo(() => {
    if (!list || list.items.length === 0) return false;
    return list.items.some((u) => selectedIds.has(u.id));
  }, [list, selectedIds]);

  const toggleSelectAllOnPage = () => {
    if (!list) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((u) => next.delete(u.id));
      else list.items.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openConfirm = (cfg: Omit<typeof confirm, 'open'> & { onConfirm: () => void }) => {
    setConfirm({ open: true, ...cfg });
  };
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false, onConfirm: undefined }));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery((p) => ({ ...p, page: 1, search: searchInput.trim() || undefined }));
  };

  const handleRestore = (id: number) => {
    openConfirm({
      title: 'Khôi phục user',
      message: `Khôi phục user ID ${id}?`,
      confirmText: 'Khôi phục',
      onConfirm: async () => {
        try {
          await restoreUser(id);
          setToast({ open: true, type: 'success', message: 'Đã khôi phục user' });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Khôi phục thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleHardDelete = (id: number) => {
    openConfirm({
      title: 'Xoá vĩnh viễn user',
      message: `XOÁ VĨNH VIỄN user ID ${id}? Không thể hoàn tác.`,
      confirmText: 'Xoá vĩnh viễn',
      danger: true,
      onConfirm: async () => {
        try {
          await hardDeleteUser(id);
          setToast({ open: true, type: 'success', message: 'Đã xoá vĩnh viễn user' });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Xoá vĩnh viễn thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const bulkRestore = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    openConfirm({
      title: 'Khôi phục hàng loạt',
      message: `Khôi phục ${ids.length} user đã chọn?`,
      confirmText: 'Khôi phục',
      onConfirm: async () => {
        try {
          for (const id of ids) await restoreUser(id);
          setToast({ open: true, type: 'success', message: `Đã khôi phục ${ids.length} user` });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Bulk khôi phục thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const bulkHardDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    openConfirm({
      title: 'Xoá vĩnh viễn hàng loạt',
      message: `XOÁ VĨNH VIỄN ${ids.length} user đã chọn? Không thể hoàn tác.`,
      confirmText: 'Xoá vĩnh viễn',
      danger: true,
      onConfirm: async () => {
        try {
          for (const id of ids) await hardDeleteUser(id);
          setToast({ open: true, type: 'success', message: `Đã xoá vĩnh viễn ${ids.length} user` });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Bulk xoá vĩnh viễn thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const roleTone = (role: UserRole) => {
    if (role === 'ADMIN') return 'red';
    if (role === 'SELLER') return 'blue';
    return 'gray';
  };

  const totalSelected = selectedIds.size;

  return (
    <div className="admin-users">
      <div className="admin-users__topbar">
        <button onClick={() => navigate('/admin/users')} className="btn btn--ghost" type="button">
          ← Quay lại quản lý user
        </button>

        <div className="admin-users__titlewrap">
          <h1 className="admin-users__title">Thùng rác user (xoá mềm)</h1>
          <div className="admin-users__subtitle">
            {list ? (
              <>
                Tổng <b>{list.meta.total}</b> • Trang <b>{list.meta.page}</b>/<b>{totalPages}</b>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>

        <div className="admin-users__top-actions">
          <button className="btn btn--ghost" onClick={() => navigate('/home')} type="button">
            🏠 Trang chủ
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="admin-toolbar__search">
            <input className="input" placeholder="Tìm theo tên / email / phone..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button className="btn btn--primary" type="submit" disabled={loading}>Tìm</button>
            {query.search && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setSearchInput('');
                  setQuery((p) => ({ ...p, page: 1, search: undefined }));
                }}
              >
                Xoá lọc
              </button>
            )}
          </form>

          <div className="admin-toolbar__filters">
            <select className="select" value={query.sortBy || 'deletedAt'} onChange={(e) => setQuery((p) => ({ ...p, sortBy: e.target.value as any }))} disabled={loading}>
              <option value="deletedAt">Sort: DeletedAt</option>
              <option value="createdAt">Sort: CreatedAt</option>
              <option value="name">Sort: Name</option>
            </select>

            <button type="button" className="btn btn--ghost" onClick={() => setQuery((p) => ({ ...p, sortOrder: p.sortOrder === 'ASC' ? 'DESC' : 'ASC' }))} disabled={loading}>
              {query.sortOrder === 'ASC' ? '⬆ ASC' : '⬇ DESC'}
            </button>

            <select className="select" value={query.limit || 10} onChange={(e) => setQuery((p) => ({ ...p, page: 1, limit: Number(e.target.value) }))} disabled={loading}>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {totalSelected > 0 && (
          <div className="bulkbar">
            <div className="bulkbar__left">Đã chọn <b>{totalSelected}</b> user</div>
            <div className="bulkbar__right">
              <button className="btn btn--primary" onClick={bulkRestore} disabled={loading} type="button">Khôi phục</button>
              <button className="btn btn--danger" onClick={bulkHardDelete} disabled={loading} type="button">Xoá vĩnh viễn</button>
              <button className="btn btn--ghost" onClick={() => setSelectedIds(new Set())} disabled={loading} type="button">Bỏ chọn</button>
            </div>
          </div>
        )}

        {loading && <div className="admin-loading">Đang tải...</div>}

        {!loading && list && (
          <>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        ref={(el) => {
                          if (!el) return;
                          el.indeterminate = !allOnPageSelected && someOnPageSelected;
                        }}
                        onChange={toggleSelectAllOnPage}
                      />
                    </th>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>DeletedAt</th>
                    <th className="col-actions">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((u) => {
                    const protectedUser = isProtectedUser(u);
                    return (
                      <tr key={u.id}>
                        <td className="col-checkbox">
                          <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleOne(u.id)} />
                        </td>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email || '—'}</td>
                        <td><span className={`badge badge--${roleTone(u.role)}`}>{u.role}</span></td>
                        <td>{fmtDateTime(u.deletedAt)}</td>
                        <td className="col-actions">
                          <div className="actions">
                            <button className="btn btn--sm btn--primary" onClick={() => handleRestore(u.id)} type="button">Khôi phục</button>
                            <button className="btn btn--sm btn--danger" onClick={() => handleHardDelete(u.id)} disabled={protectedUser} type="button">Xoá vĩnh viễn</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {list.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty">Không có user nào trong thùng rác.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <div className="muted">Trang <b>{list.meta.page}</b> / <b>{totalPages}</b> — Tổng: <b>{list.meta.total}</b></div>
              <div className="pager__btns">
                <button className="btn btn--ghost" disabled={list.meta.page <= 1} onClick={() => setQuery((p) => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))} type="button">← Trước</button>
                <button className="btn btn--ghost" disabled={list.meta.page >= totalPages} onClick={() => setQuery((p) => ({ ...p, page: Math.min(totalPages, (p.page || 1) + 1) }))} type="button">Sau →</button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        danger={confirm.danger}
        onCancel={closeConfirm}
        onConfirm={() => confirm.onConfirm?.()}
      />

      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
};

export default DeletedUsersPage;
