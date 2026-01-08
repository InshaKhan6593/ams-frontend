// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  UserPlus,
  Settings,
  Activity,
  ChevronRight,
  TrendingUp,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { usersAPI } from '../../api/users';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { hasPermission, isSuperuser } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roles: {},
    recentUsers: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const users = await usersAPI.getUsers();
      const userList = Array.isArray(users) ? users : users.results || [];

      const activeCount = userList.filter(u => u.is_active).length;
      const roleStats = {};

      userList.forEach(user => {
        const role = user.role || 'No Role';
        roleStats[role] = (roleStats[role] || 0) + 1;
      });

      // Get recent users (last 5)
      const recentUsers = [...userList]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalUsers: userList.length,
        activeUsers: activeCount,
        inactiveUsers: userList.length - activeCount,
        roles: roleStats,
        recentUsers,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    SYSTEM_ADMIN: 'System Admin',
    LOCATION_HEAD: 'Location Head',
    STOCK_INCHARGE: 'Stock Incharge',
    AUDITOR: 'Auditor',
    'No Role': 'No Role Assigned',
  };

  const roleColors = {
    SYSTEM_ADMIN: 'bg-purple-500',
    LOCATION_HEAD: 'bg-blue-500',
    STOCK_INCHARGE: 'bg-emerald-500',
    AUDITOR: 'bg-amber-500',
    'No Role': 'bg-gray-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Administration</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage users, permissions, and system settings</p>
        </div>
        {hasPermission(PERMISSIONS.USERS.CREATE) && (
          <button
            onClick={() => navigate('/dashboard/users/new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>Total</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.activeUsers}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active Users</p>
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
              Inactive
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.inactiveUsers}</p>
            <p className="text-xs text-gray-500 mt-0.5">Inactive Users</p>
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              Roles
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {Object.keys(stats.roles).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Role Types</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-2">
            {hasPermission(PERMISSIONS.USERS.VIEW) && (
              <button
                onClick={() => navigate('/dashboard/users')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">View and edit user accounts</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}

            {hasPermission(PERMISSIONS.USERS.CREATE) && (
              <button
                onClick={() => navigate('/dashboard/users/new')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-gray-900">Create User</p>
                  <p className="text-xs text-gray-500">Add a new user to the system</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard/admin/groups')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-gray-900">Manage Groups</p>
                <p className="text-xs text-gray-500">Configure permission groups</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>

            {isSuperuser() && (
              <button
                onClick={() => navigate('/dashboard/admin/permissions')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Lock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-gray-900">Permissions</p>
                  <p className="text-xs text-gray-500">View system permissions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Role Distribution</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(stats.roles).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${roleColors[role] || 'bg-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {roleLabels[role] || role}
                      </span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${roleColors[role] || 'bg-gray-400'}`}
                        style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(stats.roles).length === 0 && (
              <div className="text-center py-6">
                <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No role data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentUsers.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No users yet</p>
              </div>
            ) : (
              stats.recentUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => navigate(`/dashboard/users/${user.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">
                      {(user.user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {user.user?.full_name || user.user?.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {roleLabels[user.role] || user.role || 'No Role'}
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    user.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </button>
              ))
            )}
          </div>
          {stats.recentUsers.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <button
                onClick={() => navigate('/dashboard/users')}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                View all users
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permission System Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Django Permission System
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This system uses Django's built-in Groups and Permissions for access control.
              Users are assigned to groups which grant them specific permissions.
              Additionally, location-scoped access ensures users can only operate within their assigned locations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
