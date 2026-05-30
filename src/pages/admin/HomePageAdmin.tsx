import { useEffect, useMemo, useState } from 'react';
import {
  FiLock,
  FiShoppingBag,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import { getUsers } from '../../api/users.api';
import type { User } from '../../api/types';

import './HomePageAdmin.css';

export default function HomePageAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchOverview() {
    try {
      setLoading(true);

      const data = await getUsers({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      setUsers(data.items);
      setTotalUsers(data.meta.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOverview();
  }, []);

  const stats = useMemo(() => {
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

      <div className="admin-home-stats">
        <AdminHomeStatCard
          icon={<FiUsers />}
          label="Tổng người dùng"
          value={stats.total}
          loading={loading}
        />

        <AdminHomeStatCard
          icon={<FiUser />}
          label="Người dùng"
          value={stats.users}
          loading={loading}
        />

        <AdminHomeStatCard
          icon={<FiShoppingBag />}
          label="Người bán"
          value={stats.sellers}
          loading={loading}
        />

        <AdminHomeStatCard
          icon={<FiShield />}
          label="Quản trị viên"
          value={stats.admins}
          loading={loading}
        />

        <AdminHomeStatCard
          icon={<FiLock />}
          label="Chưa xác thực"
          value={stats.unverified}
          loading={loading}
        />
      </div>

      <section className="admin-home-empty">
        <h2>Trang tổng quan đang được xây dựng</h2>
        <p>
          Hiện tại mới thống kê người dùng. Sau này có API shop, sản phẩm, đơn hàng
          thì gắn thêm vào đây.
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