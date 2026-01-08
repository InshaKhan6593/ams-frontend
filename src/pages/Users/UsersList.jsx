// src/pages/Users/UsersList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, Power, Users as UsersIcon, X, ChevronRight,
  Mail, MapPin, Shield
} from 'lucide-react';
import { usersAPI } from '../../api/users';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UsersList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUsers();
      setUsers(Array.isArray(data) ? data : data.results || []);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, e) => {
    e.stopPropagation();
    if (!confirm('Change this user\'s status?')) return;
    try {
      await usersAPI.toggleActive(userId);
      fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && user.is_active) ||
      (activeFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesActive;
  });

  const roleConfig = {
    SYSTEM_ADMIN: { label: 'Admin', bg: 'bg-purple-100', text: 'text-purple-700' },
    LOCATION_HEAD: { label: 'Location Head', bg: 'bg-blue-100', text: 'text-blue-700' },
    STOCK_INCHARGE: { label: 'Stock Incharge', bg: 'bg-green-100', text: 'text-green-700' },
    AUDITOR: { label: 'Auditor', bg: 'bg-orange-100', text: 'text-orange-700' },
  };

  const getRoleConfig = (role) => roleConfig[role] || { label: role || 'No Role', bg: 'bg-gray-100', text: 'text-gray-600' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Users</h1>
          <p className="text-xs text-gray-600 mt-0.5">{stats.total} users ({stats.active} active)</p>
        </div>
        {hasPermission(PERMISSIONS.USERS.CREATE) && (
          <Link
            to="/dashboard/users/new"
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New User
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">Admin</option>
            <option value="LOCATION_HEAD">Location Head</option>
            <option value="STOCK_INCHARGE">Stock Incharge</option>
            <option value="AUDITOR">Auditor</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || roleFilter || activeFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter(''); setActiveFilter('all'); }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <UsersIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">User</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 hidden md:table-cell">Role</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 hidden lg:table-cell">Locations</th>
                <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const roleConf = getRoleConfig(user.role);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/dashboard/users/${user.id}`)}
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-600">
                            {(user.user?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {user.user?.full_name || user.user?.username}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.user?.email || '-'}</p>
                        </div>
                        {user.user?.is_superuser && (
                          <Shield className="w-3 h-3 text-purple-500 flex-shrink-0" title="Superuser" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 hidden md:table-cell">
                      <span className={`inline-flex px-1.5 py-0.5 ${roleConf.bg} ${roleConf.text} text-xs rounded`}>
                        {roleConf.label}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 hidden lg:table-cell">
                      {user.assigned_locations_names?.length > 0 ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.assigned_locations_names.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {hasPermission(PERMISSIONS.USERS.EDIT) && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/users/${user.id}`); }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleToggleActive(user.id, e)}
                              className={`p-1 rounded ${
                                user.is_active
                                  ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Showing {filteredUsers.length} of {users.length}
      </p>
    </div>
  );
};

export default UsersList;
