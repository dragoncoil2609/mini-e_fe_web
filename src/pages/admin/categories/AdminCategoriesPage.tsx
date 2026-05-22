import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import './AdminCategoriesPage.css';

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type Category,
  type CategoryFormPayload,
} from '../../../api/categories.api';

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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const parentOptions = useMemo(() => {
    return categories.filter((category) => category.id !== editingId);
  }, [categories, editingId]);

  const filteredCategories = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(q) ||
        category.slug.toLowerCase().includes(q) ||
        String(category.id).includes(q)
      );
    });
  }, [categories, keyword]);

  const categoryById = useMemo(() => {
    const map = new Map<number, Category>();

    for (const category of categories) {
      map.set(category.id, category);
    }

    return map;
  }, [categories]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError('');

      const res = await getAdminCategories();
      setCategories(res.data ?? []);
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
      // Nếu đang tạo mới và slug đang rỗng thì tự gợi ý slug.
      slug: editingId ? prev.slug : normalizeSlug(value),
    }));
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
  }

  function removeImage() {
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
      imageRemoved: true,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setError('');
  }

  function handleEdit(category: Category) {
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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
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
          : editingId
            ? null
            : undefined,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
        imageFile: form.imageFile,
        imageUrl: form.imageRemoved ? null : undefined,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        setMessage('Cập nhật category thành công');
      } else {
        await createCategory(payload);
        setMessage('Tạo category thành công');
      }

      resetForm();
      await loadCategories();
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
        resetForm();
      }

      await loadCategories();
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
            <strong>{categories.length}</strong>
            <span>Tổng category</span>
          </div>
        </div>

        {message && <div className="admin-category-alert success">{message}</div>}
        {error && <div className="admin-category-alert error">{error}</div>}

        <div className="admin-categories-layout">
          {/* Form tạo/sửa category */}
          <section className="mochi-card mochi-card-padding admin-category-form-card">
            <div className="admin-card-title-row">
              <div>
                <h2>{editingId ? 'Cập nhật category' : 'Thêm category mới'}</h2>
                <p>
                  Ảnh sẽ được gửi lên backend, sau đó backend upload lên
                  Cloudinary.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline mochi-btn-sm"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Hủy sửa
                </button>
              )}
            </div>

            <form className="mochi-form" onSubmit={handleSubmit}>
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
                    >
                      Xóa ảnh
                    </button>
                  )}

                  <small>JPEG, PNG, WEBP hoặc GIF. Tối đa 2MB.</small>
                </div>
              </div>

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

              <div className="mochi-form-row">
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
              </div>

              <div className="mochi-form-row">
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

              <div className="admin-category-form-actions">
                <button
                  type="submit"
                  className="mochi-btn mochi-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingId
                      ? 'Lưu thay đổi'
                      : 'Thêm category'}
                </button>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Làm mới form
                </button>
              </div>
            </form>
          </section>

          {/* Danh sách category */}
          <section className="mochi-card mochi-card-padding admin-category-list-card">
            <div className="admin-card-title-row">
              <div>
                <h2>Danh sách category</h2>
                <p>Quản lý category đang dùng ở MainLayout.</p>
              </div>

              <button
                type="button"
                className="mochi-btn mochi-btn-soft mochi-btn-sm"
                onClick={loadCategories}
                disabled={loading || saving}
              >
                Tải lại
              </button>
            </div>

            <div className="admin-category-toolbar">
              <input
                className="mochi-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, slug hoặc ID..."
              />
            </div>

            {loading ? (
              <div className="mochi-empty">
                <h3 className="mochi-empty-title">Đang tải category...</h3>
                <p className="mochi-empty-desc">Vui lòng chờ trong giây lát.</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="mochi-empty">
                <h3 className="mochi-empty-title">Chưa có category</h3>
                <p className="mochi-empty-desc">
                  Hãy tạo category đầu tiên cho website.
                </p>
              </div>
            ) : (
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
                    {filteredCategories.map((category) => (
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
                          {category.description && (
                            <p>{category.description}</p>
                          )}
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
                              onClick={() => handleEdit(category)}
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}