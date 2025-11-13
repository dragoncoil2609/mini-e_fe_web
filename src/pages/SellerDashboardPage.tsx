import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ImagePlus, Package, DollarSign, Hash, Plus, X, Check } from 'lucide-react';
import { productsApi, type CreateProductInput, type VariantOption, type ProductVariant } from '../api/products/products.service';
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
  slug: yup.string().optional(),
});

export default function SellerDashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [editingVariants, setEditingVariants] = useState<Record<number, { price: string; stock: string }>>({});
  const [savingVariants, setSavingVariants] = useState<Set<number>>(new Set());
  const saveTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({ resolver: yupResolver(schema) });

  const loadVariants = async (id: number) => {
    try {
      setLoadingVariants(true);
      const data = await productsApi.listVariants(id);
      setVariants(data);
      const editing: Record<number, { price: string; stock: string }> = {};
      data.forEach((v) => {
        editing[v.id] = {
          price: String(v.price || ''),
          stock: String(v.stock || ''),
        };
      });
      setEditingVariants(editing);
    } catch (e: any) {
      toast.error('Không thể tải variants: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoadingVariants(false);
    }
  };

  const onSubmit = async (data: CreateProductInput) => {
    try {
      const created = await productsApi.create({ ...data, images: files });
      toast.success('Đăng sản phẩm thành công');
      setProductId(created.id);
      await loadVariants(created.id);
      if (variantOptions.length > 0) {
        const hasValidOptions = variantOptions.every(opt => opt.name.trim() && opt.values.length > 0);
        if (hasValidOptions) {
          toast.info('Bạn có thể tạo variants ngay bây giờ');
        }
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Không thể đăng sản phẩm');
    }
  };

  const handleGenerateVariants = async () => {
    if (!productId) {
      toast.error('Vui lòng tạo sản phẩm trước');
      return;
    }
    if (variantOptions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 option');
      return;
    }
    for (const opt of variantOptions) {
      if (!opt.name.trim() || opt.values.length === 0) {
        toast.error('Vui lòng điền đầy đủ tên và giá trị cho tất cả options');
        return;
      }
    }

    try {
      setLoadingVariants(true);
      const generated = await productsApi.generateVariants(productId, variantOptions, 'replace');
      setVariants(generated);
      const editing: Record<number, { price: string; stock: string }> = {};
      generated.forEach((v) => {
        editing[v.id] = {
          price: String(v.price || ''),
          stock: String(v.stock || ''),
        };
      });
      setEditingVariants(editing);
      toast.success(`Đã tạo ${generated.length} biến thể`);
    } catch (e: any) {
      toast.error('Không thể tạo variants: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleUpdateVariant = async (variantId: number) => {
    if (!productId) return;
    const editing = editingVariants[variantId];
    if (!editing) return;

    setSavingVariants((prev) => new Set(prev).add(variantId));
    try {
      const updateData: { price?: number; stock?: number; imageId?: number } = {};
      if (editing.price) updateData.price = Number(editing.price);
      if (editing.stock) updateData.stock = Number(editing.stock);
      
      await productsApi.updateVariant(productId, variantId, updateData);
      await loadVariants(productId);
    } catch (e: any) {
      toast.error('Không thể cập nhật variant: ' + (e?.response?.data?.message || e.message));
    } finally {
      setSavingVariants((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }
  };

  const handleVariantFieldChange = (variantId: number, field: 'price' | 'stock', value: string) => {
    setEditingVariants({
      ...editingVariants,
      [variantId]: {
        ...editingVariants[variantId],
        [field]: value,
      },
    });

    if (saveTimeoutRef.current[variantId]) {
      clearTimeout(saveTimeoutRef.current[variantId]);
    }

    saveTimeoutRef.current[variantId] = setTimeout(() => {
      handleUpdateVariant(variantId);
      delete saveTimeoutRef.current[variantId];
    }, 1000);
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const addVariantOption = () => {
    if (variantOptions.length >= 5) {
      toast.error('Tối đa 5 options');
      return;
    }
    setVariantOptions([...variantOptions, { name: '', values: [] }]);
  };

  const removeVariantOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const updateVariantOption = (index: number, field: 'name' | 'values', value: string | string[]) => {
    const updated = [...variantOptions];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].values = value as string[];
    }
    setVariantOptions(updated);
  };

  const addVariantValue = (optionIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex].values.push('');
    setVariantOptions(updated);
  };

  const removeVariantValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex);
    setVariantOptions(updated);
  };

  const updateVariantValue = (optionIndex: number, valueIndex: number, value: string) => {
    const updated = [...variantOptions];
    updated[optionIndex].values[valueIndex] = value;
    setVariantOptions(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Đăng sản phẩm mới
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin sản phẩm</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
              <input
                {...register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên sản phẩm"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá</label>
                <div className="relative">
                  <input
                    {...register('price')}
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho</label>
                <div className="relative">
                  <input
                    {...register('stock')}
                    type="number"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mô tả sản phẩm..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
              <input
                {...register('slug')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="slug-url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh (có thể upload nhiều ảnh)</label>
              <div className="flex flex-wrap gap-3">
                <label className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 bg-blue-50">
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
                    <span className="mt-1">Tải ảnh</span>
                  </div>
                </label>
                {files.map((f, i) => (
                  <div key={i} className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 relative group">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang đăng...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Biến thể product</h2>
          {!productId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Vui lòng tạo sản phẩm trước để có thể tạo variants
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 font-medium text-sm text-gray-700 border-b pb-2">
              <div>Tên</div>
              <div>Giá trị</div>
            </div>
            {variantOptions.map((option, optIdx) => (
              <div key={optIdx} className="grid grid-cols-2 gap-4 items-start">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateVariantOption(optIdx, 'name', e.target.value)}
                  placeholder="Tên (ví dụ: màu)"
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((val, valIdx) => (
                      <div key={valIdx} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => updateVariantValue(optIdx, valIdx, e.target.value)}
                          placeholder="Giá trị"
                          className="px-3 py-1 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantValue(optIdx, valIdx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addVariantValue(optIdx)}
                      className="px-3 py-1 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500"
                    >
                      <Plus className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeVariantOption(optIdx)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Xóa option
                  </button>
                </div>
              </div>
            ))}
            {variantOptions.length < 5 && (
              <button
                type="button"
                onClick={addVariantOption}
                className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Thêm option
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateVariants}
              disabled={loadingVariants || !productId}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingVariants ? 'Đang tạo...' : 'Xác nhận'}
            </button>
          </div>

          {productId && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Update variants product</h3>
                {loadingVariants ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : variants.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Chưa có variants. Hãy tạo variants ở trên.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Tên sản phẩm</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Giá</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Tồn kho</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((variant) => (
                          <tr key={variant.id} className="border-b">
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                value={variant.name}
                                readOnly
                                className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-blue-50"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={editingVariants[variant.id]?.price || ''}
                                  onChange={(e) => handleVariantFieldChange(variant.id, 'price', e.target.value)}
                                  className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {savingVariants.has(variant.id) && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={editingVariants[variant.id]?.stock || ''}
                                  onChange={(e) => handleVariantFieldChange(variant.id, 'stock', e.target.value)}
                                  className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {savingVariants.has(variant.id) && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              {savingVariants.has(variant.id) ? (
                                <div className="px-3 py-1 text-sm text-gray-500">Đang lưu...</div>
                              ) : (
                                <div className="px-3 py-1 text-sm text-green-600">Đã lưu</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
