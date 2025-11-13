import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, Edit, Trash2 } from 'lucide-react';
import { shopsApi, type ShopItem } from '../api/shops/shops.service';

export default function ShopManagementPage() {
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadShop = async () => {
    try {
      setLoading(true);
      setError(null);
      const myShop = await shopsApi.getMine();
      if (myShop && myShop.id) {
        setShop(myShop);
      } else {
        setError('Bạn chưa có shop');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 500) {
        setError('Bạn chưa có shop');
      } else {
        setError(err.message || 'Không thể tải thông tin shop');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, []);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!shop) return;

    setDeleting(true);
    try {
      await shopsApi.delete(shop.id);
      navigate('/profile');
    } catch (error: any) {
      window.alert(error.message || 'Không thể xóa shop. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateLogo = async () => {
    if (!shop) return;
    const url = window.prompt('Nhập URL logo shop:');
    if (url && url.trim()) {
      try {
        const updated = await shopsApi.update(shop.id, { logoUrl: url.trim() });
        setShop(updated);
      } catch (err: any) {
        window.alert(err.message || 'Không thể cập nhật logo');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-orange-600" />
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">Quản lý shop</h1>

          <div className="flex flex-col items-center justify-center gap-8 py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="h-32 w-32 rounded-full object-cover bg-gray-200"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <Store className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                onClick={handleUpdateLogo}
              >
                Chọn logo
              </button>
            </div>

            <div className="w-full max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên shop</label>
                <p className="text-gray-900 font-medium">{shop.name}</p>
              </div>
              {shop.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <p className="text-gray-600">{shop.description}</p>
                </div>
              )}
              {shop.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-600">{shop.email}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/seller')}
                className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Thêm sản phẩm
              </button>

              <button
                onClick={() => setShowEditForm(true)}
                className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa thông tin
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium disabled:opacity-60 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{showDeleteConfirm ? 'Xác nhận xóa' : 'Xóa shop'}</span>
                  </>
                )}
              </button>
            </div>

            {showDeleteConfirm && !deleting && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center max-w-md">
                Bạn có chắc chắn muốn xóa shop? Hành động này không thể hoàn tác.
              </div>
            )}

            {showEditForm && (
              <ShopEditForm
                shop={shop}
                onSuccess={(updated) => {
                  setShop(updated);
                  setShowEditForm(false);
                }}
                onCancel={() => setShowEditForm(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopEditForm({
  shop,
  onSuccess,
  onCancel,
}: {
  shop: ShopItem;
  onSuccess: (shop: ShopItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên shop');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await shopsApi.update(shop.id, {
        name: name.trim(),
        description: description.trim() || '',
      });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật shop');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Chỉnh sửa thông tin shop</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên shop *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên shop"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả về shop của bạn"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}

