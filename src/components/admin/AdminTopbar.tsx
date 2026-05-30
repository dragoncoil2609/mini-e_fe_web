import { FiBell, FiChevronDown, FiSearch, FiUser } from 'react-icons/fi';
import type { User } from '../../api/types';

interface AdminTopbarProps {
  currentUser?: User | null;
}

export default function AdminTopbar({ currentUser }: AdminTopbarProps) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-search">
        <FiSearch />
        <input placeholder="Tìm kiếm quản trị..." />
      </div>

      <div className="admin-topbar-right">
        <button className="admin-topbar-icon">
          <FiBell />
          <span>3</span>
        </button>

        <div className="admin-topbar-user">
          <div className="admin-topbar-avatar">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} />
            ) : (
              <FiUser />
            )}
          </div>

          <div>
            <strong>{currentUser?.name || 'Admin'}</strong>
            <p>Quản trị viên</p>
          </div>

          <FiChevronDown />
        </div>
      </div>
    </header>
  );
}