// src/pages/admin/HomePageAdmin.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../api/types';
import './HomePageAdmin.css';

export function HomePageAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('current_user');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as User;
      setUser(parsed);
    } catch (err) {
      console.error('Cannot parse current_user from localStorage', err);
    }
  }, []);

  const handleGoProfile = () => {
    navigate('/me');
  };

  const handleGoUserManage = () => {
    navigate('/admin/users');
  };

  const handleGoShopManage = () => {
    navigate('/admin/shops');
  };

  return (
    <div className="admin-home-container">
      <header className="admin-home-header">
        <div>
          {user ? (
            <button
              type="button"
              onClick={handleGoProfile}
              className="admin-home-user-button"
            >
              {user.name || user.email} (Admin)
            </button>
          ) : (
            <span className="admin-home-title-text">Mini E Admin</span>
          )}
        </div>
      </header>

      <main className="admin-home-main">
        <h1 className="admin-home-title">Trang quản trị</h1>

        <button
          type="button"
          onClick={handleGoUserManage}
          className="admin-home-button admin-home-button--user"
        >
          Quản lý user
        </button>

        <button
          type="button"
          onClick={handleGoShopManage}
          className="admin-home-button admin-home-button--shop"
        >
          Quản lý shop
        </button>
      </main>
    </div>
  );
}
