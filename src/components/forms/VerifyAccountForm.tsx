import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Shield, ArrowRight } from 'lucide-react';
import { authService, type VerifyAccountData } from '../../api/auth.service';

const schema = yup.object({
  otp: yup
    .string()
    .required('Mã xác minh không được để trống')
    .length(6, 'Mã xác minh phải có 6 ký tự'),
});

interface VerifyAccountFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onResend: () => void;
}

export default function VerifyAccountForm({ onSuccess, onError, onResend }: VerifyAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyAccountData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: VerifyAccountData) => {
    setIsLoading(true);
    try {
      const response = await authService.verifyAccount(data);
      if (response.success) {
        onSuccess(response.data.message || 'Xác minh tài khoản thành công');
      } else {
        onError(response.message || 'Xác minh tài khoản thất bại');
      }
    } catch (error: any) {
      onError(error.message || 'Có lỗi xảy ra khi xác minh tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Xác minh tài khoản</h2>
        <p className="text-gray-600">
          Nhập mã xác minh 6 ký tự đã được gửi đến email của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã xác minh
          </label>
          <div className="flex items-center space-x-3">
            <input
              {...register('otp')}
              type="text"
              maxLength={6}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl tracking-widest font-mono bg-gray-50"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center space-x-2 px-4 py-3 text-purple-600 hover:text-purple-700 text-sm font-medium disabled:opacity-50 border border-purple-200 rounded-xl hover:bg-purple-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isResending ? 'Đang gửi...' : 'Gửi lại mã'}</span>
            </button>
          </div>
          {errors.otp && (
            <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200"
        >
          {isLoading ? 'Đang xác minh...' : 'Xác minh tài khoản'}
        </button>
      </form>
    </div>
  );
}
