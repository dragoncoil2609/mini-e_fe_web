import { NavLink, useNavigate } from 'react-router-dom';
import './AccountSidebar.css';

import { clearAccessToken } from '../../api/authToken';
import basketChick from '../../assets/brand/basket_chick.png';

type AccountMenuItem = {
  label: string;
  path: string;
  icon: string;
  end?: boolean;
};

const accountMenus: AccountMenuItem[] = [
  {
    label: 'Tổng quan',
    path: '/me',
    icon: '▦',
    end: true,
  },
  {
    label: 'Thông tin cá nhân',
    path: '/me/profile',
    icon: '👤',
  },
  {
    label: 'Địa chỉ của tôi',
    path: '/addresses',
    icon: '✦',
  },
  {
    label: 'Đơn hàng của tôi',
    path: '/orders',
    icon: '▣',
  },
  {
    label: 'Sản phẩm yêu thích',
    path: '/favorites',
    icon: '♡',
  },
  {
    label: 'Voucher của tôi',
    path: '/vouchers',
    icon: '✿',
  },
  {
    label: 'Đổi mật khẩu',
    path: '/change-password',
    icon: '🔒',
  },
];

export default function AccountSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccessToken();

    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    navigate('/login', { replace: true });
  };

  return (
    <aside className="account-sidebar">
      <div className="account-sidebar-title">
        <span className="account-sidebar-title-icon">👤</span>
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
        >
          <span className="account-sidebar-icon">↪</span>
          <span className="account-sidebar-text">Đăng xuất</span>
        </button>
      </nav>

      <div className="account-sidebar-bottom">
        <img src={basketChick} alt="Mochi cute" />
      </div>
    </aside>
  );
}