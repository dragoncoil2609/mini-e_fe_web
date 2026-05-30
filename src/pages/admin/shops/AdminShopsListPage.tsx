import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  getAdminShopStats,
  getAdminShops,
  updateShop,
  type AdminShopStats,
} from '../../../api/shop.api';

import './style/AdminShopsListPage.css';

type ShopStatusValue = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

type AdminShop = {
  id: number;
  userId?: number | null;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  email?: string | null;
  status?: ShopStatusValue | string;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  shopAddress?: string | null;
  shopPhone?: string | null;
  productCount?: number;
  totalOrders?: number;
  totalSold?: number;
  totalRevenue?: number | string;
  stats?: {
    productCount?: number;
    totalOrders?: number;
    totalSold?: number;
    totalRevenue?: number | string;
    ratingAvg?: number | string;
    reviewCount?: number;
  } | null;
};

const SHOP_STATUSES: ShopStatusValue[] = ['PENDING', 'ACTIVE', 'SUSPENDED'];

const emptyShopStats: AdminShopStats = {
  total: 0,
  pending: 0,
  active: 0,
  suspended: 0,
};

function unwrapPaginated<T>(response: any) {
  const data = response?.data?.data ?? response?.data ?? response;

  return {
    items: (data?.items ?? []) as T[],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? 1),
    limit: Number(data?.limit ?? 10),
  };
}

function unwrapData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Có lỗi xảy ra, vui lòng thử lại.'
  );
}

function formatMoney(value?: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';

  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Đang hoạt động';
  if (status === 'SUSPENDED') return 'Tạm khóa';
  return 'Chờ duyệt';
}

function getStatusClass(status?: string) {
  if (status === 'ACTIVE') return 'admin-shop-status-active';
  if (status === 'SUSPENDED') return 'admin-shop-status-suspended';
  return 'admin-shop-status-pending';
}

function normalizeStatus(status?: string): ShopStatusValue {
  if (SHOP_STATUSES.includes(status as ShopStatusValue)) {
    return status as ShopStatusValue;
  }

  return 'PENDING';
}

function getProductCount(shop: AdminShop) {
  return shop.productCount ?? shop.stats?.productCount ?? 0;
}

function getTotalOrders(shop: AdminShop) {
  return shop.totalOrders ?? shop.stats?.totalOrders ?? 0;
}

function getTotalRevenue(shop: AdminShop) {
  return shop.totalRevenue ?? shop.stats?.totalRevenue ?? 0;
}

