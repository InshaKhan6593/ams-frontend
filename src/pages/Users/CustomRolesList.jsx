// src/pages/Users/CustomRolesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { customRolesAPI } from '../../api/users';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CustomRolesList = () => {
  const navigate = useNavigate();
  const { canManageCustomRoles } = usePermissions();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCustomRoles();
  }, []);

  const fetchCustomRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await customRolesAPI.getAll();
      setRoles(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError('Failed to load custom roles');
      console.error('Error fetching custom roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      await customRolesAPI.delete(roleId);
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete role');
      console.error('Error deleting role:', err);
    }
  };

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && role.is_active) ||
      (statusFilter === 'inactive' && !role.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: roles.length,
    active: roles.filter((r) => r.is_active).length,
    inactive: roles.filter((r) => !r.is_active).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading custom roles..." />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Custom Roles</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Create and manage custom roles (global or location-specific) with specific permissions
          </p>
        </div>
        {canManageCustomRoles() && (
          <button
            onClick={() => navigate('/dashboard/users/custom-roles/new')}
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Role
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Roles</p>
              <p className="text-base font-bold text-gray-900 mt-0">{stats.total}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active</p>
              <p className="text-base font-bold text-green-600 mt-0">{stats.active}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Inactive</p>
              <p className="text-base font-bold text-gray-500 mt-0">{stats.inactive}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-1 mt-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-green-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Custom Roles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Role Name</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Description</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Users</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Scope</th>
                {canManageCustomRoles() && (
                  <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={canManageCustomRoles() ? 6 : 5} className="px-2 py-6 text-center text-xs text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No roles match your filters'
                      : 'No custom roles created yet'}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <p className="text-xs font-medium text-gray-900">{role.name}</p>
                      {role.created_by_name && (
                        <p className="text-xs text-gray-500">
                          Created by: {role.created_by_name}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {role.description || '-'}
                      </p>
                    </td>
                    <td className="px-2 py-1">
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {role.users_count || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      {role.is_active ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {role.is_global ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          🌐 Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          📍 {role.location_name}
                        </span>
                      )}
                    </td>
                    {canManageCustomRoles() && (
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => navigate(`/dashboard/users/custom-roles/${role.id}`)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(role.id, role.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center">
        Showing {filteredRoles.length} of {roles.length} custom roles
      </div>
    </div>
  );
};

export default CustomRolesList;
