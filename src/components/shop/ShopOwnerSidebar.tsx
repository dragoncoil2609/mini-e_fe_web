import { Link, NavLink } from 'react-router-dom';

import basketImg from '../../assets/brand/basket_chick.png';

import './ShopOwnerSidebar.css';

type ShopOwnerSidebarProps = {
  shopId?: number;
};

export default function ShopOwnerSidebar({ shopId }: ShopOwnerSidebarProps) {
  return (
    <aside className="shop-owner-sidebar mochi-card">
      <div className="shop-owner-sidebar-title">🏪 Shop của tôi</div>

      <nav className="shop-owner-menu">
        <NavLink to="/shops/me" end>
          📊 Tổng quan
        </NavLink>

        <NavLink to="/shops/me/products">
          🧸 Sản phẩm
        </NavLink>

        <NavLink to="/shops/me/orders">
          📦 Đơn hàng
        </NavLink>

        <NavLink to="/shops/me/revenue">
          💰 Doanh thu
        </NavLink>

        <NavLink to="/shops/me/reviews">
          ⭐ Đánh giá
        </NavLink>

        <NavLink to="/shops/me/settings">
          ⚙️ Cài đặt
        </NavLink>
      </nav>

      {shopId ? (
        <Link to={`/shops/${shopId}`} className="shop-owner-view-link">
          Xem shop của tôi ↗
        </Link>
      ) : null}

      <img src={basketImg} alt="Mochi" className="shop-owner-sidebar-art" />
    </aside>
  );
}