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
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.location_name?.toLowerCase().includes(searchTerm.toLowerCase());

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Custom Roles</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage custom roles with specific permissions
          </p>
        </div>
        {canManageCustomRoles() && (
          <button
            onClick={() => navigate('/dashboard/users/custom-roles/new')}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New Role
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Roles</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-600 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-700 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Inactive</p>
              <p className="text-xl font-bold text-gray-500 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Active filters:</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center gap-1 hover:bg-gray-200"
              >
                Search: {searchTerm}
                <X className="w-3 h-3" />
              </button>
            )}
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center gap-1 hover:bg-gray-200"
              >
                Status: {statusFilter}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Roles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Role Name</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Location</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Description</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Users</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Status</th>
                {canManageCustomRoles() && (
                  <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No roles match your filters'
                        : 'No custom roles created yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{role.name}</p>
                      {role.requires_base_role && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Requires: {role.requires_base_role}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-700">{role.location_name || 'N/A'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {role.description || '-'}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {role.users_count || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            role.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            role.is_active ? 'text-green-700' : 'text-gray-500'
                          }`}
                        >
                          {role.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    {canManageCustomRoles() && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/dashboard/users/custom-roles/${role.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(role.id, role.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
