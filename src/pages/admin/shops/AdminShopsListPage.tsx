// src/pages/admin/shops/AdminShopsListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchShops, updateShop, deleteShop } from '../../../api/shop.api';
import type { Shop, ShopStatus } from '../../../api/types';
import './AdminShopsListPage.css';

interface SearchState {
  q: string;
  status: '' | ShopStatus;
}

const AdminShopsListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<SearchState>({ q: '', status: '' });
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // state giữ trạng thái đang chọn (draft) cho từng shop
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ShopStatus>>(
    {},
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await searchShops({
        q: search.q || undefined,
        status: (search.status as ShopStatus) || undefined,
        page,
        limit,
      });

      if (res.success) {
        setShops(res.data.items);
        setTotal(res.data.total);

        // sync statusDrafts theo kết quả mới
        const drafts: Record<number, ShopStatus> = {};
        res.data.items.forEach((s) => {
          drafts[s.id] = s.status;
        });
        setStatusDrafts(drafts);
      } else {
        setError(res.message || 'Không lấy được danh sách shop.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Không lấy được danh sách shop.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // khi đổi page sẽ reload

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleChangeStatusDraft = (shopId: number, value: ShopStatus) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [shopId]: value,
    }));
  };

  const handleSaveStatus = async (shopId: number) => {
    const newStatus = statusDrafts[shopId];
    if (!newStatus) return;

    setSavingId(shopId);
    setError(null);

    try {
      const res = await updateShop(shopId, { status: newStatus });
      if (res.success) {
        // cập nhật lại list
        setShops((prev) =>
          prev.map((s) => (s.id === shopId ? res.data : s)),
        );
      } else {
        setError(res.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Cập nhật trạng thái thất bại.',
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (
      !window.confirm(
        'Bạn chắn chắn muốn xoá shop này? Hành động này không thể hoàn tác!',
      )
    ) {
      return;
    }

    setDeletingId(shopId);
    setError(null);

    try {
      const res = await deleteShop(shopId);
      if (res.success) {
        setShops((prev) => prev.filter((s) => s.id !== shopId));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        setError(res.message || 'Xoá shop thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xoá shop thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-shops-container">
      <button onClick={() => navigate('/home')} className="home-button">
        🏠 Về trang chủ
      </button>
      <h1 className="admin-shops-title">Quản lý shop (ADMIN)</h1>

      <form
        onSubmit={handleSearchSubmit}
        className="admin-shops-search-form"
      >
        <input
          type="text"
          placeholder="Từ khoá (tên/email/địa chỉ/điện thoại)"
          value={search.q}
          onChange={(e) =>
            setSearch((prev) => ({ ...prev, q: e.target.value }))
          }
          className="admin-shops-search-input"
        />

        <select
          value={search.status}
          onChange={(e) =>
            setSearch((prev) => ({
              ...prev,
              status: e.target.value as '' | ShopStatus,
            }))
          }
          className="admin-shops-search-select"
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="admin-shops-search-button"
        >
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {error && <div className="admin-shops-error">{error}</div>}

      <div className="admin-shops-info">
        Tổng: {total} shop. Trang {page}/{totalPages}
      </div>

      <table className="admin-shops-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên shop</th>
            <th>Slug</th>
            <th>Owner (userId)</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Trạng thái</th>
            <th>Địa chỉ</th>
            <th>Tạo lúc</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {shops.length === 0 && !loading && (
            <tr>
              <td colSpan={10} className="admin-shops-table-empty">
                Không có shop nào.
              </td>
            </tr>
          )}

          {shops.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.slug}</td>
              <td>{s.userId}</td>
              <td>{s.email || '-'}</td>
              <td>{s.shopPhone || '-'}</td>
              <td>
                <select
                  value={statusDrafts[s.id] || s.status}
                  onChange={(e) =>
                    handleChangeStatusDraft(
                      s.id,
                      e.target.value as ShopStatus,
                    )
                  }
                  className="admin-shops-status-select"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </td>
              <td>{s.shopAddress || '-'}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
              <td>
                <div className="admin-shops-action-buttons">
                  <button
                    type="button"
                    onClick={() => handleSaveStatus(s.id)}
                    disabled={savingId === s.id}
                    className="admin-shops-save-button"
                  >
                    {savingId === s.id ? 'Đang lưu...' : 'Lưu trạng thái'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteShop(s.id)}
                    disabled={deletingId === s.id}
                    className="admin-shops-delete-button"
                  >
                    {deletingId === s.id ? 'Đang xoá...' : 'Xoá shop'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-shops-pagination">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="admin-shops-pagination-button"
        >
          Trang trước
        </button>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="admin-shops-pagination-button"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default AdminShopsListPage;
