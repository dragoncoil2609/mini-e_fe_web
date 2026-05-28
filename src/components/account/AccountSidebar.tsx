import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiUser,
  FiMapPin,
  FiPackage,
  FiHeart,
  FiGift,
  FiLock,
  FiLogOut,
} from 'react-icons/fi';

import './AccountSidebar.css';

import { AuthApi } from '../../api/auth.api';
import { clearAccessToken } from '../../api/authToken';
import basketChick from '../../assets/brand/basket_chick.png';

type AccountMenuItem = {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
};

const accountMenus: AccountMenuItem[] = [
  {
    label: 'Tổng quan',
    path: '/me',
    icon: <FiGrid />,
    end: true,
  },
  {
    label: 'Thông tin cá nhân',
    path: '/me/profile',
    icon: <FiUser />,
  },
  {
    label: 'Địa chỉ của tôi',
    path: '/addresses',
    icon: <FiMapPin />,
  },
  {
    label: 'Đơn hàng của tôi',
    path: '/orders',
    icon: <FiPackage />,
  },
  {
    label: 'Sản phẩm yêu thích',
    path: '/favorites',
    icon: <FiHeart />,
  },
  {
    label: 'Voucher của tôi',
    path: '/vouchers',
    icon: <FiGift />,
  },
  {
    label: 'Đổi mật khẩu',
    path: '/change-password',
    icon: <FiLock />,
  },
];

export default function AccountSidebar() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      // Gọi BE để clear refreshToken cookie
      await AuthApi.logout();
    } catch (error) {
      // Nếu API lỗi vẫn cho FE logout để tránh kẹt tài khoản ở client
      clearAccessToken();
    } finally {
      clearAccessToken();

      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside className="account-sidebar">
      <div className="account-sidebar-title">
        <span className="account-sidebar-title-icon">
          <FiUser />
        </span>
        <span>Tài khoản của tôi</span>
      </div>

      <nav className="account-sidebar-menu">
        {accountMenus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              isActive
                ? 'account-sidebar-link active'
                : 'account-sidebar-link'
            }
          >
            <span className="account-sidebar-icon">{item.icon}</span>
            <span className="account-sidebar-text">{item.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className="account-sidebar-link account-sidebar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span className="account-sidebar-icon">
            <FiLogOut />
          </span>
          <span className="account-sidebar-text">
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </span>
        </button>
      </nav>

      <div className="account-sidebar-bottom">
        <img src={basketChick} alt="Mochi cute" />
      </div>
    </aside>
  );
}