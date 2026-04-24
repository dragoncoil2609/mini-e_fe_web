import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createCategory,
  deleteCategory,
  getPublicCategories,
  getPublicCategoryTree,
  updateCategory,
} from '../../../api/categories.api';
import { getBeMessage } from '../../../api/apiError';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../../api/types';
import './AdminCategoriesPage.css';

type ModalMode = 'create' | 'edit';

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentId: '' | number;
  sortOrder: string;
  isActive: boolean;
};

type ParentOption = {
  id: number;
  name: string;
  level: number;
};

const emptyForm = (): CategoryFormState => ({
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
});

function flattenCategoryTree(
  categories: Category[],
  level = 0,
  result: ParentOption[] = [],
): ParentOption[] {
  for (const category of categories) {
    result.push({
      id: category.id,
      name: category.name,
      level,
    });

    if (category.children?.length) {
      flattenCategoryTree(category.children, level + 1, result);
    }
  }

  return result;
}

function collectDescendantIds(category: Category | null): Set<number> {
  const ids = new Set<number>();

  const walk = (node?: Category | null) => {
    if (!node?.children?.length) return;

    for (const child of node.children) {
      ids.add(child.id);
      walk(child);
    }
  };

  walk(category);

  return ids;
}

function findCategoryInTree(
  categories: Category[],
  id: number,
): Category | null {
  for (const category of categories) {
    if (category.id === id) return category;

    const found = findCategoryInTree(category.children ?? [], id);
    if (found) return found;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export default function AdminCategoriesPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);

  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm());

  const parentOptions = useMemo(() => {
    const flattened = flattenCategoryTree(tree);

    if (modalMode !== 'edit' || !editing) {
      return flattened;
    }

    const editingInTree = findCategoryInTree(tree, editing.id);
    const descendantIds = collectDescendantIds(editingInTree);

    return flattened.filter((option) => {
      if (option.id === editing.id) return false;
      if (descendantIds.has(option.id)) return false;
      return true;
    });
  }, [tree, modalMode, editing]);

  const parentNameMap = useMemo(() => {
    const map = new Map<number, string>();

    for (const option of flattenCategoryTree(tree)) {
      map.set(option.id, option.name);
    }

    return map;
  }, [tree]);

  const fetchTree = async () => {
    setTreeLoading(true);

    try {
      const res = await getPublicCategoryTree();
      setTree(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTree([]);
    } finally {
      setTreeLoading(false);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);

    try {
      const keyword = q.trim() || undefined;

      if (!showAll) {
        const res = await getPublicCategories({
          q: keyword,
          isActive: true,
        });

        setItems(Array.isArray(res.data) ? res.data : []);
        return;
      }

      const [activeRes, inactiveRes] = await Promise.all([
        getPublicCategories({
          q: keyword,
          isActive: true,
        }),
        getPublicCategories({
          q: keyword,
          isActive: false,
        }),
      ]);

      const activeItems = Array.isArray(activeRes.data) ? activeRes.data : [];
      const inactiveItems = Array.isArray(inactiveRes.data)
        ? inactiveRes.data
        : [];

      const merged = [...activeItems, ...inactiveItems].sort((a, b) => {
        const sortA = a.sortOrder ?? 0;
        const sortB = b.sortOrder ?? 0;

        if (sortA !== sortB) return sortA - sortB;

        return a.name.localeCompare(b.name, 'vi');
      });

      setItems(merged);
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
    setError(null);
  };

  const openEdit = (category: Category) => {
    setModalMode('edit');
    setEditing(category);
    setForm({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      parentId: category.parentId ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: normalizeBoolean(category.isActive),
    });
    setModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return 'Vui lòng nhập tên danh mục.';
    }

    if (form.name.trim().length > 120) {
      return 'Tên danh mục tối đa 120 ký tự.';
    }

    if (form.slug.trim().length > 160) {
      return 'Slug tối đa 160 ký tự.';
    }

    if (form.description.trim().length > 2000) {
      return 'Mô tả tối đa 2000 ký tự.';
    }

    const sortOrder = Number(form.sortOrder || 0);

    if (!Number.isInteger(sortOrder)) {
      return 'Thứ tự sắp xếp phải là số nguyên.';
    }

    if (
      modalMode === 'edit' &&
      editing &&
      form.parentId !== '' &&
      Number(form.parentId) === editing.id
    ) {
      return 'Không thể chọn chính danh mục hiện tại làm danh mục cha.';
    }

    return null;
  };

  const submit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const parentId = form.parentId === '' ? null : Number(form.parentId);
      const sortOrder = Number(form.sortOrder || 0);

      if (modalMode === 'create') {
        const payload: CreateCategoryDto = {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          parentId,
          sortOrder,
          isActive: form.isActive,
        };

        await createCategory(payload);
      } else if (editing) {
        const payload: UpdateCategoryDto = {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          parentId,
          sortOrder,
          isActive: form.isActive,
        };

        await updateCategory(editing.id, payload);
      }

      await fetchTree();
      await fetchList();

      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      setError(getBeMessage(e, 'Lưu danh mục thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (category: Category) => {
    const ok = window.confirm(
      `Xoá danh mục "${category.name}"?\n\nNếu danh mục đang có sản phẩm hoặc danh mục con thì hệ thống sẽ không cho xoá.`,
    );

    if (!ok) return;

    setDeletingId(category.id);
    setError(null);

    try {
      await deleteCategory(category.id);
      await fetchTree();
      await fetchList();
    } catch (e) {
      setError(getBeMessage(e, 'Xoá danh mục thất bại.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-cats">
      <div className="admin-cats__topbar">
        <div className="admin-cats__titlewrap">
          <h1 className="admin-cats__title">Quản lý danh mục</h1>
          <div className="admin-cats__subtitle">
            Danh mục do admin quản lý. Seller chỉ chọn danh mục có sẵn khi đăng
            sản phẩm.
          </div>
        </div>

        <div className="admin-cats__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/admin')}
          >
            ← Admin
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/home')}
          >
            🏠 Home
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-toolbar__left">
            <input
              className="input admin-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void fetchList();
                }
              }}
              placeholder="Tìm theo tên hoặc slug..."
            />

            <label className="admin-check">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              <span>Hiện cả inactive</span>
            </label>

            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading}
              onClick={() => void fetchList()}
            >
              {loading ? 'Đang tải...' : 'Tìm kiếm'}
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading || treeLoading}
              onClick={() => {
                setQ('');
                setShowAll(false);
                void fetchTree();
                void fetchList();
              }}
            >
              Làm mới
            </button>
          </div>

          <div className="admin-toolbar__right">
            <button
              type="button"
              className="btn btn--primary"
              onClick={openCreate}
            >
              ＋ Tạo danh mục
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Tên danh mục</th>
                <th style={{ width: 180 }}>Slug</th>
                <th style={{ width: 180 }}>Danh mục cha</th>
                <th style={{ width: 90 }}>Thứ tự</th>
                <th style={{ width: 120 }}>Trạng thái</th>
                <th style={{ width: 190 }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      {loading ? 'Đang tải danh mục...' : 'Không có danh mục.'}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>

                    <td>
                      <div className="cat-name">{category.name}</div>

                      {category.description ? (
                        <div className="cat-description">
                          {category.description}
                        </div>
                      ) : (
                        <div className="cat-description cat-description--muted">
                          Chưa có mô tả
                        </div>
                      )}
                    </td>

                    <td>
                      <code className="cat-slug">{category.slug}</code>
                    </td>

                    <td>
                      {category.parentId
                        ? parentNameMap.get(category.parentId) ??
                          `#${category.parentId}`
                        : '—'}
                    </td>

                    <td>{category.sortOrder ?? 0}</td>

                    <td>
                      <span
                        className={`badge ${
                          category.isActive ? 'badge--on' : 'badge--off'
                        }`}
                      >
                        {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEdit(category)}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={deletingId === category.id}
                          onClick={() => void onDelete(category)}
                        >
                          {deletingId === category.id ? 'Đang xoá...' : 'Xoá'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay" onMouseDown={closeModal}>
          <div
            className="admin-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {modalMode === 'create'
                  ? 'Tạo danh mục'
                  : `Sửa danh mục #${editing?.id ?? ''}`}
              </h3>

              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={closeModal}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-modal__row">
                <div className="admin-modal__label">
                  Tên danh mục <span className="required">*</span>
                </div>

                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      name: e.target.value,
                    }))
                  }
                  placeholder="VD: Thời trang"
                  maxLength={120}
                />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__label">Slug</div>

                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      slug: e.target.value,
                    }))
                  }
                  placeholder="Bỏ trống để BE tự tạo"
                  maxLength={160}
                />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__label">Danh mục cha</div>

                <select
                  className="select"
                  value={form.parentId === '' ? '' : String(form.parentId)}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      parentId: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                >
                  <option value="">Không có</option>

                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {'— '.repeat(option.level)}
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__label">Thứ tự sắp xếp</div>

                <input
                  className="input"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      sortOrder: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="admin-modal__row admin-modal__row--full">
                <div className="admin-modal__label">Mô tả</div>

                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về danh mục..."
                  maxLength={2000}
                />
              </div>

              <div className="admin-modal__row admin-modal__row--full">
                <label className="admin-check admin-check--strong">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((state) => ({
                        ...state,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  <span>Đang hoạt động</span>
                </label>

                <div className="admin-help-text">
                  Nếu tắt trạng thái này, user sẽ không thấy danh mục ở danh
                  sách public.
                </div>
              </div>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={closeModal}
                disabled={saving}
              >
                Huỷ
              </button>

              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void submit()}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}