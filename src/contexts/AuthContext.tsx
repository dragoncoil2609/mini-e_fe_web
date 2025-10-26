import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type User } from '../api/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check if user is already logged in (from localStorage or cookies)
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Try to refresh token to check if user is still authenticated
        const response = await authService.refreshToken();
        if (response.success) {
          setUser(response.data.user);
          // Cập nhật token mới
          localStorage.setItem('accessToken', response.data.access_token);
        } else {
          // Token không hợp lệ
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        // User is not authenticated, clear token
        localStorage.removeItem('accessToken');
        console.log('No valid session found');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, accessToken: string) => {
    setUser(userData);
    localStorage.setItem('accessToken', accessToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
