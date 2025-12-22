// src/components/layout/Header.jsx
import { Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 ml-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Role Badge */}
        <div className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
          {user?.role_display || 'User'}
        </div>
      </div>
    </header>
  );
};

export default Header;