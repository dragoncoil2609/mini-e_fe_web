import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../../../api/types';
import { createCategory, deleteCategory, getPublicCategories, getPublicCategoryTree, updateCategory } from '../../../api/categories.api';
import { getBeMessage } from '../../../api/apiError';
import './AdminCategoriesPage.css';

type ModalMode = 'create' | 'edit';

type CategoryFormState = {
  name: string;
  description: string;
  parentId: '' | number;
  isActive: boolean;
};

const emptyForm = (): CategoryFormState => ({
  name: '',
  description: '',
  parentId: '',
  isActive: true,
});

export default function AdminCategoriesPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyForm());

  const parentOptions = useMemo(() => {
    const out: Array<{ id: number; name: string }> = [];
    (tree ?? []).forEach((p) => {
      out.push({ id: p.id, name: p.name });
      (p.children ?? []).forEach((c) => out.push({ id: c.id, name: `— ${c.name}` }));
    });
    return out;
  }, [tree]);

  const mapParentName = useMemo(() => {
    const m = new Map<number, string>();
    parentOptions.forEach((p) => m.set(p.id, p.name.replace(/^—\s/, '')));
    return m;
  }, [parentOptions]);

  const fetchTree = async () => {
    try {
      const res = await getPublicCategoryTree();
      setTree(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTree([]);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!showAll) {
        const res = await getPublicCategories({ q: q.trim() || undefined, isActive: true });
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        const [on, off] = await Promise.all([
          getPublicCategories({ q: q.trim() || undefined, isActive: true }),
          getPublicCategories({ q: q.trim() || undefined, isActive: false }),
        ]);
        const a = Array.isArray(on.data) ? on.data : [];
        const b = Array.isArray(off.data) ? off.data : [];
        setItems([...a, ...b].sort((x, y) => x.name.localeCompare(y.name)));
      }
    } catch (e) {
      setError(getBeMessage(e, 'Không lấy được danh sách danh mục.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTree();
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setModalMode('create');
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setModalMode('edit');
    setEditing(cat);
    setForm({
      name: cat.name ?? '',
      description: (cat.description ?? '') as string,
      parentId: cat.parentId ?? '',
      isActive: cat.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const parentId = form.parentId === '' ? null : Number(form.parentId);

      if (modalMode === 'create') {
        const payload: CreateCategoryDto = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parentId,
          isActive: form.isActive,
        };
        const res = await createCategory(payload);
        const created = (res as any).data as Category;
        setItems((prev) => [created, ...prev]);
      } else if (editing) {
        const payload: UpdateCategoryDto = {
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          parentId,
          isActive: form.isActive,
        };
        const res = await updateCategory(editing.id, payload);
        const updated = (res as any).data as Category;
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }

      await fetchTree();
      await fetchList();
      setModalOpen(false);
    } catch (e) {
      setError(getBeMessage(e, 'Lưu danh mục thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (cat: Category) => {
    if (!window.confirm(`Xoá danh mục "${cat.name}"?`)) return;
    setError(null);
    try {
      await deleteCategory(cat.id);
      await fetchTree();
      await fetchList();
    } catch (e) {
      setError(getBeMessage(e, 'Xoá danh mục thất bại.'));
    }
  };

  return (
    <div className="admin-cats">
      <div className="admin-cats__topbar">
        <div className="admin-cats__titlewrap">
          <h1 className="admin-cats__title">Quản lý danh mục</h1>
          <div className="admin-cats__subtitle">Tạo / sửa / xoá danh mục theo BE Categories</div>
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
          <div className="admin-toolbar__left">
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên..."
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 800 }}>
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Hiện cả inactive
            </label>
            <button type="button" className="btn btn--ghost" disabled={loading} onClick={() => fetchList()}>
              {loading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          <div className="admin-toolbar__right">
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              ＋ Tạo danh mục
            </button>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Tên</th>
              <th style={{ width: 220 }}>Parent</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 190 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 14, color: '#6b7280' }}>
                  {loading ? 'Đang tải...' : 'Không có danh mục.'}
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 900 }}>{c.name}</div>
                    {c.description ? <div style={{ color: '#6b7280', fontSize: 13 }}>{c.description}</div> : null}
                  </td>
                  <td>{c.parentId ? mapParentName.get(c.parentId) ?? `#${c.parentId}` : '—'}</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge--on' : 'badge--off'}`}>
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn--ghost" onClick={() => openEdit(c)}>
                        Sửa
                      </button>
                      <button type="button" className="btn btn--danger" onClick={() => void onDelete(c)}>
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay" onMouseDown={closeModal}>
          <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {modalMode === 'create' ? 'Tạo danh mục' : `Sửa danh mục #${editing?.id ?? ''}`}
              </h3>
              <button type="button" className="btn btn--ghost" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-modal__row">
                <div className="admin-modal__label">Tên</div>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="vd: Thời trang"
                />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__label">Parent</div>
                <select
                  className="select"
                  value={form.parentId === '' ? '' : String(form.parentId)}
                  onChange={(e) => setForm((s) => ({ ...s, parentId: e.target.value ? Number(e.target.value) : '' }))}
                >
                  <option value="">(Không có)</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__row admin-modal__row--full">
                <div className="admin-modal__label">Mô tả (tuỳ chọn)</div>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Mô tả danh mục..."
                />
              </div>

              <div className="admin-modal__row admin-modal__row--full">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 900 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  Đang hoạt động (isActive)
                </label>
              </div>
            </div>

            <div className="admin-modal__actions">
              <button type="button" className="btn btn--ghost" onClick={closeModal} disabled={saving}>
                Huỷ
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void submit()} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


