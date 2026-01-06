// src/pages/Users/UsersList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Power, Key, Users as UsersIcon,
  Filter, X
} from 'lucide-react';
import { usersAPI } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UsersList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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

  const handleToggleActive = async (userId) => {
    if (!confirm('Are you sure you want to change this user\'s status?')) return;

    try {
      await usersAPI.toggleActive(userId);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
      console.error('Error toggling user status:', err);
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

  const roleColors = {
    SYSTEM_ADMIN: 'bg-purple-100 text-purple-700',
    LOCATION_HEAD: 'bg-blue-100 text-blue-700',
    STOCK_INCHARGE: 'bg-green-100 text-green-700',
    AUDITOR: 'bg-amber-100 text-amber-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Users</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage system users and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(PERMISSIONS.USERS.ASSIGN_CUSTOM_ROLES) && (
            <Link
              to="/dashboard/users/custom-roles"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage Custom Roles
            </Link>
          )}
          {hasPermission(PERMISSIONS.USERS.CREATE) && (
            <Link
              to="/dashboard/users/new"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New User
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Users</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{users.length}</p>
            </div>
            <UsersIcon className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active</p>
              <p className="text-lg font-bold text-green-600 mt-0.5">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <Power className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Inactive</p>
              <p className="text-lg font-bold text-red-600 mt-0.5">
                {users.filter(u => !u.is_active).length}
              </p>
            </div>
            <Power className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Location Heads</p>
              <p className="text-lg font-bold text-blue-600 mt-0.5">
                {users.filter(u => u.role === 'LOCATION_HEAD').length}
              </p>
            </div>
            <Filter className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
            <option value="LOCATION_HEAD">Location Head</option>
            <option value="STOCK_INCHARGE">Stock Incharge</option>
            <option value="AUDITOR">Auditor</option>
          </select>

          {/* Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || roleFilter || activeFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">
                Search: {searchTerm}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {roleFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">
                Role: {roleFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setRoleFilter('')} />
              </span>
            )}
            {activeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">
                Status: {activeFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveFilter('all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">User</th>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">Role</th>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">Employee ID</th>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">Assigned Locations</th>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2.5 py-1.5 text-left text-xs font-medium text-gray-600">Created</th>
                <th className="px-2.5 py-1.5 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-2.5 py-6 text-center text-xs text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-2.5 py-1.5">
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {user.user?.full_name || user.user?.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${roleColors[user.role]}`}>
                          {user.role_display}
                        </span>
                        {user.custom_roles_data && user.custom_roles_data.length > 0 && (
                          user.custom_roles_data.map((customRole) => (
                            <span
                              key={customRole.id}
                              className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700"
                              title={customRole.description || customRole.name}
                            >
                              {customRole.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-xs text-gray-900">{user.employee_id || '-'}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-xs text-gray-600">
                        {user.assigned_locations_names?.length || 0} location(s)
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission(PERMISSIONS.USERS.EDIT) && (
                          <button
                            onClick={() => navigate(`/dashboard/users/${user.id}`)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission(PERMISSIONS.USERS.EDIT) && (
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`p-1 ${
                              user.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            } rounded transition-colors`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-xs text-gray-600 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
};

export default UsersList;