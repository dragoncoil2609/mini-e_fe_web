import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Calendar, Camera, Phone, Save, User as UserIcon } from 'lucide-react';
import { usersApi, type UserItem } from '../../api/users/users.service';

const phoneRegex = /^\+?[0-9]{8,15}$/;

const schema = yup.object({
  name: yup
    .string()
    .required('Tên không được để trống')
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(120, 'Tên tối đa 120 ký tự'),
  phone: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : null))
    .matches(phoneRegex, 'Số điện thoại không hợp lệ')
    .optional(),
  gender: yup
    .mixed<'MALE' | 'FEMALE' | 'OTHER'>()
    .oneOf(['MALE', 'FEMALE', 'OTHER'] as const, 'Giới tính không hợp lệ')
    .nullable()
    .optional(),
  birthday: yup
    .string()
    .nullable()
    .transform((value) => (value ? value : null))
    .optional(),
});

type ProfileFormValues = yup.InferType<typeof schema>;

interface ProfileUpdateFormProps {
  initialData: UserItem;
  onCancel?: () => void;
  onSuccess: (data: UserItem, message: string) => void;
  onError: (message: string) => void;
}

const genderOptions: { label: string; value: 'MALE' | 'FEMALE' | 'OTHER' | null }[] = [
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Khác', value: 'OTHER' },
];

export default function ProfileUpdateForm({ initialData, onCancel, onSuccess, onError }: ProfileUpdateFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
    setFocus,
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone ?? '',
      gender: (initialData.gender as any) ?? null,
      birthday: initialData.birthday ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: initialData.name,
      phone: initialData.phone ?? '',
      gender: (initialData.gender as any) ?? null,
      birthday: initialData.birthday ?? '',
    });
  }, [initialData, reset]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onError('Tính năng cập nhật ảnh đại diện sẽ sớm được hỗ trợ.');
      event.target.value = '';
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone ? values.phone.trim() : null,
        gender: values.gender ?? null,
        birthday: values.birthday || null,
      };
      const updated = await usersApi.updateMe(payload);
      reset({
        name: updated.name,
        phone: updated.phone ?? '',
        gender: (updated.gender as any) ?? null,
        birthday: updated.birthday ?? '',
      });
      onSuccess(updated, 'Cập nhật hồ sơ thành công');
    } catch (error: any) {
      const message = error?.message || 'Cập nhật hồ sơ thất bại';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500">Tên đăng nhập</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{initialData.name || '-'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tên</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Nhập tên của bạn"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={initialData.email}
                disabled
                className="w-full flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600"
              />
              <button
                type="button"
                onClick={() => onError('Bạn không thể tự thay đổi email. Vui lòng liên hệ hỗ trợ.')}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Sửa
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={() => setFocus('phone')}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Sửa
              </button>
            </div>
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Giới tính</span>
                <div className="flex flex-wrap gap-6">
                  {genderOptions.map((option) => (
                    <label key={option.value ?? 'null'} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="radio"
                        value={option.value ?? ''}
                        checked={field.value === option.value}
                        onChange={() => field.onChange(option.value)}
                        className="h-4 w-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="radio"
                      value=""
                      checked={field.value == null}
                      onChange={() => field.onChange(null)}
                      className="h-4 w-4"
                    />
                    <span>Không tiết lộ</span>
                  </label>
                </div>
                {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
              </div>
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
            <Controller
              control={control}
              name="birthday"
              render={({ field }) => (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFocus('birthday' as keyof ProfileFormValues)}
                      className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Sửa
                    </button>
                  </div>
                  {errors.birthday && <p className="text-sm text-red-500">{errors.birthday.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner">
            {initialData.avatarUrl ? (
              <img src={initialData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-12 w-12 text-gray-300" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={handleChooseAvatar}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Camera className="h-4 w-4" />
            Chọn ảnh
          </button>
          <p className="text-center text-xs text-gray-400">PNG hoặc JPG, tối đa 2MB</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-6 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !isDirty}
          className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}

