import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { authService } from '../../api/auth.service';

interface RequestVerifyFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export default function RequestVerifyForm({ onSuccess, onError }: RequestVerifyFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestVerify = async () => {
    setIsLoading(true);
    try {
      const response = await authService.requestVerify();
      console.log('Request verify response:', response);
      
      if (response.success) {
        onSuccess(response.data?.message || 'Mã xác minh đã được gửi');
      } else {
        onError(response.message || 'Gửi mã xác minh thất bại');
      }
    } catch (error: any) {
      console.error('Request verify error:', error);
      onError(error.message || 'Có lỗi xảy ra khi gửi email xác minh');
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Xác minh tài khoản</h2>
        <p className="text-gray-600">
          Chúng tôi sẽ gửi mã xác minh đến email của bạn
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <p className="text-sm text-purple-800">
            <strong>Lưu ý:</strong> Mã xác minh sẽ có hiệu lực trong 5 phút. 
            Vui lòng kiểm tra hộp thư đến và thư mục spam.
          </p>
        </div>

        <button
          onClick={handleRequestVerify}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            'Đang gửi...'
          ) : (
            <>
              Gửi mã xác minh
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
