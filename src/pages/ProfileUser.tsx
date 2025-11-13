import { useState } from 'react';
import { type User as AuthUser } from '../api/auth/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { type UserItem } from '../api/users/users.service';
import ProfileUpdateForm from '../components/forms/ProfileUpdateForm';
import ChangePasswordForm from '../components/forms/ChangePasswordForm';
import { Plus, X, Edit } from 'lucide-react';

type UserTabKey =
  | 'account-profile'
  | 'account-bank'
  | 'account-address'
  | 'account-password'
  | 'account-notifications';

interface ProfileUserProps {
  profile: UserItem;
  onProfileUpdate: (updated: UserItem) => void;
  activeTab?: UserTabKey;
  onTabChange?: (tab: UserTabKey) => void;
}

export default function ProfileUser({ profile, onProfileUpdate, activeTab: propActiveTab, onTabChange }: ProfileUserProps) {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [internalTab, setInternalTab] = useState<UserTabKey>('account-profile');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addresses, setAddresses] = useState<Array<{ id: number; name: string; phone: string; address: string; isDefault: boolean }>>([]);
  
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = onTabChange || setInternalTab;

  const mapToAuthUser = (item: UserItem): AuthUser => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role as AuthUser['role'],
    isVerified: item.isVerified,
    createdAt: item.createdAt ?? user?.createdAt ?? new Date().toISOString(),
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'account-profile':
        return (
          <ProfileUpdateForm
            initialData={profile}
            onSuccess={(updated, message) => {
              onProfileUpdate(updated);
              setFeedback({ type: 'success', message });
              updateAuthUser(mapToAuthUser(updated));
            }}
            onError={(message) => setFeedback({ type: 'error', message })}
          />
        );
      case 'account-bank':
        return (
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thẻ tín dụng/Ghi nợ</h3>
              <div className="border border-gray-200 rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center relative">
                <button className="absolute top-4 left-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium">
                  Thêm thẻ mới +
                </button>
                <p className="text-gray-400">Bạn chưa liên kết</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Số điện thoại</h3>
              <div className="border border-gray-200 rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center relative">
                <button className="absolute top-4 left-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium">
                  Thêm số mới +
                </button>
                <p className="text-gray-400">Bạn chưa liên kết</p>
              </div>
            </div>
          </div>
        );
      case 'account-address':
        return (
          <AddressManagement 
            addresses={addresses}
            onAddAddress={() => setShowAddAddress(true)}
            showAddForm={showAddAddress}
            onCloseForm={() => setShowAddAddress(false)}
            onSaveAddress={(address) => {
              setAddresses([...addresses, { ...address, id: Date.now() }]);
              setShowAddAddress(false);
            }}
          />
        );
      case 'account-password':
        return (
          <ChangePasswordForm
            onSuccess={(message) => {
              setFeedback({ type: 'success', message });
              setActiveTab('account-profile');
            }}
            onError={(message) => setFeedback({ type: 'error', message })}
            onCancel={() => setActiveTab('account-profile')}
          />
        );
      case 'account-notifications':
        return <EmptyState title="Cài đặt thông báo" description="Tính năng đang được phát triển." />;
      default:
        return null;
    }
  };

  return (
    <div>
      {feedback && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}
      {renderContent()}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-gray-600">
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

interface AddressManagementProps {
  addresses: Array<{ id: number; name: string; phone: string; address: string; isDefault: boolean }>;
  onAddAddress: () => void;
  showAddForm: boolean;
  onCloseForm: () => void;
  onSaveAddress: (address: { name: string; phone: string; address: string; isDefault: boolean }) => void;
}

function AddressManagement({ addresses, onAddAddress, showAddForm, onCloseForm, onSaveAddress }: AddressManagementProps) {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', isDefault: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    onSaveAddress(formData);
    setFormData({ name: '', phone: '', address: '', isDefault: false });
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Địa chỉ của tôi</h3>
        <button 
          onClick={onAddAddress}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium flex items-center gap-1"
        >
          Thêm địa chỉ <Plus className="w-4 h-4 text-black" />
        </button>
      </div>
      <div className="p-6">
        {showAddForm && (
          <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Thêm địa chỉ mới</h4>
              <button onClick={onCloseForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="default"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="default" className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={onCloseForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
        {addresses.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <p className="text-gray-400">Địa chỉ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Mặc định</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

