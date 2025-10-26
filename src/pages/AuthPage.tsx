import { useState } from 'react';
import { toast } from 'react-toastify';
import RegisterForm from '../components/forms/RegisterForm';
import LoginForm from '../components/forms/LoginForm';
import RequestVerifyForm from '../components/forms/RequestVerifyForm';
import VerifyAccountForm from '../components/forms/VerifyAccountForm';
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm';
import ResetPasswordForm from '../components/forms/ResetPasswordForm';
import { useAuth } from '../contexts/AuthContext';
import { type User, authService } from '../api/auth.service';

type AuthStep = 'register' | 'login' | 'request-verify' | 'verify-account' | 'forgot-password' | 'reset-password';

export default function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('register');
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const { login } = useAuth();

  const handleRegisterSuccess = (userData: User) => {
    setUser(userData);
    setUserEmail(userData.email);
    toast.success('Đăng ký thành công! Vui lòng đăng nhập để xác minh tài khoản.');
    setCurrentStep('login');
  };

  const handleLoginSuccess = (data: any) => {
    login(data.user, data.access_token);
    toast.success('Đăng nhập thành công!');
    
    if (data.user.isVerified) {
      // User is already verified, go to home
      window.location.href = '/';
    } else {
      // User needs verification
      setUser(data.user);
      setCurrentStep('request-verify');
    }
  };

  const handleRequestVerifySuccess = (message: string) => {
    toast.success(message);
    setCurrentStep('verify-account');
  };

  const handleVerifySuccess = (message: string) => {
    toast.success(message);
    // Update user verification status
    if (user) {
      const updatedUser = { ...user, isVerified: true };
      setUser(updatedUser);
      // Redirect to home after verification
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  const handleForgotPasswordSuccess = (message: string, email?: string) => {
    toast.success(message);
    if (email) {
      setUserEmail(email);
    }
    setCurrentStep('reset-password');
  };

  const handleResetPasswordSuccess = (message: string) => {
    toast.success(message);
    setCurrentStep('login');
  };

  const handleResendVerify = async () => {
    try {
      const response = await authService.requestVerify();
      toast.success(response.data.message);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại mã xác minh';
      toast.error(errorMessage);
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'register':
        return (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onError={handleError}
            onSwitchToLogin={() => setCurrentStep('login')}
          />
        );
      case 'login':
        return (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={handleError}
            onSwitchToRegister={() => setCurrentStep('register')}
            onSwitchToForgotPassword={() => setCurrentStep('forgot-password')}
          />
        );
      case 'request-verify':
        return (
          <RequestVerifyForm
            onSuccess={handleRequestVerifySuccess}
            onError={handleError}
          />
        );
      case 'verify-account':
        return (
          <VerifyAccountForm
            onSuccess={handleVerifySuccess}
            onError={handleError}
            onResend={handleResendVerify}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={handleForgotPasswordSuccess}
            onError={handleError}
            onBackToLogin={() => setCurrentStep('login')}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordForm
            onSuccess={handleResetPasswordSuccess}
            onError={handleError}
            onBackToLogin={() => setCurrentStep('login')}
            userEmail={userEmail}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'register':
        return 'Đăng ký tài khoản';
      case 'login':
        return 'Đăng nhập';
      case 'request-verify':
        return 'Xác minh tài khoản';
      case 'verify-account':
        return 'Nhập mã xác minh';
      case 'forgot-password':
        return 'Quên mật khẩu';
      case 'reset-password':
        return 'Reset mật khẩu';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Purple shape */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-r-3xl transform -skew-x-12 origin-left"></div>
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Mini E</h1>
            <p className="text-xl opacity-90">Chào mừng bạn đến với Mini E</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
            <p className="text-gray-600">Vui lòng điền thông tin để tiếp tục</p>
          </div>

          {renderCurrentStep()}

          {/* Navigation between steps */}
          <div className="mt-6 text-center">
            {currentStep === 'register' && (
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setCurrentStep('login')}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Đăng nhập ngay
                </button>
              </p>
            )}
            
            {currentStep === 'login' && (
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setCurrentStep('register')}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Đăng ký ngay
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
