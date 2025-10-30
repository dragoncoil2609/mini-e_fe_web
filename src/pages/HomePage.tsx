import { useState } from 'react';
import { Search, ShoppingBag, User, Heart, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const { isAuthenticated } = useAuth();

  const categories = [
    'Điện thoại',
    'Laptop',
    'Phụ kiện',
    'Thời trang nam',
    'Thời trang nữ',
    'Nhà cửa',
    'Làm đẹp',
    'Sức khỏe',
    'Thể thao',
    'Mẹ & Bé',
  ];

  const products = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: `Sản phẩm nổi bật ${i + 1}`,
    price: (Math.random() * 900 + 100).toFixed(0),
    rating: (Math.random() * 1 + 4).toFixed(1),
    image: `https://picsum.photos/seed/minie-${i}/400/400`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold text-orange-500">Mini E</Link>
          <div className="flex-1">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm sản phẩm, shop và hơn thế nữa..."
                className="w-full pl-12 pr-4 py-3 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="flex items-center gap-2 text-gray-700 hover:text-orange-500">
              <User size={20} />
              <span>Tài khoản</span>
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-orange-500">
                <User size={20} />
                <span>Hồ sơ</span>
              </Link>
            )}
            <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500">
              <Heart size={20} />
              <span>Quan tâm</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-orange-500">
              <ShoppingBag size={20} />
              <span>Giỏ hàng</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <div className="h-56 md:h-72 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white flex items-end"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=1920&auto=format&fit=crop)', backgroundSize: 'cover' }}>
              <div className="backdrop-blur-sm bg-black/30 p-4 rounded-md">
                <h2 className="text-2xl font-bold">Siêu Sale Cuối Tuần</h2>
                <p>Giảm đến 50% cho hàng ngàn sản phẩm</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Voucher nổi bật</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-md bg-orange-50 text-orange-700">Giảm 20k cho đơn từ 149k</div>
                <div className="p-3 rounded-md bg-orange-50 text-orange-700">Freeship đơn từ 0đ</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Tin khuyến mãi</h3>
              <p className="text-sm text-gray-600">Cập nhật deal hot mỗi ngày</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Danh mục</h3>
            <button className="text-sm text-orange-600 flex items-center gap-1">Xem thêm <ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-3">
            {categories.map((c, i) => (
              <button key={i} className="flex flex-col items-center gap-2 p-3 border rounded-md hover:shadow">
                <div className="w-12 h-12 rounded-full bg-gray-100" />
                <span className="text-xs text-gray-700 text-center">{c}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Gợi ý hôm nay</h3>
            <button className="text-sm text-orange-600 flex items-center gap-1">Xem tất cả <ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-3">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="mt-2">
                  <h4 className="text-sm line-clamp-2 min-h-[40px]">{p.name}</h4>
                  <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                    <Star size={14} />
                    <span className="text-gray-700">{p.rating}</span>
                  </div>
                  <div className="text-orange-600 font-semibold mt-1">{Number(p.price).toLocaleString('vi-VN')} đ</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600">
          © {new Date().getFullYear()} Mini E. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


