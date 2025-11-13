import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { type UserItem } from '../api/users/users.service';
import { shopsApi, type ShopItem } from '../api/shops/shops.service';

interface ProfileShopProps {
  profile: UserItem;
  onProfileReload: () => void;
  refreshTrigger?: number;
}

async function checkShopExists(userId?: number): Promise<ShopItem | null> {
  try {
    console.log('🔍 Đang kiểm tra shop...');
    const shop = await shopsApi.getMine(userId);
    console.log('📦 Response từ API:', shop);
    if (shop && shop.id) {
      console.log('✅ User đã có shop với ID:', shop.id);
      return shop;
    }
    console.log('❌ Shop không hợp lệ hoặc không có ID');
    return null;
  } catch (error: any) {
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    
    console.error('❌ Lỗi khi kiểm tra shop:', error);
    console.error('Status:', status);
    console.error('Data:', errorData);
    
    if (status === 404) {
      console.log('ℹ️ Không tìm thấy shop (404) - User chưa có shop');
      return null;
    }
    
    if (status === 500) {
      console.error('⚠️ Server error (500) - Có thể backend có vấn đề');
      const errorMessage = errorData?.message || error?.message || 'Lỗi server';
      if (errorMessage.includes('chưa có shop') || errorMessage.includes('not found')) {
        console.log('ℹ️ Server báo user chưa có shop');
        return null;
      }
      throw new Error(`Lỗi server: ${errorMessage}`);
    }
    
    throw error;
  }
}

