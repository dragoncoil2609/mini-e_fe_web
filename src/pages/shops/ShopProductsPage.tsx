import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyShop } from '../../api/shop.api';
import { deleteProduct, getMyProducts } from '../../api/products.api';
import type { ProductListItem } from '../../api/types';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ShopProductsPage.css';

type ShopView = {
  id: number;
  name: string;
  status?: string;
};

type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'LOCKED' | string;

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapPaginated<T>(response: any) {
  const data = response?.data?.data ?? response?.data ?? response;

  return {
    items: (data?.items ?? []) as T[],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? 1),
    limit: Number(data?.limit ?? 10),
  };
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải danh sách sản phẩm.'
  );
}

function formatMoney(value?: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function getProductImage(product: ProductListItem) {
  const item = product as any;

  return (
    item.mainImageUrl ||
    item.imageUrl ||
    item.thumbnail ||
    item.thumbnailUrl ||
    item.images?.[0]?.url ||
    bunnyImg
  );
}

function getStatusLabel(status?: ProductStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'Đang bán';
    case 'OUT_OF_STOCK':
      return 'Hết hàng';
    case 'LOCKED':
      return 'Đã khóa';
    default:
      return status || 'Đang bán';
  }
}

function getStatusClass(status?: ProductStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'is-active';
    case 'OUT_OF_STOCK':
      return 'is-out';
    case 'LOCKED':
      return 'is-locked';
    default:
      return '';
  }
}

export default function ShopProductsPage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadData(nextPage = page) {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await getMyShop();
      const shopData = unwrapApiData<ShopView>(shopResponse);
      setShop(shopData);

      const productResponse = await getMyProducts({
        page: nextPage,
        limit,
        q: q.trim() || undefined,
        status: status || undefined,
      });

      const productData = unwrapPaginated<ProductListItem>(productResponse);

      setProducts(productData.items);
      setTotal(productData.total);
      setPage(productData.page);
    } catch (err: any) {
      setError(getApiMessage(err));
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(product: ProductListItem) {
    const item = product as any;
    const productId = Number(item.id);
    const productName = item.title || item.name || `#${productId}`;

    if (!productId) return;

    const ok = window.confirm(
      `Bạn chắc chắn muốn xóa sản phẩm "${productName}"?\n\nSản phẩm sẽ bị ẩn khỏi shop và trang bán hàng, nhưng dữ liệu cũ vẫn được giữ lại.`,
    );

    if (!ok) return;

    setDeletingId(productId);
    setError('');

    try {
      await deleteProduct(productId);

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      const nextPage = Math.min(page, nextTotalPages);

      await loadData(nextPage);
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mochi-page shop-products-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Sản phẩm</b>
        </div>

        <div className="shop-products-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-products-main">
            <section className="shop-products-head mochi-card">
              <div>
                <h1>Sản phẩm của shop</h1>
                <p>Quản lý toàn bộ sản phẩm thuộc shop của bạn.</p>
              </div>

              <Link
                to="/shops/me/products/create"
                className="mochi-btn mochi-btn-primary"
              >
                + Thêm sản phẩm
              </Link>
            </section>

            <section className="shop-products-filter mochi-card">
              <input
                className="mochi-input"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
              />

              <select
                className="mochi-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang bán</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
                <option value="LOCKED">Đã khóa</option>
              </select>

              <button
                type="button"
                className="mochi-btn mochi-btn-primary"
                onClick={() => void loadData(1)}
              >
                Lọc
              </button>
            </section>

            {loading ? (
              <div className="mochi-card mochi-card-padding shop-products-state">
                Đang tải sản phẩm...
              </div>
            ) : error ? (
              <div className="mochi-card mochi-card-padding shop-products-error">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="mochi-card mochi-empty">
                <h3 className="mochi-empty-title">Chưa có sản phẩm</h3>
                <p className="mochi-empty-desc">
                  Bạn có thể thêm sản phẩm mới sau khi shop được duyệt.
                </p>

                <Link
                  to="/shops/me/products/create"
                  className="mochi-btn mochi-btn-primary"
                  style={{ marginTop: 18 }}
                >
                  + Thêm sản phẩm đầu tiên
                </Link>
              </div>
            ) : (
              <>
                <div className="shop-products-table mochi-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Tồn kho</th>
                        <th>Đã bán</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => {
                        const item = product as any;
                        const productId = Number(item.id);
                        const productStatus = item.status || 'ACTIVE';
                        const isLocked = productStatus === 'LOCKED';
                        const isDeleting = deletingId === productId;

                        return (
                          <tr key={productId}>
                            <td>
                              <div className="shop-product-cell">
                                <img
                                  src={getProductImage(product)}
                                  alt={item.title || item.name || 'Sản phẩm'}
                                />

                                <div>
                                  <strong>{item.title || item.name}</strong>
                                  <small>#{productId}</small>
                                </div>
                              </div>
                            </td>

                            <td>{formatMoney(item.price)}</td>
                            <td>{item.stock ?? 0}</td>
                            <td>{item.sold ?? 0}</td>

                            <td>
                              <span
                                className={`shop-product-status ${getStatusClass(
                                  productStatus,
                                )}`}
                              >
                                {getStatusLabel(productStatus)}
                              </span>
                            </td>

                            <td>
                              <div className="shop-products-actions">
                                {!isLocked ? (
                                  <Link to={`/products/${productId}`}>Xem</Link>
                                ) : (
                                  <span className="shop-action-disabled">
                                    Không public
                                  </span>
                                )}

                                {!isLocked ? (
                                  <Link to={`/shops/me/products/${productId}/edit`}>
                                    Sửa
                                  </Link>
                                ) : (
                                  <span className="shop-action-disabled">Sửa</span>
                                )}

                                {!isLocked ? (
                                  <Link
                                    to={`/shops/me/products/${productId}/variants`}
                                  >
                                    Biến thể
                                  </Link>
                                ) : (
                                  <span className="shop-action-disabled">
                                    Biến thể
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="shop-products-delete-btn"
                                  disabled={isDeleting || isLocked}
                                  onClick={() => void handleDeleteProduct(product)}
                                  title={
                                    isLocked
                                      ? 'Sản phẩm đã bị khóa, shop không thể xóa'
                                      : 'Xóa sản phẩm'
                                  }
                                >
                                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="shop-products-pagination">
                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page <= 1}
                    onClick={() => void loadData(page - 1)}
                  >
                    Trước
                  </button>

                  <span>
                    Trang {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    className="mochi-btn mochi-btn-outline mochi-btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => void loadData(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}