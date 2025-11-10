import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, type UserItem } from '../api/users/users.service';
import { Mail, Shield, Calendar, User as UserIcon, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!user) return;
        // Thử lấy từ API để có dữ liệu mới nhất; fallback dùng user từ context
        try {
          const data = await usersApi.getById(user.id);
          if (mounted) setProfile(data);
        } catch {
          if (mounted) setProfile(user as any);
        }
      } catch (e: any) {
        setError(e.message || 'Không tải được hồ sơ');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <UserIcon className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-600">Hồ sơ người dùng</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link
              to="/shop-onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
              title="Đăng bán sản phẩm"
            >
              <Store className="w-4 h-4" />
              Bán sản phẩm
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {profile.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="text-gray-900">{profile.createdAt ? new Date(profile.createdAt).toLocaleString('vi-VN') : '-'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Vai trò</p>
                  <p className="text-gray-900 capitalize">{profile.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


