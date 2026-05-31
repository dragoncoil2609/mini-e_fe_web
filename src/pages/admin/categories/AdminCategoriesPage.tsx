import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import './AdminCategoriesPage.css';

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type Category,
  type CategoryFormPayload,
} from '../../../api/categories.api';

type ModalMode = 'create' | 'edit' | null;

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
  imageRemoved: boolean;
};

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
  imageRemoved: false,
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.message === 'string'
  ) {
    return (error as any).response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Có lỗi xảy ra, vui lòng thử lại';
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unwrapAdminCategories(responseData: any): Category[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items;
  }

  return [];
}

function getAdminCategoriesTotal(responseData: any): number {
  return Number(responseData?.meta?.total ?? 0);
}

function getAdminCategoriesTotalPages(responseData: any): number {
  return Math.max(Number(responseData?.meta?.totalPages ?? 1), 1);
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isEditMode = modalMode === 'edit';

  const parentOptions = useMemo(() => {
    return categories.filter((category) => category.id !== editingId);
  }, [categories, editingId]);

  const categoryById = useMemo(() => {
    const map = new Map<number, Category>();

    for (const category of categories) {
      map.set(category.id, category);
    }

    return map;
  }, [categories]);

  useEffect(() => {
    void loadCategories(page, searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchKeyword]);

  async function loadCategories(nextPage = page, q = searchKeyword) {
    try {
      setLoading(true);
      setError('');

      const res = await getAdminCategories({
        q,
        page: nextPage,
        limit,
        sortBy: 'sortOrder',
        sortOrder: 'ASC',
      });

      const data = res.data;

      setCategories(unwrapAdminCategories(data));
      setTotal(getAdminCategoriesTotal(data));
      setTotalPages(getAdminCategoriesTotalPages(data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: modalMode === 'create' ? normalizeSlug(value) : prev.slug,
    }));
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearchKeyword(keyword.trim());
  }

  function clearSearch() {
    setKeyword('');
    setSearchKeyword('');
    setPage(1);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File category phải là ảnh');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh category tối đa 2MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      imageRemoved: false,
    }));

    setError('');
  }

  function removeImage() {
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
      imageRemoved: true,
    }));
  }

  function closeModal(options?: { keepMessage?: boolean }) {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setError('');

    if (!options?.keepMessage) {
      setMessage('');
    }
  }

  function openCreateModal() {
    setModalMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setError('');
  }

  function openEditModal(category: Category) {
    setModalMode('edit');
    setEditingId(category.id);
    setMessage('');
    setError('');

    setForm({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      parentId: category.parentId ? String(category.parentId) : '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: Boolean(category.isActive),
      imageFile: null,
      imagePreview: category.imageUrl ?? '',
      imageRemoved: false,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError('Tên category không được để trống');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload: CategoryFormPayload = {
        name,
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        parentId: form.parentId
          ? Number(form.parentId)
          : isEditMode
            ? null
            : undefined,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
        imageFile: form.imageFile,
        imageUrl: form.imageRemoved ? null : undefined,
      };

      if (isEditMode && editingId) {
        await updateCategory(editingId, payload);
        setMessage('Cập nhật category thành công');
      } else {
        await createCategory(payload);
        setMessage('Tạo category thành công');
      }

      closeModal({ keepMessage: true });

      setPage(1);
      await loadCategories(1, searchKeyword);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa category "${category.name}" không?`,
    );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await deleteCategory(category.id);
      setMessage('Xóa category thành công');

      if (editingId === category.id) {
        closeModal({ keepMessage: true });
      }

      const shouldGoPreviousPage = categories.length === 1 && page > 1;
      const nextPage = shouldGoPreviousPage ? page - 1 : page;

      if (shouldGoPreviousPage) {
        setPage(nextPage);
      } else {
        await loadCategories(nextPage, searchKeyword);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function getParentName(parentId?: number | null) {
    if (!parentId) {
      return 'Danh mục gốc';
    }

    return categoryById.get(parentId)?.name ?? `#${parentId}`;
  }

  return (
    <div className="mochi-page admin-categories-page">
      <div className="mochi-container">
        <div className="admin-categories-hero">
          <div>
            <p className="admin-categories-eyebrow">Quản trị danh mục</p>
            <h1>Category sản phẩm</h1>
            <p>
              Tạo danh mục mới, upload ảnh đại diện và quản lý trạng thái hiển
              thị trên giao diện người dùng.
            </p>
          </div>

          <div className="admin-categories-hero-card">
            <strong>{loading ? '...' : total}</strong>
            <span>Tổng category</span>
          </div>
        </div>

        {message && <div className="admin-category-alert success">{message}</div>}
        {error && <div className="admin-category-alert error">{error}</div>}

        <section className="mochi-card mochi-card-padding admin-category-list-card">
          <div className="admin-card-title-row">
            <div>
              <h2>Danh sách category</h2>
              <p>Quản lý toàn bộ category của website.</p>
            </div>

            <div className="admin-category-title-actions">
              <button
                type="button"
                className="mochi-btn mochi-btn-primary mochi-btn-sm"
                onClick={openCreateModal}
                disabled={loading || saving}
              >
                + Tạo category mới
              </button>

              <button
                type="button"
                className="mochi-btn mochi-btn-soft mochi-btn-sm"
                onClick={() => loadCategories(page, searchKeyword)}
                disabled={loading || saving}
              >
                Tải lại
              </button>
            </div>
          </div>

          <form className="admin-category-toolbar" onSubmit={handleSearchSubmit}>
            <input
              className="mochi-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, slug hoặc ID..."
            />

            <button
              type="submit"
              className="mochi-btn mochi-btn-primary mochi-btn-sm"
              disabled={loading || saving}
            >
              Tìm kiếm
            </button>

            {searchKeyword && (
              <button
                type="button"
                className="mochi-btn mochi-btn-outline mochi-btn-sm"
                onClick={clearSearch}
                disabled={loading || saving}
              >
                Xóa lọc
              </button>
            )}
          </form>

          {loading ? (
            <div className="mochi-empty">
              <h3 className="mochi-empty-title">Đang tải category...</h3>
              <p className="mochi-empty-desc">Vui lòng chờ trong giây lát.</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="mochi-empty">
              <h3 className="mochi-empty-title">Chưa có category</h3>
              <p className="mochi-empty-desc">
                Hãy bấm “Tạo category mới” để thêm category đầu tiên.
              </p>
            </div>
          ) : (
            <>
              <div className="admin-category-table-wrap">
                <table className="admin-category-table">
                  <thead>
                    <tr>
                      <th>Ảnh</th>
                      <th>Thông tin</th>
                      <th>Category cha</th>
                      <th>Thứ tự</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <div className="admin-category-thumb">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} />
                            ) : (
                              <span>🐰</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <strong>{category.name}</strong>
                          <small>/{category.slug}</small>
                          {category.description && <p>{category.description}</p>}
                        </td>

                        <td>{getParentName(category.parentId)}</td>

                        <td>{category.sortOrder ?? 0}</td>

                        <td>
                          <span
                            className={`admin-category-status ${
                              category.isActive ? 'active' : 'inactive'
                            }`}
                          >
                            {category.isActive ? 'Hiển thị' : 'Đang ẩn'}
                          </span>
                        </td>

                        <td>
                          <div className="admin-category-row-actions">
                            <button
                              type="button"
                              className="mochi-btn mochi-btn-soft mochi-btn-sm"
                              onClick={() => openEditModal(category)}
                              disabled={saving}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="mochi-btn mochi-btn-danger mochi-btn-sm"
                              onClick={() => handleDelete(category)}
                              disabled={saving}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-category-pagination">
                <span>
                  Hiển thị {categories.length} / {total} category
                </span>

                <div>
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page <= 1 || loading || saving}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    ‹ Trước
                  </button>

                  <strong>
                    Trang {page} / {totalPages}
                  </strong>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page >= totalPages || loading || saving}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Sau ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {modalMode && (
          <div className="admin-category-modal-backdrop">
            <div className="admin-category-modal">
              <div className="admin-category-modal-header">
                <div>
                  <h2>
                    {isEditMode
                      ? `Cập nhật category #${editingId}`
                      : 'Tạo category mới'}
                  </h2>
                  <p>
                    Ảnh sẽ được gửi lên backend, sau đó backend upload lên
                    Cloudinary.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-category-modal-close"
                  onClick={() => closeModal()}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <form className="admin-category-modal-form" onSubmit={handleSubmit}>
                <div className="admin-category-image-picker">
                  <div className="admin-category-image-preview">
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="Category preview" />
                    ) : (
                      <span>🖼️</span>
                    )}
                  </div>

                  <div className="admin-category-image-actions">
                    <label className="mochi-btn mochi-btn-soft">
                      Chọn ảnh
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                      />
                    </label>

                    {(form.imagePreview || form.imageFile) && (
                      <button
                        type="button"
                        className="mochi-btn mochi-btn-outline"
                        onClick={removeImage}
                        disabled={saving}
                      >
                        Xóa ảnh
                      </button>
                    )}

                    <small>JPEG, PNG, WEBP hoặc GIF. Tối đa 2MB.</small>
                  </div>
                </div>

                <div className="admin-category-modal-grid">
                  <div className="mochi-form-group">
                    <label className="mochi-label">Tên category</label>
                    <input
                      className="mochi-input"
                      value={form.name}
                      onChange={(event) => handleNameChange(event.target.value)}
                      placeholder="Ví dụ: Gấu bông"
                      disabled={saving}
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Slug</label>
                    <input
                      className="mochi-input"
                      value={form.slug}
                      onChange={(event) =>
                        updateForm('slug', normalizeSlug(event.target.value))
                      }
                      placeholder="gau-bong"
                      disabled={saving}
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Category cha</label>
                    <select
                      className="mochi-select"
                      value={form.parentId}
                      onChange={(event) =>
                        updateForm('parentId', event.target.value)
                      }
                      disabled={saving}
                    >
                      <option value="">Danh mục gốc</option>
                      {parentOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Thứ tự</label>
                    <input
                      className="mochi-input"
                      type="number"
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateForm('sortOrder', event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Trạng thái</label>
                    <select
                      className="mochi-select"
                      value={String(form.isActive)}
                      onChange={(event) =>
                        updateForm('isActive', event.target.value === 'true')
                      }
                      disabled={saving}
                    >
                      <option value="true">Đang hiển thị</option>
                      <option value="false">Đang ẩn</option>
                    </select>
                  </div>
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Mô tả</label>
                  <textarea
                    className="mochi-textarea"
                    value={form.description}
                    onChange={(event) =>
                      updateForm('description', event.target.value)
                    }
                    placeholder="Mô tả ngắn cho category..."
                    disabled={saving}
                  />
                </div>

                <div className="admin-category-modal-actions">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline"
                    onClick={() => closeModal()}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="mochi-btn mochi-btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Đang lưu...'
                      : isEditMode
                        ? 'Lưu thay đổi'
                        : 'Tạo category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}