import { NavLink } from 'react-router-dom';
import {
  FiBox,
  FiGrid,
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
  FiUsers,
} from 'react-icons/fi';

import bunny from '../../assets/brand/bunny_bear_original.png';

const menu = [
  { to: '/admin', label: 'Tổng quan', icon: <FiHome /> },
  { to: '/admin/users', label: 'Người dùng', icon: <FiUsers /> },
  { to: '/admin/shops', label: 'Shop', icon: <FiShoppingBag /> },
  { to: '/admin/products', label: 'Sản phẩm', icon: <FiBox /> },
  { to: '/admin/categories', label: 'Danh mục', icon: <FiGrid /> },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <img src={bunny} alt="Mochi" />

        <div>
          <strong>Mochi</strong>
          <span>Admin</span>
        </div>
      </div>

      <nav className="admin-sidebar-menu">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              isActive ? 'admin-sidebar-link active' : 'admin-sidebar-link'
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-art">
        <img src={bunny} alt="Mochi mascot" />
      </div>
    </aside>
  );
}