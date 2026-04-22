import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteShop, searchShops, updateShop } from '../../../api/shop.api';
import type { Shop, ShopStatus } from '../../../api/types';
import './AdminShopsListPage.css';

interface SearchState {
  q: string;
  status: '' | ShopStatus;
}

const statusLabelMap: Record<ShopStatus, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm khóa',
};

const statusColorMap: Record<ShopStatus, React.CSSProperties> = {
  PENDING: {
    background: '#fef9c3',
    color: '#854d0e',
    border: '1px solid #fde68a',
  },
  ACTIVE: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  SUSPENDED: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
};

const AdminShopsListPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState<SearchState>({ q: '', status: '' });
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusDrafts, setStatusDrafts] = useState<Record<number, ShopStatus>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const pendingCount = useMemo(
    () => shops.filter((s) => s.status === 'PENDING').length,
    [shops],
  );

  const activeCount = useMemo(
    () => shops.filter((s) => s.status === 'ACTIVE').length,
    [shops],
  );

  const suspendedCount = useMemo(
    () => shops.filter((s) => s.status === 'SUSPENDED').length,
    [shops],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchShops = async (targetPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const res = await searchShops({
        q: search.q.trim() || undefined,
        status: search.status || undefined,
        page: targetPage,
        limit,
      });

      if (!res.success) {
        setError(res.message || 'Không lấy được danh sách shop.');
        return;
      }

      const items = res.data.items || [];
      setShops(items);
      setTotal(res.data.total || 0);

      const nextDrafts: Record<number, ShopStatus> = {};
      items.forEach((shop) => {
        nextDrafts[shop.id] = shop.status;
      });
      setStatusDrafts(nextDrafts);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Không lấy được danh sách shop.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchShops(page);
  }, [page]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
      return;
    }
    await fetchShops(1);
  };

  const handleChangeStatusDraft = (shopId: number, value: ShopStatus) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [shopId]: value,
    }));
  };

  const handleSaveStatus = async (shop: Shop) => {
    const newStatus = statusDrafts[shop.id];
    if (!newStatus || newStatus === shop.status) return;

    setSavingId(shop.id);
    setError(null);

    try {
      const res = await updateShop(shop.id, { status: newStatus });

      if (!res.success) {
        setError(res.message || 'Cập nhật trạng thái thất bại.');
        return;
      }

      setShops((prev) =>
        prev.map((item) => (item.id === shop.id ? res.data : item)),
      );
      setStatusDrafts((prev) => ({
        ...prev,
        [shop.id]: res.data.status,
      }));
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Cập nhật trạng thái thất bại.',
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    const confirmed = window.confirm(
      'Bạn chắc chắn muốn xoá shop này? Hành động này không thể hoàn tác.',
    );
    if (!confirmed) return;

    setDeletingId(shopId);
    setError(null);

    try {
      const res = await deleteShop(shopId);

      if (!res.success) {
        setError(res.message || 'Xoá shop thất bại.');
        return;
      }

      const nextItems = shops.filter((item) => item.id !== shopId);
      setShops(nextItems);
      setTotal((prev) => Math.max(0, prev - 1));

      if (nextItems.length === 0 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Xoá shop thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-shops-container">
      <button onClick={() => navigate('/home')} className="home-button">
        🏠 Về trang chủ
      </button>

      <h1 className="admin-shops-title">Quản lý shop</h1>

      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 13,
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            background: '#f3f4f6',
            color: '#111827',
            fontWeight: 700,
          }}
        >
          Tổng: {total}
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            fontWeight: 700,
            ...statusColorMap.PENDING,
          }}
        >
          Chờ duyệt: {pendingCount}
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            fontWeight: 700,
            ...statusColorMap.ACTIVE,
          }}
        >
          Hoạt động: {activeCount}
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            fontWeight: 700,
            ...statusColorMap.SUSPENDED,
          }}
        >
          Tạm khóa: {suspendedCount}
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="admin-shops-search-form">
        <input
          type="text"
          placeholder="Tìm theo tên shop, email, địa chỉ, số điện thoại..."
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
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="SUSPENDED">Tạm khóa</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="admin-shops-search-button"
        >
          {loading ? 'Đang tải...' : 'Tìm kiếm'}
        </button>
      </form>

      {error && <div className="admin-shops-error">{error}</div>}

      <div className="admin-shops-info">
        Trang {page}/{totalPages}
      </div>

      <table className="admin-shops-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên shop</th>
            <th>Owner</th>
            <th>Liên hệ</th>
            <th>Trạng thái hiện tại</th>
            <th>Cập nhật trạng thái</th>
            <th>Địa chỉ</th>
            <th>Tạo lúc</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {shops.length === 0 && !loading && (
            <tr>
              <td colSpan={9} className="admin-shops-table-empty">
                Không có shop nào.
              </td>
            </tr>
          )}

          {shops.map((shop) => {
            const draftStatus = statusDrafts[shop.id] || shop.status;
            const changed = draftStatus !== shop.status;

            return (
              <tr key={shop.id}>
                <td>#{shop.id}</td>

                <td>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <strong>{shop.name}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      @{shop.slug}
                    </span>
                  </div>
                </td>

                <td>{shop.userId}</td>

                <td>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span>{shop.email || '-'}</span>
                    <span>{shop.shopPhone || '-'}</span>
                  </div>
                </td>

                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      ...statusColorMap[shop.status],
                    }}
                  >
                    {statusLabelMap[shop.status]}
                  </span>
                </td>

                <td>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <select
                      value={draftStatus}
                      onChange={(e) =>
                        handleChangeStatusDraft(
                          shop.id,
                          e.target.value as ShopStatus,
                        )
                      }
                      className="admin-shops-status-select"
                    >
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="SUSPENDED">Tạm khóa</option>
                    </select>

                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {changed
                        ? `Sẽ đổi sang: ${statusLabelMap[draftStatus]}`
                        : 'Chưa có thay đổi'}
                    </div>
                  </div>
                </td>

                <td>{shop.shopAddress || '-'}</td>

                <td>{new Date(shop.createdAt).toLocaleString('vi-VN')}</td>

                <td>
                  <div className="admin-shops-action-buttons">
                    <button
                      type="button"
                      onClick={() => handleSaveStatus(shop)}
                      disabled={savingId === shop.id || !changed}
                      className="admin-shops-save-button"
                    >
                      {savingId === shop.id ? 'Đang lưu...' : 'Lưu'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteShop(shop.id)}
                      disabled={deletingId === shop.id}
                      className="admin-shops-delete-button"
                    >
                      {deletingId === shop.id ? 'Đang xoá...' : 'Xoá'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="admin-shops-pagination">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="admin-shops-pagination-button"
        >
          Trang trước
        </button>

        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="admin-shops-pagination-button"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default AdminShopsListPage;