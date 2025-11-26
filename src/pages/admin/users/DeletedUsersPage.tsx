// src/pages/admin/DeletedUsersPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDeletedUsers,
  restoreUser,
  hardDeleteUser,
} from '../../../api/users.api';
import type { User, UserListQuery } from '../../../api/types';
import './DeletedUsersPage.css';

interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

const DeletedUsersPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="deleted-users-container">
      <button onClick={() => navigate('/home')} className="home-button">
        🏠 Về trang chủ
      </button>
      <h1 className="deleted-users-title">User đã xoá mềm</h1>

      <div className="deleted-users-search-wrapper">
        <form
          onSubmit={handleSearchSubmit}
          className="deleted-users-search-form"
        >
          <input
            placeholder="Tìm theo tên / email / phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="deleted-users-search-input"
          />
          <button type="submit" className="deleted-users-search-button">
            Tìm kiếm
          </button>
        </form>
      </div>

      {loading && <div className="deleted-users-loading">Đang tải...</div>}

      {!loading && list && (
        <>
          <table className="deleted-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>DeletedAt</th>
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
                  <td>{u.deletedAt}</td>
                  <td>
                    <div className="deleted-users-action-buttons">
                      <button
                        onClick={() => handleRestore(u.id)}
                        className="deleted-users-restore-button"
                      >
                        Khôi phục
                      </button>
                      <button
                        onClick={() => handleHardDelete(u.id)}
                        className="deleted-users-delete-button"
                      >
                        Xoá vĩnh viễn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="deleted-users-table-empty">
                    Không có user nào trong thùng rác.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="deleted-users-pagination">
            <div className="deleted-users-pagination-info">
              Trang {list.page} / {totalPages || 1} — Tổng: {list.total} user
            </div>
            <div className="deleted-users-pagination-buttons">
              <button
                disabled={list.page <= 1}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                }
                className="deleted-users-pagination-button"
              >
                &lt; Trước
              </button>
              <button
                disabled={list.page >= totalPages}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
                className="deleted-users-pagination-button"
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
