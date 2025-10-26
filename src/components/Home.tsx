import { useState } from 'react';
import { LogOut, User, Mail, Shield, Calendar } from 'lucide-react';
import { authService } from '../api/auth.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface HomeProps {
  user: User;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mini E</h1>
              <p className="text-gray-600">Chào mừng bạn đến với hệ thống</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">Thông tin tài khoản</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Trạng thái xác minh</p>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày tạo tài khoản</p>
                  <p className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin bổ sung</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID tài khoản:</span>
                  <span className="text-sm font-medium text-gray-900">#{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vai trò:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {!user.isVerified && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <Shield className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Tài khoản chưa được xác minh
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Vui lòng xác minh tài khoản để sử dụng đầy đủ các tính năng của hệ thống.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
