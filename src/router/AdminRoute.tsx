import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../api/users.api';
import AdminLayout from '../components/layout/AdminLayout';
import type { User } from '../api/types';

export default function AdminRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const me = await getMe();

        if (!mounted) return;

        setUser(me);
        setAllowed(me.role === 'ADMIN');
      } catch {
        if (!mounted) return;
        setAllowed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-route-loading">
        <span>Đang kiểm tra quyền quản trị...</span>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout currentUser={user} />;
}