import { useEffect, useState, useMemo } from 'react';
import { Store, User as UserIcon, ClipboardList, Bell, Ticket } from 'lucide-react';
import { usersApi, type UserItem } from '../api/users/users.service';
import { shopsApi } from '../api/shops/shops.service';
import ProfileUser from './ProfileUser';
import ProfileShop from './ProfileShop';

type TabKey = 'user' | 'orders' | 'notifications' | 'voucher' | 'shop';
type UserSubTabKey = 'account-profile' | 'account-bank' | 'account-address' | 'account-password' | 'account-notifications';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('user');
  const [userSubTab, setUserSubTab] = useState<UserSubTabKey>('account-profile');
  const [shopRefreshKey, setShopRefreshKey] = useState(0);

  const initials = useMemo(() => {
    if (!profile?.name) return '';
    const parts = profile.name.trim().split(' ');
    if (!parts.length) return '';
    return parts.slice(-2).map((p) => p[0]).join('').toUpperCase();
  }, [profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getMe();
      setProfile(data);
    } catch (e: any) {
      setError(e.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!profile) return null;

  const handleShopClick = async () => {
    try {
      const shop = await shopsApi.getMine(profile.id);
      if (shop && shop.id) {
        setActiveTab('shop');
        setShopRefreshKey((prev) => prev + 1);
      } else {
        setActiveTab('shop');
        setShopRefreshKey((prev) => prev + 1);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setActiveTab('shop');
        setShopRefreshKey((prev) => prev + 1);
      } else if (status === 500 && profile.role === 'SELLER') {
        setActiveTab('shop');
        setShopRefreshKey((prev) => prev + 1);
      } else {
        setActiveTab('shop');
        setShopRefreshKey((prev) => prev + 1);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'user':
        return <ProfileUser profile={profile} onProfileUpdate={setProfile} activeTab={userSubTab} onTabChange={setUserSubTab} />;
      case 'shop':
        return (
          <div className="rounded-2xl bg-white p-8 shadow">
            <ProfileShop profile={profile} onProfileReload={loadProfile} refreshTrigger={shopRefreshKey} />
          </div>
        );
      case 'orders':
        return (
          <div className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Đơn mua</h2>
            <p className="mt-4 text-gray-600">Chưa có đơn mua nào.</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
            <p className="mt-4 text-gray-600">Hiện chưa có thông báo mới.</p>
          </div>
        );
      case 'voucher':
        return (
          <div className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Voucher</h2>
            <p className="mt-4 text-gray-600">Chưa có voucher nào khả dụng.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center gap-3 border-b pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
              {initials || <UserIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Xin chào</p>
              <p className="font-semibold text-gray-900">{profile.name}</p>
            </div>
          </div>
          <nav className="mt-6 space-y-2">
            <div>
              <button
                onClick={() => setActiveTab('user')}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                  activeTab === 'user'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Tài khoản của tôi</span>
              </button>
              {activeTab === 'user' && (
                <div className="mt-2 ml-4 space-y-1">
                  <button
                    onClick={() => setUserSubTab('account-profile')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      userSubTab === 'account-profile'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => setUserSubTab('account-bank')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      userSubTab === 'account-bank'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Ngân Hàng
                  </button>
                  <button
                    onClick={() => setUserSubTab('account-address')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      userSubTab === 'account-address'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Địa chỉ
                  </button>
                  <button
                    onClick={() => setUserSubTab('account-password')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      userSubTab === 'account-password'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => setUserSubTab('account-notifications')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      userSubTab === 'account-notifications'
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cài đặt thông báo
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Đơn mua</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Thông báo</span>
            </button>
            <button
              onClick={() => setActiveTab('voucher')}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                activeTab === 'voucher'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>Voucher</span>
            </button>
            <button
              onClick={handleShopClick}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                activeTab === 'shop'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Quản lý shop</span>
            </button>
          </nav>
        </aside>

        <main>{renderContent()}</main>
      </div>
    </div>
  );
}

