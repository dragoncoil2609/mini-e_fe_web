import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, ArrowRight } from 'lucide-react';
import { authService } from '../../api/auth.service';

const schema = yup.object({
  email: yup
    .string()
    .required('Email không được để trống')
    .email('Email không hợp lệ'),
});

interface ForgotPasswordFormProps {
  onSuccess: (message: string, email?: string) => void;
  onError: (error: string) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onError, onBackToLogin }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      console.log('Forgot password response:', response);
      
      if (response.success) {
        onSuccess(response.data?.message || 'Mã reset mật khẩu đã được gửi', data.email);
      } else {
        onError(response.message || 'Gửi email reset mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      onError(error.message || 'Có lỗi xảy ra khi gửi email reset mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu</h2>
        <p className="text-gray-600">
          Nhập email của bạn để nhận mã reset mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('email')}
              type="email"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Nhập email của bạn"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <p className="text-sm text-purple-800">
            <strong>Lưu ý:</strong> Mã reset mật khẩu sẽ có hiệu lực trong 5 phút. 
            Vui lòng kiểm tra hộp thư đến và thư mục spam.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            'Đang gửi...'
          ) : (
            <>
              Gửi mã reset mật khẩu
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
}
