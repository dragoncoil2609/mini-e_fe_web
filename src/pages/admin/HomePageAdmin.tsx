// src/pages/admin/HomePageAdmin.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../api/types';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Góc trái: tên admin, click → /me */}
        <div>
          {user ? (
            <button
              type="button"
              onClick={handleGoProfile}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              {user.name || user.email} (Admin)
            </button>
          ) : (
            <span style={{ fontWeight: 'bold' }}>Mini E Admin</span>
          )}
        </div>
      </header>

      {/* Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <h1>Trang quản trị</h1>

        <button
          type="button"
          onClick={handleGoUserManage}
          style={{
            padding: '10px 18px',
            fontSize: 16,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#2563eb',
            color: '#fff',
          }}
        >
          Quản lý user
        </button>

        <button
          type="button"
          onClick={handleGoShopManage}
          style={{
            padding: '10px 18px',
            fontSize: 16,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#16a34a',
            color: '#fff',
          }}
        >
          Quản lý shop
        </button>
      </main>
    </div>
  );
}
