// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  FolderTree,
  BoxIcon,
  BarChart3,
  LogOut,
  Users,
  MapPin,
  CheckSquare,
  RotateCcw,
  ArrowRightLeft,
  QrCode,
  Wrench,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { usersAPI } from '../../api/users';
import { PERMISSIONS } from '../../constants/permissions';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { hasAnyPermission, hasRole } = usePermissions();
  const [pendingCounts, setPendingCounts] = useState({
    inspections: 0,
    acknowledgments: 0,
    returns: 0,
    requests: 0,
  });

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const data = await usersAPI.getMyPendingTasks();
        setPendingCounts({
          inspections: data?.counts?.inspections || 0,
          acknowledgments: data?.counts?.acknowledgments || 0,
          returns: data?.counts?.returns || 0,
          requests: data?.counts?.requests || 0,
        });
      } catch (err) {
        console.error('Error fetching pending counts:', err);
      }
    };

    fetchPendingCounts();

    // Refresh every 2 minutes
    const interval = setInterval(fetchPendingCounts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Define all menu items with permission requirements
  const allMenuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      alwaysShow: true,
    },
    {
      name: 'Stock Entries',
      icon: Package,
      path: '/dashboard/stock-entries',
      requiredPermissions: [PERMISSIONS.STOCK.VIEW_INVENTORY, PERMISSIONS.STOCK.CREATE_ENTRIES],
    },
    {
      name: 'Acknowledgments',
      icon: CheckSquare,
      path: '/dashboard/acknowledgments',
      badge: pendingCounts.acknowledgments,
      requiredPermissions: [PERMISSIONS.STOCK.ACKNOWLEDGE],
    },
    {
      name: 'Returns',
      icon: RotateCcw,
      path: '/dashboard/returns',
      badge: pendingCounts.returns,
      requiredPermissions: [PERMISSIONS.STOCK.RETURN],
    },
    {
      name: 'Store Requests',
      icon: ArrowRightLeft,
      path: '/dashboard/store-requests',
      badge: pendingCounts.requests,
      requiredPermissions: [
        PERMISSIONS.INTER_STORE.CREATE,
        PERMISSIONS.INTER_STORE.FULFILL,
        PERMISSIONS.INTER_STORE.ACKNOWLEDGE,
      ],
    },
    {
      name: 'Inspections',
      icon: FileText,
      path: '/dashboard/inspections',
      badge: pendingCounts.inspections,
      requiredPermissions: [PERMISSIONS.INSPECTIONS.VIEW, PERMISSIONS.INSPECTIONS.INITIATE],
    },
    {
      name: 'Maintenance',
      icon: Wrench,
      path: '/dashboard/maintenance',
      requiredPermissions: [PERMISSIONS.MAINTENANCE.VIEW, PERMISSIONS.MAINTENANCE.CREATE],
    },
    {
      name: 'Locations',
      icon: MapPin,
      path: '/dashboard/locations',
      requiredPermissions: [PERMISSIONS.LOCATIONS.VIEW],
    },
    {
      name: 'Categories',
      icon: FolderTree,
      path: '/dashboard/categories',
      requiredPermissions: [PERMISSIONS.ITEMS.VIEW],
    },
    {
      name: 'Items',
      icon: BoxIcon,
      path: '/dashboard/items',
      requiredPermissions: [PERMISSIONS.ITEMS.VIEW],
    },
    {
      name: 'Inventory',
      icon: BarChart3,
      path: '/dashboard/inventory',
      requiredPermissions: [PERMISSIONS.STOCK.VIEW_INVENTORY],
    },
    {
      name: 'QR Scanner',
      icon: QrCode,
      path: '/dashboard/qr-scanner',
      alwaysShow: true, // QR Scanner available to all
    },
    {
      name: 'Users',
      icon: Users,
      path: '/dashboard/users',
      requiredPermissions: [PERMISSIONS.USERS.VIEW],
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter((item) => {
    // Always show if explicitly marked
    if (item.alwaysShow) return true;

    // System Admin sees everything
    if (hasRole('SYSTEM_ADMIN')) return true;

    // Check permission requirement (OR logic - if user has ANY of the required permissions)
    if (item.requiredPermissions?.length > 0) {
      return hasAnyPermission(item.requiredPermissions);
    }

    // Default: hide if no explicit permission
    return false;
  });

  return (
    <div className="h-screen w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">Inventory</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role_display || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </div>
              
              {/* Gmail-like badge */}
              {item.badge > 0 && (
                <span className="flex-shrink-0 min-w-[18px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;