import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authService } from '../../api/auth.service';

const schema = yup.object({
  currentPassword: yup
    .string()
    .required('Mật khẩu hiện tại không được để trống'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới không được để trống')
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
      'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu mới không được để trống')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp'),
});

interface ChangePasswordFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function ChangePasswordForm({ onSuccess, onError, onCancel }: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.changePassword(data);
      console.log('Change password response:', response);
      
      if (response.success) {
        onSuccess(response.data?.message || 'Mật khẩu đã được thay đổi thành công');
      } else {
        onError(response.message || 'Thay đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      onError(error.message || 'Có lỗi xảy ra khi thay đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Đổi mật khẩu</h2>
        <p className="text-gray-600">
          Thay đổi mật khẩu của bạn để bảo mật tài khoản
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('currentPassword')}
              type={showCurrentPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('newPassword')}
              type={showNewPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Xác nhận mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <p className="text-sm text-purple-800">
            <strong>Lưu ý:</strong> Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-lg transition-all duration-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              'Đang thay đổi...'
            ) : (
              <>
                Thay đổi mật khẩu
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
