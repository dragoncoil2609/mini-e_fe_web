// src/routes/RequireAuth.tsx
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { getAccessToken } from '../api/authToken';
import './RequireAuth.css';

function getToken() {
  return (
    getAccessToken?.() ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
}

export default function RequireAuth() {
  const location = useLocation();
  const token = getToken();

  if (token) {
    return <Outlet />;
  }

  return (
    <div className="require-auth-page">
      <div className="require-auth-card">
        <div className="require-auth-icon">🔐</div>

        <h2>Vui lòng đăng nhập</h2>

        <p>
          Bạn cần đăng nhập để sử dụng chức năng này.
        </p>

        <Link
          to="/login"
          state={{ from: location.pathname + location.search }}
          className="require-auth-btn"
        >
          Đăng nhập ngay
        </Link>

        <Link to="/home" className="require-auth-back">
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}