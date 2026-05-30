import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar';
import AdminTopbar from '../admin/AdminTopbar';
import type { User } from '../../api/types';
import './AdminLayout.css';

interface AdminLayoutProps {
  currentUser?: User | null;
}

export default function AdminLayout({ currentUser }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-layout-main">
        <AdminTopbar currentUser={currentUser} />

        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}