export default function AdminShopsListPage() {
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [shopStats, setShopStats] = useState<AdminShopStats>(emptyShopStats);
  const [draftStatuses, setDraftStatuses] = useState<
    Record<number, ShopStatusValue>
  >({});

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | ShopStatusValue>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function loadShops(nextPage = page) {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [shopsResponse, statsResponse] = await Promise.all([
        getAdminShops({
          q: q.trim() || undefined,
          status: status || undefined,
          page: nextPage,
          limit,
        }),
        getAdminShopStats(),
      ]);

      const data = unwrapPaginated<AdminShop>(shopsResponse);
      const statsData = unwrapData<AdminShopStats>(statsResponse);

      setShops(data.items);
      setTotal(data.total);
      setPage(data.page);

      setShopStats({
        total: Number(statsData?.total ?? 0),
        pending: Number(statsData?.pending ?? 0),
        active: Number(statsData?.active ?? 0),
        suspended: Number(statsData?.suspended ?? 0),
      });

      const nextDrafts: Record<number, ShopStatusValue> = {};

      data.items.forEach((shop) => {
        nextDrafts[shop.id] = normalizeStatus(shop.status);
      });

      setDraftStatuses(nextDrafts);
    } catch (err: any) {
      setShops([]);
      setTotal(0);
      setShopStats(emptyShopStats);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadShops(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadShops(1);
  };

  const handleChangeDraftStatus = (
    shopId: number,
    nextStatus: ShopStatusValue,
  ) => {
    setDraftStatuses((prev) => ({
      ...prev,
      [shopId]: nextStatus,
    }));
  };

  const refreshStatsOnly = async () => {
    try {
      const statsResponse = await getAdminShopStats();
      const statsData = unwrapData<AdminShopStats>(statsResponse);

      setShopStats({
        total: Number(statsData?.total ?? 0),
        pending: Number(statsData?.pending ?? 0),
        active: Number(statsData?.active ?? 0),
        suspended: Number(statsData?.suspended ?? 0),
      });
    } catch {
      // Không chặn thao tác chính nếu thống kê lỗi.
    }
  };

  const handleSaveStatus = async (shop: AdminShop) => {
    const nextStatus = draftStatuses[shop.id];

    if (!nextStatus) return;

    if (nextStatus === shop.status) {
      setMessage('Trạng thái shop chưa thay đổi.');
      return;
    }

    setSavingId(shop.id);
    setError('');
    setMessage('');

    try {
      const response = await updateShop(shop.id, {
        status: nextStatus as any,
      });

      const updatedShop = unwrapData<AdminShop>(response);

      setShops((prev) =>
        prev.map((item) =>
          item.id === shop.id
            ? {
                ...item,
                ...updatedShop,
                status: updatedShop.status || nextStatus,
              }
            : item,
        ),
      );

      setDraftStatuses((prev) => ({
        ...prev,
        [shop.id]: nextStatus,
      }));

      await refreshStatsOnly();

      setMessage(`Đã cập nhật trạng thái shop "${shop.name}".`);
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-shops-page">
      <div className="admin-shops-header">
        <div>
          <p className="admin-shops-eyebrow">Admin / Shops</p>
          <h1>Quản lý shop</h1>
          <p>
            Danh sách shop đăng ký bán hàng. Admin có thể duyệt hoặc tạm khóa
            shop.
          </p>
        </div>

        <button
          type="button"
          className="admin-shops-refresh-btn"
          onClick={() => void loadShops(page)}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      <form className="admin-shops-filter" onSubmit={handleFilter}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm theo tên shop, email, địa chỉ..."
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as '' | ShopStatusValue)
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="SUSPENDED">Tạm khóa</option>
        </select>

        <button type="submit">Lọc</button>
      </form>

      {message ? <div className="admin-shops-message">{message}</div> : null}
      {error ? <div className="admin-shops-error">{error}</div> : null}

      <div className="admin-shops-summary">
        <div>
          <span>Tổng shop</span>
          <strong>{shopStats.total}</strong>
        </div>

        <div>
          <span>Chờ duyệt</span>
          <strong>{shopStats.pending}</strong>
        </div>

        <div>
          <span>Đang hoạt động</span>
          <strong>{shopStats.active}</strong>
        </div>

        <div>
          <span>Tạm khóa</span>
          <strong>{shopStats.suspended}</strong>
        </div>
      </div>

      {loading ? (
        <div className="admin-shops-state">Đang tải danh sách shop...</div>
      ) : shops.length === 0 ? (
        <div className="admin-shops-state">Không có shop phù hợp.</div>
      ) : (
        <>
          <div className="admin-shops-table-wrap">
            <table className="admin-shops-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Liên hệ</th>
                  <th>Thống kê</th>
                  <th>Trạng thái hiện tại</th>
                  <th>Cập nhật trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {shops.map((shop) => {
                  const draftStatus = draftStatuses[shop.id] || 'PENDING';
                  const currentStatus = normalizeStatus(shop.status);
                  const isChanged = draftStatus !== currentStatus;

                  return (
                    <tr key={shop.id}>
                      <td>
                        <div className="admin-shop-info">
                          <div className="admin-shop-logo">
                            {shop.logoUrl ? (
                              <img src={shop.logoUrl} alt={shop.name} />
                            ) : (
                              <span>
                                {shop.name?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>{shop.name}</strong>
                            <small>ID: {shop.id}</small>
                            <p>{shop.description || 'Chưa có mô tả.'}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-shop-contact">
                          <span>{shop.email || 'Chưa có email'}</span>
                          <span>{shop.shopPhone || 'Chưa có SĐT'}</span>
                          <small>{shop.shopAddress || 'Chưa có địa chỉ'}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-shop-stats">
                          <span>{getProductCount(shop)} sản phẩm</span>
                          <span>{getTotalOrders(shop)} đơn</span>
                          <span>{formatMoney(getTotalRevenue(shop))}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-shop-status ${getStatusClass(
                            shop.status,
                          )}`}
                        >
                          {getStatusLabel(shop.status)}
                        </span>
                      </td>

                      <td>
                        <div className="admin-shop-status-edit">
                          <select
                            value={draftStatus}
                            onChange={(event) =>
                              handleChangeDraftStatus(
                                shop.id,
                                event.target.value as ShopStatusValue,
                              )
                            }
                          >
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="ACTIVE">Duyệt bán hàng</option>
                            <option value="SUSPENDED">Tạm khóa</option>
                          </select>

                          <button
                            type="button"
                            disabled={!isChanged || savingId === shop.id}
                            onClick={() => void handleSaveStatus(shop)}
                          >
                            {savingId === shop.id ? 'Đang lưu...' : 'Lưu'}
                          </button>
                        </div>
                      </td>

                      <td>{formatDate(shop.createdAt)}</td>

                      <td>
                        <div className="admin-shop-actions">
                          <Link to={`/shops/${shop.id}`}>Xem</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-shops-pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => void loadShops(page - 1)}
            >
              Trước
            </button>

            <span>
              Trang {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => void loadShops(page + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}