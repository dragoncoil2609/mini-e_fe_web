import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authService, type LoginData } from '../../api/auth.service';

const schema = yup.object({
  email: yup
    .string()
    .required('Email không được để trống')
    .email('Email không hợp lệ'),
  password: yup
    .string()
    .required('Mật khẩu không được để trống'),
});

interface LoginFormProps {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

export default function LoginForm({ onSuccess, onError, onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      console.log('Login response:', response);
      
      if (response.success) {
        onSuccess(response.data);
      } else {
        onError(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      onError(error.message || 'Có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              placeholder="Nhập mật khẩu của bạn"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            Tạo tài khoản
          </button>
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            Quên mật khẩu?
          </button>
        </div>
      </form>
    </div>
  );
}
