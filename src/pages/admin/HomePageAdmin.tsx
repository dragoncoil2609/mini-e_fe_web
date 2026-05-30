import { useEffect, useMemo, useState } from 'react';
import {
  FiLock,
  FiShoppingBag,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import { getUsers } from '../../api/users.api';
import {
  getAdminShopStats,
  type AdminShopStats,
} from '../../api/shop.api';
import type { User } from '../../api/types';

import './HomePageAdmin.css';

const emptyShopStats: AdminShopStats = {
  total: 0,
  pending: 0,
  active: 0,
  suspended: 0,
};

function unwrapData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

export default function HomePageAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [shopStats, setShopStats] = useState<AdminShopStats>(emptyShopStats);
  const [loading, setLoading] = useState(true);

  async function fetchOverview() {
    try {
      setLoading(true);

      const [usersData, shopsStatsResponse] = await Promise.all([
        getUsers({
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
        getAdminShopStats(),
      ]);

      const statsData = unwrapData<AdminShopStats>(shopsStatsResponse);

      setUsers(usersData.items);
      setTotalUsers(usersData.meta.total);

      setShopStats({
        total: Number(statsData?.total ?? 0),
        pending: Number(statsData?.pending ?? 0),
        active: Number(statsData?.active ?? 0),
        suspended: Number(statsData?.suspended ?? 0),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOverview();
  }, []);

  const userStats = useMemo(() => {
    return {
      total: totalUsers,
      users: users.filter((u) => u.role === 'USER').length,
      sellers: users.filter((u) => u.role === 'SELLER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      unverified: users.filter((u) => !u.isVerified).length,
    };
  }, [users, totalUsers]);

  return (
    <div className="admin-home-page">
      <div className="admin-home-header">
        <div>
          <h1>Tổng quan</h1>
          <p>Thống kê nhanh hệ thống Mochi Admin</p>
        </div>
      </div>

      <section className="admin-home-section">
        <div className="admin-home-section-title">
          <h2>Người dùng</h2>
          <p>Thống kê tài khoản trong hệ thống</p>
        </div>

        <div className="admin-home-stats">
          <AdminHomeStatCard
            icon={<FiUsers />}
            label="Tổng người dùng"
            value={userStats.total}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiUser />}
            label="Người dùng"
            value={userStats.users}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiShoppingBag />}
            label="Người bán"
            value={userStats.sellers}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiShield />}
            label="Quản trị viên"
            value={userStats.admins}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiLock />}
            label="Chưa xác thực"
            value={userStats.unverified}
            loading={loading}
          />
        </div>
      </section>

      <section className="admin-home-section">
        <div className="admin-home-section-title">
          <h2>Shop</h2>
          <p>Thống kê trạng thái shop đăng ký bán hàng</p>
        </div>

        <div className="admin-home-stats admin-home-shop-stats">
          <AdminHomeStatCard
            icon={<FiShoppingBag />}
            label="Tổng shop"
            value={shopStats.total}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiLock />}
            label="Chờ duyệt"
            value={shopStats.pending}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiShield />}
            label="Đang hoạt động"
            value={shopStats.active}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiLock />}
            label="Tạm khóa"
            value={shopStats.suspended}
            loading={loading}
          />
        </div>
      </section>

      <section className="admin-home-empty">
        <h2>Trang tổng quan đang được xây dựng</h2>
        <p>
          Hiện tại đã có thống kê người dùng và shop. Sau này có API sản phẩm,
          đơn hàng thì gắn thêm vào đây.
        </p>
      </section>
    </div>
  );
}

function AdminHomeStatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="admin-home-stat">
      <span>{icon}</span>

      <div>
        <p>{label}</p>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </div>
  );
}