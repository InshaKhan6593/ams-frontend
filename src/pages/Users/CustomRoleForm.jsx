// src/pages/Users/CustomRoleForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import * as Icons from 'lucide-react';
import { customRolesAPI } from '../../api/users';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PERMISSION_CATEGORIES, PERMISSION_LABELS } from '../../constants/permissions';
import { usersAPI } from '../../api/users';

const CustomRoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data with all permission fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    requires_base_role: '',
    is_active: true,
    // Initialize all permissions to false
    ...Object.keys(PERMISSION_LABELS).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
  });

  // Locations for dropdown
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Collapsible category state
  const [expandedCategories, setExpandedCategories] = useState({
    inspections: true, // Default first category open
    stock: false,
    items: false,
    locations: false,
    users: false,
    maintenance: false,
    interStore: false,
    reports: false,
  });

  // Base role options
  const roles = usersAPI.getRoles();

  useEffect(() => {
    fetchStandaloneLocations();
    if (isEditMode) {
      fetchCustomRole();
    }
  }, [id]);

  const fetchStandaloneLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await locationsAPI.getLocations({ is_standalone: true });
      setLocations(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchCustomRole = async () => {
    try {
      setLoading(true);
      const data = await customRolesAPI.get(id);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        requires_base_role: data.requires_base_role || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        // Set all permission fields from response
        ...Object.keys(PERMISSION_LABELS).reduce((acc, key) => ({
          ...acc,
          [key]: data[key] || false
        }), {}),
      });
      setError('');
    } catch (err) {
      setError('Failed to load custom role');
      console.error('Error fetching custom role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const handleSelectAllCategory = (categoryKey, categoryPerms) => {
    const allSelected = categoryPerms.every((p) => formData[p]);
    const newValue = !allSelected;

    setFormData((prev) => {
      const updated = { ...prev };
      categoryPerms.forEach((perm) => {
        updated[perm] = newValue;
      });
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Role name is required');
      return false;
    }

    if (!formData.location) {
      setError('Location is required');
      return false;
    }

    // Check if at least one permission is selected
    const hasAnyPermission = Object.keys(PERMISSION_LABELS).some((key) => formData[key]);
    if (!hasAnyPermission) {
      setError('At least one permission must be selected');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (isEditMode) {
        await customRolesAPI.update(id, formData);
        setSuccess('Custom role updated successfully!');
      } else {
        await customRolesAPI.create(formData);
        setSuccess('Custom role created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard/users');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Operation failed');
      console.error('Error saving custom role:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderPermissionCategory = (categoryKey, category) => {
    const categoryPerms = category.permissions;
    const selectedCount = categoryPerms.filter((p) => formData[p]).length;
    const allSelected = categoryPerms.length > 0 && selectedCount === categoryPerms.length;
    const isExpanded = expandedCategories[categoryKey];

    // Get the icon component dynamically
    const IconComponent = Icons[category.icon] || Icons.Box;

    return (
      <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCategory(categoryKey)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <IconComponent className="w-4 h-4 text-primary-600" />
            <div className="text-left">
              <span className="font-medium text-gray-900">{category.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
              {selectedCount}/{categoryPerms.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-2.5 bg-white">
            {/* Select All checkbox */}
            <label className="flex items-center mb-2.5 pb-2 border-b border-gray-200">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => handleSelectAllCategory(categoryKey, categoryPerms)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-xs font-medium text-gray-700">Select All</span>
            </label>

            {/* Individual permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {categoryPerms.map((permKey) => (
                <label key={permKey} className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    name={permKey}
                    checked={formData[permKey] || false}
                    onChange={handlePermissionChange}
                    className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-xs text-gray-700">{PERMISSION_LABELS[permKey]}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading custom role..." />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/users')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {isEditMode ? 'Edit Custom Role' : 'Create Custom Role'}
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {isEditMode ? 'Update role permissions and details' : 'Define a new custom role with specific permissions'}
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-2 rounded-lg text-xs">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Role Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Inventory Manager"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={loadingLocations}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Base Role Requirement */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Base Role Requirement (Optional)
              </label>
              <select
                name="requires_base_role"
                value={formData.requires_base_role}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Any role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only users with this base role can be assigned this custom role
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center h-9">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-xs text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-2.5">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the purpose and scope of this role..."
            />
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Permissions</h2>
          <p className="text-xs text-gray-600 mb-2.5">
            Select the permissions for this custom role. Users with this role will inherit these permissions.
          </p>

          <div className="space-y-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) =>
              renderPermissionCategory(key, category)
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Role' : 'Create Role'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard/users')}
            className="px-2.5 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomRoleForm;
