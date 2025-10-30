import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authService } from '../../api/auth.service';

const schema = yup.object({
  email: yup
    .string()
    .required('Email không được để trống')
    .email('Email không hợp lệ'),
  otp: yup
    .string()
    .required('Mã OTP không được để trống')
    .length(6, 'Mã OTP phải có 6 ký tự'),
  password: yup
    .string()
    .required('Mật khẩu mới không được để trống')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
      'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu không được để trống')
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
});

interface ResetPasswordFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onBackToLogin: () => void;
  userEmail?: string;
}

export default function ResetPasswordForm({ onSuccess, onError, onBackToLogin, userEmail }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: userEmail || '',
    },
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.resetPassword(data);
      console.log('Reset password response:', response);
      
      if (response.success) {
        onSuccess(response.data?.message || 'Mật khẩu đã được reset thành công');
      } else {
        onError(response.message || 'Reset mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      onError(error.message || 'Có lỗi xảy ra khi reset mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      const emailToUse = userEmail;
      if (!emailToUse) {
        onError('Thiếu email để gửi lại mã. Vui lòng quay lại bước trước.');
        return;
      }
      const res = await authService.forgotPassword(emailToUse);
      if (res.success) {
        setResendCountdown(60);
      } else {
        onError(res.message || 'Gửi lại mã thất bại');
      }
    } catch (e: any) {
      onError(e.message || 'Có lỗi xảy ra khi gửi lại mã');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset mật khẩu</h2>
        <p className="text-gray-600">
          Nhập mã OTP và mật khẩu mới của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            disabled={Boolean(userEmail)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${userEmail ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'}`}
            placeholder="Email của bạn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã OTP
          </label>
          <input
            {...register('otp')}
            type="text"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-center text-lg font-mono tracking-widest"
            placeholder="Nhập mã OTP"
          />
          {errors.otp && (
            <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">Đã gửi tới: <span className="font-medium">{userEmail || 'chưa có email'}</span></p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
              className="text-sm text-purple-600 hover:text-purple-500 disabled:opacity-50"
            >
              {resendCountdown > 0 ? `Gửi lại (${resendCountdown}s)` : 'Gửi lại mã'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            'Đang reset...'
          ) : (
            <>
              Reset mật khẩu
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
