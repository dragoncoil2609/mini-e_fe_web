// src/pages/admin/shops/AdminShopsListPage.tsx
import { useEffect, useState } from 'react';
import { searchShops, updateShop, deleteShop } from '../../../api/shop.api';
import type { Shop, ShopStatus } from '../../../api/types';

interface SearchState {
  q: string;
  status: '' | ShopStatus;
}

const AdminShopsListPage = () => {
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
    <div style={{ padding: 24 }}>
      <h1>Quản lý shop (ADMIN)</h1>

      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <input
          type="text"
          placeholder="Từ khoá (tên/email/địa chỉ/điện thoại)"
          value={search.q}
          onChange={(e) =>
            setSearch((prev) => ({ ...prev, q: e.target.value }))
          }
          style={{ flex: 1, minWidth: 220, padding: 8 }}
        />

        <select
          value={search.status}
          onChange={(e) =>
            setSearch((prev) => ({
              ...prev,
              status: e.target.value as '' | ShopStatus,
            }))
          }
          style={{ padding: 8 }}
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ marginBottom: 8 }}>
        Tổng: {total} shop. Trang {page}/{totalPages}
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 16,
        }}
      >
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Tên shop</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Slug</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>
              Owner (userId)
            </th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>SĐT</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Trạng thái</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Địa chỉ</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Tạo lúc</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {shops.length === 0 && !loading && (
            <tr>
              <td
                colSpan={10}
                style={{
                  border: '1px solid #ddd',
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                Không có shop nào.
              </td>
            </tr>
          )}

          {shops.map((s) => (
            <tr key={s.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.id}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.slug}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {s.userId}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {s.email || '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {s.shopPhone || '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <select
                  value={statusDrafts[s.id] || s.status}
                  onChange={(e) =>
                    handleChangeStatusDraft(
                      s.id,
                      e.target.value as ShopStatus,
                    )
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {s.shopAddress || '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                {new Date(s.createdAt).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <button
                  type="button"
                  onClick={() => handleSaveStatus(s.id)}
                  disabled={savingId === s.id}
                  style={{ marginRight: 8 }}
                >
                  {savingId === s.id ? 'Đang lưu...' : 'Lưu trạng thái'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteShop(s.id)}
                  disabled={deletingId === s.id}
                  style={{ backgroundColor: '#dc2626', color: '#fff' }}
                >
                  {deletingId === s.id ? 'Đang xoá...' : 'Xoá shop'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Trang trước
        </button>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default AdminShopsListPage;
