import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ApiResponse,
  Category,
  PaginatedResult,
  ProductListItem,
  ProductStatus,
} from '../../../api/types';
import {
  getAdminProducts,
  updateProduct,
  deleteProduct,
} from '../../../api/products.api';
import { getPublicCategories } from '../../../api/categories.api';
import { getBeMessage } from '../../../api/apiError';
import './AdminProductsPage.css';

type StatusFilter = '' | ProductStatus;

export default function AdminProductsPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [categoryId, setCategoryId] = useState<number>(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ProductStatus>>({});

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const sortedCats = useMemo(() => {
    return [...categories].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories]);

  const pillClass = (s: string) => {
    const v = String(s || '').toUpperCase();
    if (v === 'ACTIVE') return 'pill pill--active';
    if (v === 'DRAFT') return 'pill pill--draft';
    return 'pill pill--other';
  };

  const fetchCats = async () => {
    setLoadingCats(true);
    try {
      const res = await getPublicCategories({ isActive: true });
      const list = (res as ApiResponse<Category[]>).data;
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAdminProducts({
        page,
        limit,
        q: q.trim() || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
      });

      if (!res.success) {
        setError(res.message || 'Không lấy được danh sách sản phẩm.');
        setItems([]);
        setTotal(0);
        return;
      }

      const payload = (res as ApiResponse<PaginatedResult<ProductListItem>>).data;
      const list = Array.isArray(payload.items) ? payload.items : [];
      setItems(list);
      setTotal(Number(payload.total || 0));

      const drafts: Record<number, ProductStatus> = {};
      list.forEach((p) => {
        drafts[p.id] = p.status;
      });
      setStatusDrafts(drafts);
    } catch (e) {
      setError(getBeMessage(e, 'Không lấy được danh sách sản phẩm.'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCats();
  }, []);

  useEffect(() => {
    void fetchList();
  }, [page]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchList();
  };

  const onChangeDraft = (id: number, v: ProductStatus) => {
    setStatusDrafts((prev) => ({ ...prev, [id]: v }));
  };

  const onSaveStatus = async (id: number) => {
    const next = statusDrafts[id];
    if (!next) return;

    setSavingId(id);
    setError(null);

    try {
      const res = await updateProduct(id, { status: next });
      if (!res.success) {
        setError(res.message || 'Cập nhật trạng thái thất bại.');
        return;
      }
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    } catch (e) {
      setError(getBeMessage(e, 'Cập nhật trạng thái thất bại.'));
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await deleteProduct(id);
      if (!res.success) {
        setError(res.message || 'Xoá sản phẩm thất bại.');
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (e) {
      setError(getBeMessage(e, 'Xoá sản phẩm thất bại.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-products">
      <div className="admin-products__topbar">
        <div className="admin-products__titlewrap">
          <h1 className="admin-products__title">Quản lý sản phẩm</h1>
          <div className="admin-products__subtitle">
            Admin xem danh sách, đổi trạng thái và xoá
          </div>
        </div>

        <button type="button" className="btn btn--ghost" onClick={() => navigate('/admin')}>
          ← Admin
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => navigate('/home')}>
          🏠 Home
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-toolbar__left" onSubmit={onSearch}>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc slug..."
            />

            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="">-- Tất cả status --</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            <select
              className="select"
              value={String(categoryId)}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              disabled={loadingCats}
            >
              <option value="0">
                {loadingCats ? 'Đang tải danh mục...' : '-- Tất cả danh mục --'}
              </option>
              {sortedCats.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.parentId ? `— ${c.name}` : c.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Đang tải...' : 'Tìm'}
            </button>
          </form>

          <div className="admin-toolbar__right">
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 800 }}>
              Tổng: {total} • Trang {page}/{totalPages}
            </div>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Tên</th>
              <th style={{ width: 130 }}>ShopId</th>
              <th style={{ width: 140 }}>CategoryId</th>
              <th style={{ width: 140 }}>Status</th>
              <th style={{ width: 140 }}>Giá</th>
              <th style={{ width: 210 }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 14, color: '#6b7280' }}>
                  {loading ? 'Đang tải...' : 'Không có sản phẩm.'}
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>

                  <td>
                    <div style={{ fontWeight: 900 }}>{p.title}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{p.slug}</div>
                  </td>

                  <td>{p.shopId ?? '—'}</td>
                  <td>{p.categoryId ?? '—'}</td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span className={pillClass(p.status)}>{p.status}</span>

                      <select
                        className="select"
                        value={statusDrafts[p.id] || p.status}
                        onChange={(e) => onChangeDraft(p.id, e.target.value as ProductStatus)}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>

                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={savingId === p.id}
                        onClick={() => void onSaveStatus(p.id)}
                      >
                        {savingId === p.id ? '...' : 'Lưu'}
                      </button>
                    </div>
                  </td>

                  <td>{p.price}</td>

                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => navigate(`/products/${p.id}`)}
                      >
                        Xem
                      </button>

                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => navigate(`/me/products/${p.id}/edit`)}
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        className="btn btn--danger"
                        disabled={deletingId === p.id}
                        onClick={() => void onDelete(p.id)}
                      >
                        {deletingId === p.id ? '...' : 'Xoá'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div
          style={{
            padding: 12,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}