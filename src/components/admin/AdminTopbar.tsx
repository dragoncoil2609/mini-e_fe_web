import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiLogOut,
  FiSearch,
  FiUser,
} from 'react-icons/fi';

import type { User } from '../../api/types';
import { AuthApi } from '../../api/auth.api';
import { clearAccessToken } from '../../api/authToken';

interface AdminTopbarProps {
  currentUser?: User | null;
}

function clearAuthStorage() {
  clearAccessToken();

  localStorage.removeItem('mini_e_access_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  sessionStorage.removeItem('user');
}

export default function AdminTopbar({ currentUser }: AdminTopbarProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await AuthApi.logout();
    } catch {
      // Nếu BE logout lỗi vẫn cho FE thoát để tránh bị kẹt phiên đăng nhập.
    } finally {
      clearAuthStorage();

      setLoggingOut(false);

      navigate('/login', {
        replace: true,
        state: {
          message: 'Bạn đã đăng xuất thành công.',
        },
      });
    }
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-search">
        <FiSearch />
        <input placeholder="Tìm kiếm quản trị..." />
      </div>

      <div className="admin-topbar-right">
        <button type="button" className="admin-topbar-icon">
          <FiBell />
          <span>3</span>
        </button>

        <div className="admin-topbar-user">
          <div className="admin-topbar-avatar">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} />
            ) : (
              <FiUser />
            )}
          </div>

          <div>
            <strong>{currentUser?.name || 'Admin'}</strong>
            <p>Quản trị viên</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-topbar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Đăng xuất"
        >
          <FiLogOut />
          <span>{loggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
        </button>
      </div>
    </header>
  );
}