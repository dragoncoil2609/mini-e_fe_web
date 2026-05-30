import { useEffect, useMemo, useState } from 'react';
import {
  FiBox,
  FiGrid,
  FiLock,
  FiRefreshCw,
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
import { getAdminProducts } from '../../api/products.api';
import { getAdminCategories } from '../../api/categories.api';
import type { User } from '../../api/types';

import './HomePageAdmin.css';

const emptyShopStats: AdminShopStats = {
  total: 0,
  pending: 0,
  active: 0,
  suspended: 0,
};

const emptyProductStats = {
  total: 0,
  active: 0,
  locked: 0,
  outOfStock: 0,
};

function unwrapData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getPaginatedTotal(response: any): number {
  return Number(
    response?.data?.total ??
      response?.data?.data?.total ??
      response?.data?.meta?.total ??
      response?.data?.data?.meta?.total ??
      response?.meta?.total ??
      response?.total ??
      0,
  );
}

function getCategoryTotal(response: any): number {
  return Number(
    response?.data?.meta?.total ??
      response?.data?.data?.meta?.total ??
      response?.meta?.total ??
      response?.total ??
      0,
  );
}

export default function HomePageAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [shopStats, setShopStats] = useState<AdminShopStats>(emptyShopStats);
  const [productStats, setProductStats] = useState(emptyProductStats);
  const [totalCategories, setTotalCategories] = useState(0);

  const [loading, setLoading] = useState(true);

  async function fetchProductStats() {
    const [allRes, activeRes, lockedRes, outRes] = await Promise.all([
      getAdminProducts({
        page: 1,
        limit: 1,
      }),
      getAdminProducts({
        page: 1,
        limit: 1,
        status: 'ACTIVE',
      }),
      getAdminProducts({
        page: 1,
        limit: 1,
        status: 'LOCKED',
      }),
      getAdminProducts({
        page: 1,
        limit: 1,
        status: 'OUT_OF_STOCK',
      }),
    ]);

    return {
      total: getPaginatedTotal(allRes),
      active: getPaginatedTotal(activeRes),
      locked: getPaginatedTotal(lockedRes),
      outOfStock: getPaginatedTotal(outRes),
    };
  }

  async function fetchCategoryStats() {
    const res = await getAdminCategories({
      page: 1,
      limit: 1,
      sortBy: 'sortOrder',
      sortOrder: 'ASC',
    });

    return {
      total: getCategoryTotal(res),
    };
  }

  async function fetchOverview() {
    try {
      setLoading(true);

      const [
        usersData,
        shopsStatsResponse,
        productsStatsData,
        categoriesStatsData,
      ] = await Promise.all([
        getUsers({
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
        getAdminShopStats(),
        fetchProductStats(),
        fetchCategoryStats(),
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

      setProductStats(productsStatsData);
      setTotalCategories(categoriesStatsData.total);
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
          <h2>Sản phẩm</h2>
          <p>Thống kê trạng thái sản phẩm trong hệ thống</p>
        </div>

        <div className="admin-home-stats admin-home-shop-stats">
          <AdminHomeStatCard
            icon={<FiShield />}
            label="Tổng sản phẩm"
            value={productStats.total}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiBox />}
            label="Đang bán"
            value={productStats.active}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiLock />}
            label="Đã khóa"
            value={productStats.locked}
            loading={loading}
          />

          <AdminHomeStatCard
            icon={<FiRefreshCw />}
            label="Hết hàng"
            value={productStats.outOfStock}
            loading={loading}
          />
        </div>
      </section>

      <section className="admin-home-section">
        <div className="admin-home-section-title">
          <h2>Danh mục</h2>
          <p>Thống kê category sản phẩm trong hệ thống</p>
        </div>

        <div className="admin-home-stats admin-home-shop-stats">
          <AdminHomeStatCard
            icon={<FiGrid />}
            label="Tổng category"
            value={totalCategories}
            loading={loading}
          />
        </div>
      </section>

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