export default function ProfileShop({ profile, onProfileReload, refreshTrigger }: ProfileShopProps) {
  const [myShop, setMyShop] = useState<ShopItem | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShop = async () => {
    try {
      setLoadingShop(true);
      setError(null);
      const shop = await checkShopExists(profile.id);
      setMyShop(shop);
      if (!shop) {
        console.log('ℹ️ User chưa có shop - Hiển thị form đăng ký');
      } else {
        console.log('✅ User đã có shop - Hiển thị giao diện quản lý:', shop);
      }
    } catch (error: any) {
      console.error('❌ Error loading shop:', error);
      const errorMsg = error?.message || 'Không thể tải thông tin shop. Vui lòng thử lại.';
      setError(errorMsg);
      // KHÔNG set myShop = null khi gặp lỗi 500
      // Vì có thể user đã có shop nhưng backend có bug
      // Chỉ set null khi chắc chắn là 404 (chưa có shop)
      const status = error?.response?.status;
      if (status === 404) {
        setMyShop(null);
      }
      // Nếu là 500 hoặc lỗi khác, giữ nguyên myShop (có thể đã có shop)
    } finally {
      setLoadingShop(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, [profile, refreshTrigger]);

  if (loadingShop) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <p className="text-sm text-gray-600">
            Có vấn đề với server. Vui lòng thử lại sau hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục.
          </p>
        </div>
        <button
          onClick={loadShop}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (myShop && myShop.id) {
    return (
      <ShopManagementView
        shop={myShop}
        onShopUpdated={loadShop}
        onShopDeleted={() => {
          setMyShop(null);
          onProfileReload();
        }}
      />
    );
  }

  return <ShopRegisterForm profile={profile} onSuccess={loadShop} />;
}

function ShopManagementView({
  shop,
  onShopUpdated,
  onShopDeleted,
}: {
  shop: ShopItem;
  onShopUpdated: () => void;
  onShopDeleted: () => void;
}) {
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await shopsApi.delete(shop.id);
      onShopDeleted();
    } catch (error: any) {
      window.alert(error.message || 'Không thể xóa shop. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="h-32 w-32 rounded-full object-cover bg-gray-200 border-2 border-gray-300"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <Store className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          onClick={() => {
            const url = window.prompt('Nhập URL logo shop:');
            if (url && url.trim()) {
              shopsApi
                .update(shop.id, { logoUrl: url.trim() })
                .then(() => onShopUpdated())
                .catch((err) => window.alert(err.message || 'Không thể cập nhật logo'));
            }
          }}
        >
          Chọn
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 mt-2">{shop.name}</h2>
        {shop.description && (
          <p className="text-gray-600 text-center max-w-md">{shop.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate('/seller')}
          className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
        >
          Thêm sản phẩm
        </button>

        <button
          onClick={() => setShowEditForm(true)}
          className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
        >
          Chỉnh sửa thông tin
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium disabled:opacity-60"
        >
          {deleting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent inline-block mr-2" />
              <span>Đang xóa...</span>
            </>
          ) : (
            <span>{showDeleteConfirm ? 'Xác nhận xóa' : 'Delete'}</span>
          )}
        </button>
      </div>

      {showDeleteConfirm && !deleting && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
          Bạn có chắc chắn muốn xóa shop? Hành động này không thể hoàn tác.
        </div>
      )}

      {showEditForm && (
        <ShopEditForm
          shop={shop}
          onSuccess={() => {
            setShowEditForm(false);
            onShopUpdated();
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

function ShopEditForm({
  shop,
  onSuccess,
  onCancel,
}: {
  shop: ShopItem;
  onSuccess: () => void;
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
      await shopsApi.update(shop.id, {
        name: name.trim(),
        description: description.trim() || '',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật shop. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
      <h3 className="text-lg font-semibold mb-4">Chỉnh sửa thông tin shop</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-shop-name" className="block text-sm font-medium text-gray-700 mb-1">
            Tên shop <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-shop-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-shop-description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả shop
          </label>
          <textarea
            id="edit-shop-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            disabled={submitting}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopRegisterForm({
  profile,
  onSuccess,
}: {
  profile: UserItem;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(profile.email || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkShopName = async (shopName: string) => {
    if (!shopName.trim()) {
      setNameError(null);
      return;
    }
    
    setCheckingName(true);
    setNameError(null);
    
    try {
      const result = await shopsApi.checkName(shopName.trim());
      if (result.exists) {
        setNameError('Tên shop đã tồn tại. Vui lòng chọn tên khác.');
      } else {
        setNameError(null);
      }
    } catch (err: any) {
      console.error('Error checking shop name:', err);
      // Không hiển thị lỗi khi check name, chỉ khi submit
    } finally {
      setCheckingName(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(null);
    
    // Clear previous timeout
    if (nameCheckTimeoutRef.current) {
      clearTimeout(nameCheckTimeoutRef.current);
    }
    
    // Debounce check name
    if (value.trim()) {
      nameCheckTimeoutRef.current = setTimeout(() => {
        checkShopName(value);
      }, 500);
    }
  };
  
  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (nameCheckTimeoutRef.current) {
        clearTimeout(nameCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên shop');
      return;
    }
    if (nameError) {
      setError('Tên shop không hợp lệ');
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email shop');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }

    // Kiểm tra lại tên shop trước khi submit
    setCheckingName(true);
    try {
      const result = await shopsApi.checkName(name.trim());
      if (result.exists) {
        setNameError('Tên shop đã tồn tại. Vui lòng chọn tên khác.');
        setError('Tên shop đã tồn tại. Vui lòng chọn tên khác.');
        setCheckingName(false);
        return;
      }
    } catch (err: any) {
      console.error('Error checking shop name:', err);
    } finally {
      setCheckingName(false);
    }

    setSubmitting(true);
    setError(null);

    try {
      await shopsApi.create({
        name: name.trim(),
        email: email.trim(),
        description: description.trim() || '',
      });
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể đăng ký shop. Vui lòng thử lại.';
      setError(errorMsg);
      if (errorMsg.includes('đã có shop') || errorMsg.includes('already have')) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
          <Store className="w-10 h-10 text-orange-500" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Đăng ký shop</p>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Tạo shop của bạn để bắt đầu đăng bán sản phẩm
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="shop-name" className="block text-sm font-medium text-gray-700 mb-1">
            Tên shop <span className="text-red-500">*</span>
          </label>
          <input
            id="shop-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nhập tên shop"
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${
              nameError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            }`}
            disabled={submitting || checkingName}
            required
          />
          {checkingName && (
            <p className="mt-1 text-xs text-gray-500">Đang kiểm tra tên shop...</p>
          )}
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
        </div>

        <div>
          <label htmlFor="shop-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email shop <span className="text-red-500">*</span>
          </label>
          <input
            id="shop-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email shop"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label htmlFor="shop-description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả shop
          </label>
          <textarea
            id="shop-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả về shop của bạn"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang đăng ký...</span>
            </>
          ) : (
            <>
              <Store className="h-4 w-4" />
              <span>Đăng ký shop</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

