import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ImagePlus, Package, DollarSign, Hash, FileText } from 'lucide-react';
import { productsApi, type CreateProductInput } from '../api/products/products.service';
import { toast } from 'react-toastify';

const schema = yup.object({
  title: yup.string().required('Tên sản phẩm không được để trống').max(180, 'Tối đa 180 ký tự'),
  price: yup
    .number()
    .typeError('Giá phải là số')
    .min(0, 'Giá phải ≥ 0')
    .max(999999999999 / 100, 'Giá quá lớn')
    .required('Giá không được để trống'),
  stock: yup.number().typeError('Kho phải là số').min(0, 'Kho phải ≥ 0').optional(),
  description: yup.string().optional(),
});

export default function SellerDashboardPage() {
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProductInput>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: CreateProductInput) => {
    try {
      const created = await productsApi.create({ ...data, images: files });
      toast.success('Đăng sản phẩm thành công');
      reset();
      setFiles([]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Không thể đăng sản phẩm');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Đăng sản phẩm mới
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
              <div className="relative">
                <input
                  {...register('title')}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ví dụ: Áo thun cổ tròn"
                />
              </div>
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND)</label>
                <div className="relative">
                  <input
                    {...register('price')}
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kho</label>
                <div className="relative">
                  <input
                    {...register('stock')}
                    type="number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <div className="relative">
                <textarea
                  {...register('description')}
                  rows={5}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mô tả sản phẩm..."
                />
                <FileText className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh (tối đa 10)</label>
              <div className="flex flex-wrap gap-3">
                <label className="w-36 h-36 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-purple-400">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const f = Array.from(e.target.files || []).slice(0, 10);
                      setFiles(f);
                    }}
                  />
                  <div className="flex flex-col items-center text-sm">
                    <ImagePlus className="w-6 h-6" />
                    Tải ảnh
                  </div>
                </label>
                {files.map((f, i) => (
                  <div key={i} className="w-36 h-36 rounded-lg overflow-hidden bg-gray-100">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang đăng...' : 'Đăng sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


