import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUsers,
  createUser,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
} from '../../../api/users.api';
import type { CreateUserPayload, UpdateUserPayload } from '../../../api/users.api';
import type { Gender, User, UserListQuery, UserRole } from '../../../api/types';
import './UsersListPage.css';

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

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, any>[]) {
  const cols = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    const mustQuote = /[,"\n]/.test(s);
    const out = s.replaceAll('"', '""');
    return mustQuote ? `"${out}"` : out;
  };

  const header = cols.map(escape).join(',');
  const lines = rows.map((r) => cols.map((c) => escape(r[c])).join(','));
  return [header, ...lines].join('\n');
}

type ToastType = 'success' | 'error' | 'info';

const Toast: React.FC<{
  open: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
}> = ({ open, type, message, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`admin-toast admin-toast--${type}`} role="status">
      <div className="admin-toast__dot" />
      <div className="admin-toast__text">{message}</div>
      <button className="admin-toast__close" onClick={onClose} aria-label="Close">
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

const Badge: React.FC<{ tone: 'gray' | 'green' | 'red' | 'blue' | 'amber'; children: React.ReactNode }> = ({
  tone,
  children,
}) => <span className={`badge badge--${tone}`}>{children}</span>;

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  onClose: () => void;
  onSaved: () => void;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  avatarUrl: string;
  birthday: string;
  gender: '' | Gender;
  role: UserRole;
  isVerified: boolean;
}

const ROOT_ADMIN_EMAIL = 'admin123@admin.com';

