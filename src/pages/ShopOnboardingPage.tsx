import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Store, Upload } from 'lucide-react';
import { shopsApi, type CreateShopDto } from '../api/shops/shops.service';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  name: yup.string().required('Tên shop không được để trống').max(150, 'Tối đa 150 ký tự'),
  email: yup.string().required('Email không được để trống').email('Email không hợp lệ').max(150, 'Tối đa 150 ký tự'),
  description: yup.string().required('Mô tả không được để trống').max(255, 'Tối đa 255 ký tự'),
  logoUrl: yup.string().url('Logo phải là URL hợp lệ').optional(),
});

export default function ShopOnboardingPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateShopDto>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: CreateShopDto) => {
    try {
      const shop = await shopsApi.create(data);
      toast.success('Tạo shop thành công!');
      navigate('/seller');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Tạo shop thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold">Đăng ký trở thành Người bán</h1>
            <p className="text-gray-600 mt-1">Tạo shop của bạn để bắt đầu đăng bán sản phẩm</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên shop</label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ví dụ: Cửa hàng Mini E"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email shop</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="shop@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Giới thiệu ngắn về shop"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo (URL)</label>
              <div className="relative">
                <input
                  {...register('logoUrl')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.logoUrl && <p className="text-red-500 text-sm mt-1">{errors.logoUrl.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo shop...' : 'Tạo shop và bắt đầu bán'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


