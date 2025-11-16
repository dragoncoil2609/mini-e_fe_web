// src/pages/admin/DeletedUsersPage.tsx
import React, { useEffect, useState } from 'react';
import {
  getDeletedUsers,
  restoreUser,
  hardDeleteUser,
} from '../../../api/users.api';
import type { User, UserListQuery } from '../../../api/types';

interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

const DeletedUsersPage: React.FC = () => {
  const [list, setList] = useState<UserListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<UserListQuery>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');

  const loadUsers = async (params: UserListQuery = query) => {
    try {
      setLoading(true);
      const data = await getDeletedUsers(params);
      setList(data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Không load được danh sách user đã xoá');
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

  const handleRestore = async (id: number) => {
    if (!window.confirm('Khôi phục user này?')) return;
    try {
      await restoreUser(id);
      await loadUsers(query);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Khôi phục thất bại');
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
      <h1>User đã xoá mềm</h1>

      <div style={{ margin: '16px 0' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Tìm theo tên / email / phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ padding: 6, minWidth: 260 }}
          />
          <button type="submit">Tìm kiếm</button>
        </form>
      </div>

      {loading && <div>Đang tải...</div>}

      {!loading && list && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Tên</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Role</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>DeletedAt</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '4px 0' }}>{u.id}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.name}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.email}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.role}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{u.deletedAt}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>
                    <button onClick={() => handleRestore(u.id)}>Khôi phục</button>{' '}
                    <button onClick={() => handleHardDelete(u.id)}>Xoá vĩnh viễn</button>
                  </td>
                </tr>
              ))}

              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 8 }}>
                    Không có user nào trong thùng rác.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              Trang {list.page} / {totalPages || 1} — Tổng: {list.total} user
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={list.page <= 1}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                }
              >
                &lt; Trước
              </button>
              <button
                disabled={list.page >= totalPages}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
              >
                Sau &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeletedUsersPage;