function isProtectedUser(user: User | null | undefined) {
  if (!user) return false;
  return user.email === ROOT_ADMIN_EMAIL || (user as any).isSystem === true;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ open, editingUser, onClose, onSaved }) => {
  const isEdit = !!editingUser;
  const protectedUser = isProtectedUser(editingUser);

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
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
        isVerified: !!editingUser.isVerified,
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
  }, [open, editingUser]);

  if (!open) return null;

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    const { name, value, type, checked } = t;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên.';
    if (!form.email.trim() && !form.phone.trim()) return 'Phải nhập email hoặc số điện thoại.';
    if (!isEdit && !form.password.trim()) return 'Vui lòng nhập mật khẩu cho user mới.';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Email không hợp lệ.';
    if (form.phone.trim() && !/^(?:\+?84|0)\d{9,10}$/.test(form.phone.trim())) return 'Số điện thoại không hợp lệ.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isEdit && editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          avatarUrl: form.avatarUrl.trim() || null,
          birthday: form.birthday || null,
          gender: form.gender ? (form.gender as Gender) : null,
          role: protectedUser ? undefined : form.role,
          isVerified: protectedUser ? undefined : form.isVerified,
        };
        if (!protectedUser && form.password.trim()) payload.password = form.password.trim();
        await updateUser(editingUser.id, payload);
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          password: form.password.trim(),
          phone: form.phone.trim() || undefined,
          avatarUrl: form.avatarUrl.trim() || undefined,
          birthday: form.birthday || undefined,
          gender: form.gender ? (form.gender as Gender) : undefined,
          role: form.role,
          isVerified: form.isVerified,
        };
        await createUser(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Lưu user thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onMouseDown={onClose}>
      <div className="admin-modal admin-modal--lg" onMouseDown={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h3 className="admin-modal__title">{isEdit ? 'Sửa user' : 'Tạo user mới'}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close" type="button">
            ✕
          </button>
        </div>

        <form className="user-form" onSubmit={submit}>
          {error && <div className="form-alert form-alert--error">{error}</div>}
          {protectedUser && (
            <div className="form-alert" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              Đây là tài khoản admin gốc. Bạn chỉ nên xem thông tin, không nên sửa role / xác minh / mật khẩu tại đây.
            </div>
          )}

          <div className="user-form__grid">
            <label className="field">
              <span className="field__label">Tên</span>
              <input className="field__input" name="name" value={form.name} onChange={onChange} />
            </label>

            <label className="field">
              <span className="field__label">Email</span>
              <input className="field__input" name="email" type="email" value={form.email} onChange={onChange} />
            </label>

            <label className="field">
              <span className="field__label">
                Mật khẩu {isEdit ? <span className="muted">(bỏ trống nếu không đổi)</span> : null}
              </span>
              <input className="field__input" name="password" type="password" value={form.password} onChange={onChange} disabled={protectedUser} />
            </label>

            <label className="field">
              <span className="field__label">Số điện thoại</span>
              <input className="field__input" name="phone" value={form.phone} onChange={onChange} />
            </label>

            <label className="field">
              <span className="field__label">Avatar URL</span>
              <input className="field__input" name="avatarUrl" value={form.avatarUrl} onChange={onChange} />
            </label>

            <label className="field">
              <span className="field__label">Ngày sinh</span>
              <input className="field__input" name="birthday" type="date" value={form.birthday} onChange={onChange} />
            </label>

            <label className="field">
              <span className="field__label">Giới tính</span>
              <select className="field__select" name="gender" value={form.gender} onChange={onChange}>
                <option value="">-- Chọn --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>

            <label className="field">
              <span className="field__label">Vai trò</span>
              <select className="field__select" name="role" value={form.role} onChange={onChange} disabled={protectedUser}>
                <option value="USER">USER</option>
                <option value="SELLER">SELLER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </div>

          <label className="checkbox">
            <input type="checkbox" name="isVerified" checked={form.isVerified} onChange={onChange} disabled={protectedUser} />
            <span>Đã xác minh</span>
          </label>

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UsersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [list, setList] = useState<UserListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [drawerUser, setDrawerUser] = useState<User | null>(null);
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
      const data = await getUsers(params);
      setList(normalizeList(data));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Không load được danh sách user' });
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

  const openConfirm = (cfg: Omit<typeof confirm, 'open'> & { onConfirm: () => void }) => {
    setConfirm({ open: true, ...cfg });
  };

  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false, onConfirm: undefined }));

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

  const handleSoftDelete = (id: number) => {
    openConfirm({
      title: 'Xoá mềm user',
      message: `Bạn chắc chắn muốn xoá mềm user ID ${id}?`,
      confirmText: 'Xoá mềm',
      danger: true,
      onConfirm: async () => {
        try {
          await softDeleteUser(id);
          setToast({ open: true, type: 'success', message: 'Đã xoá mềm user' });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Xoá mềm thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleHardDelete = (id: number) => {
    openConfirm({
      title: 'Xoá vĩnh viễn user',
      message: `Bạn chắc chắn muốn XOÁ VĨNH VIỄN user ID ${id}? Hành động này không thể hoàn tác.`,
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

  const handleBulkSoftDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    openConfirm({
      title: 'Xoá mềm hàng loạt',
      message: `Xoá mềm ${ids.length} user đã chọn?`,
      confirmText: 'Xoá mềm',
      danger: true,
      onConfirm: async () => {
        try {
          for (const id of ids) await softDeleteUser(id);
          setToast({ open: true, type: 'success', message: `Đã xoá mềm ${ids.length} user` });
          await loadUsers(query);
        } catch (err: any) {
          console.error(err);
          setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Bulk xoá mềm thất bại' });
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleBulkHardDelete = () => {
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

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery((p) => ({ ...p, page: 1, search: searchInput.trim() || undefined }));
  };

  const onExportCsv = () => {
    if (!list) return;
    const rows = list.items.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email || '',
      phone: u.phone || '',
      role: u.role,
      isVerified: u.isVerified,
      gender: u.gender || '',
      birthday: u.birthday || '',
      lastLoginAt: u.lastLoginAt || '',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    const csv = toCsv(rows);
    const ts = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
    downloadTextFile(`users-page-${list.meta.page}-${ts}.csv`, csv);
    setToast({ open: true, type: 'success', message: 'Đã export CSV (trang hiện tại)' });
  };

  const roleTone = (role: UserRole) => {
    if (role === 'ADMIN') return 'red';
    if (role === 'SELLER') return 'blue';
    return 'gray';
  };

  const verifiedTone = (v: boolean) => (v ? 'green' : 'amber');
  const quickUpdateLock = useRef(false);

  const quickUpdate = async (id: number, payload: UpdateUserPayload) => {
    if (quickUpdateLock.current) return;
    try {
      quickUpdateLock.current = true;
      await updateUser(id, payload);
      setToast({ open: true, type: 'success', message: 'Đã cập nhật' });
      await loadUsers(query);
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, type: 'error', message: err?.response?.data?.message || 'Cập nhật thất bại' });
    } finally {
      quickUpdateLock.current = false;
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-users__topbar">
        <button onClick={() => navigate('/home')} className="btn btn--ghost" type="button">
          🏠 Về trang chủ
        </button>

        <div className="admin-users__titlewrap">
          <h1 className="admin-users__title">Quản lý user</h1>
          <div className="admin-users__subtitle">
            {list ? (
              <>
                Tổng <b>{list.meta.total}</b> user • Trang <b>{list.meta.page}</b>/<b>{totalPages}</b>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>

        <div className="admin-users__top-actions">
          <button className="btn btn--ghost" onClick={() => navigate('/admin/users/deleted')} type="button">
            🗑️ User đã xoá mềm
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
            type="button"
          >
            + Tạo user
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <form onSubmit={onSearchSubmit} className="admin-toolbar__search">
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
            <select className="select" value={query.sortBy || 'createdAt'} onChange={(e) => setQuery((p) => ({ ...p, sortBy: e.target.value as any }))} disabled={loading}>
              <option value="createdAt">Sort: CreatedAt</option>
              <option value="updatedAt">Sort: UpdatedAt</option>
              <option value="lastLoginAt">Sort: LastLogin</option>
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

            <button className="btn btn--ghost" type="button" onClick={onExportCsv} disabled={!list || list.items.length === 0}>
              ⤓ Export CSV
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bulkbar">
            <div>Đã chọn <b>{selectedIds.size}</b> user</div>
            <div className="bulkbar__right">
              <button className="btn btn--warning" type="button" onClick={handleBulkSoftDelete} disabled={loading}>Xoá mềm</button>
              <button className="btn btn--danger" type="button" onClick={handleBulkHardDelete} disabled={loading}>Xoá vĩnh viễn</button>
              <button className="btn btn--ghost" type="button" onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>
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
                    <th>User</th>
                    <th>Liên hệ</th>
                    <th>Role</th>
                    <th>Xác minh</th>
                    <th>Ngày tạo</th>
                    <th className="col-actions">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((u) => {
                    const protectedUser = isProtectedUser(u);
                    return (
                      <tr key={u.id} className="row-click" onClick={() => setDrawerUser(u)}>
                        <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleOne(u.id)} />
                        </td>
                        <td>{u.id}</td>
                        <td>
                          <div className="user-cell">
                            <div className="avatar">
                              {u.avatarUrl ? <img src={u.avatarUrl} alt={u.name} /> : (u.name || 'U').trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="stack">
                              <div className="user-cell__name">{u.name || '—'}</div>
                              <div className="muted">{protectedUser ? 'Tài khoản hệ thống' : (u.gender || '—')}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="stack">
                            <div>{u.email || '—'}</div>
                            <div className="muted">{u.phone || '—'}</div>
                          </div>
                        </td>
                        <td><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                        <td>
                          <button
                            type="button"
                            className={`pill ${u.isVerified ? 'pill--ok' : 'pill--warn'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (protectedUser) return;
                              void quickUpdate(u.id, { isVerified: !u.isVerified });
                            }}
                            disabled={protectedUser}
                            title={protectedUser ? 'Tài khoản admin gốc không chỉnh ở đây' : undefined}
                          >
                            {u.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </button>
                        </td>
                        <td>{fmtDate(u.createdAt)}</td>
                        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="actions">
                            <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setEditingUser(u); setModalOpen(true); }}>Sửa</button>
                            <button className="btn btn--sm btn--warning" type="button" onClick={() => handleSoftDelete(u.id)} disabled={protectedUser}>Xoá mềm</button>
                            <button className="btn btn--sm btn--danger" type="button" onClick={() => handleHardDelete(u.id)} disabled={protectedUser}>Xoá vĩnh viễn</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {list.items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty">Không có user nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <div className="muted">
                Trang <b>{list.meta.page}</b> / <b>{totalPages}</b> — Tổng: <b>{list.meta.total}</b>
              </div>
              <div className="pager__btns">
                <button className="btn btn--ghost" type="button" disabled={list.meta.page <= 1} onClick={() => setQuery((p) => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))}>← Trước</button>
                <button className="btn btn--ghost" type="button" disabled={list.meta.page >= totalPages} onClick={() => setQuery((p) => ({ ...p, page: Math.min(totalPages, (p.page || 1) + 1) }))}>Sau →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {drawerUser && (
        <div className="drawer-overlay" onMouseDown={() => setDrawerUser(null)}>
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="drawer__header">
              <div className="drawer__title">Chi tiết user</div>
              <button className="icon-btn" type="button" onClick={() => setDrawerUser(null)}>✕</button>
            </div>
            <div className="drawer__body">
              <div className="drawer__section">
                <div className="kv">
                  <div className="kv__k">ID</div><div className="kv__v">{drawerUser.id}</div>
                  <div className="kv__k">Tên</div><div className="kv__v">{drawerUser.name || '—'}</div>
                  <div className="kv__k">Email</div><div className="kv__v">{drawerUser.email || '—'}</div>
                  <div className="kv__k">Phone</div><div className="kv__v">{drawerUser.phone || '—'}</div>
                  <div className="kv__k">Role</div><div className="kv__v">{drawerUser.role}</div>
                  <div className="kv__k">Verified</div><div className="kv__v">{drawerUser.isVerified ? 'Có' : 'Không'}</div>
                  <div className="kv__k">Gender</div><div className="kv__v">{drawerUser.gender || '—'}</div>
                  <div className="kv__k">Birthday</div><div className="kv__v">{drawerUser.birthday || '—'}</div>
                  <div className="kv__k">Last login</div><div className="kv__v">{fmtDateTime(drawerUser.lastLoginAt)}</div>
                  <div className="kv__k">Created</div><div className="kv__v">{fmtDateTime(drawerUser.createdAt)}</div>
                  <div className="kv__k">Updated</div><div className="kv__v">{fmtDateTime(drawerUser.updatedAt)}</div>
                </div>
              </div>

              <div className="drawer__section">
                <div className="drawer__actions">
                  <button className="btn btn--primary" type="button" onClick={() => { setEditingUser(drawerUser); setModalOpen(true); }}>Sửa user</button>
                  <button className="btn btn--warning" type="button" onClick={() => handleSoftDelete(drawerUser.id)} disabled={isProtectedUser(drawerUser)}>Xoá mềm</button>
                  <button className="btn btn--danger" type="button" onClick={() => handleHardDelete(drawerUser.id)} disabled={isProtectedUser(drawerUser)}>Xoá vĩnh viễn</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserFormModal
        open={modalOpen}
        editingUser={editingUser}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setToast({ open: true, type: 'success', message: 'Đã lưu user' });
          void loadUsers(query);
        }}
      />

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

export default UsersListPage;
