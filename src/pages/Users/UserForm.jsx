// src/pages/Users/UserForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Key, UserPlus, MapPin } from 'lucide-react';
import { usersAPI, customRolesAPI } from '../../api/users';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser, refreshPermissions } = useAuth();
  const { canManageCustomRoles } = usePermissions();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    phone: '',
    assigned_locations: [],
    custom_roles: [],
  });

  // Available locations based on role
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Available custom roles
  const [availableCustomRoles, setAvailableCustomRoles] = useState([]);
  const [loadingCustomRoles, setLoadingCustomRoles] = useState(false);

  // Role options
  const roles = usersAPI.getRoles();

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
    fetchAvailableCustomRoles();
  }, [id]);

  useEffect(() => {
    if (formData.role) {
      fetchAvailableLocations();
    }
  }, [formData.role]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUser(id);
      setFormData({
        username: data.user.username,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role: data.role,
        phone: data.phone || '',
        assigned_locations: data.assigned_locations || [],
        custom_roles: data.custom_roles || [],
      });
      setError('');
    } catch (err) {
      setError('Failed to load user details');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLocations = async () => {
    try {
      setLoadingLocations(true);
      
      let locations = [];
      
      // LOCATION_HEAD: Only standalone locations
      if (formData.role === 'LOCATION_HEAD') {
        const response = await locationsAPI.getLocations({ is_standalone: true });
        locations = response.results || response;
      }
      // STOCK_INCHARGE: Only stores
      else if (formData.role === 'STOCK_INCHARGE') {
        const response = await locationsAPI.getLocations({ is_store: true });
        locations = response.results || response;
      }

      setAvailableLocations(Array.isArray(locations) ? locations : []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setAvailableLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchAvailableCustomRoles = async () => {
    try {
      setLoadingCustomRoles(true);
      const data = await customRolesAPI.getAll();
      setAvailableCustomRoles(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching custom roles:', err);
      setAvailableCustomRoles([]);
    } finally {
      setLoadingCustomRoles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear assigned locations when role changes
    if (name === 'role') {
      setFormData((prev) => ({
        ...prev,
        assigned_locations: [],
      }));
    }
  };

  const handleLocationToggle = (locationId) => {
    setFormData((prev) => {
      const currentLocations = prev.assigned_locations.map(loc => 
        typeof loc === 'object' ? loc.id : loc
      );
      
      const isSelected = currentLocations.includes(locationId);
      
      if (isSelected) {
        return {
          ...prev,
          assigned_locations: currentLocations.filter(id => id !== locationId),
        };
      } else {
        return {
          ...prev,
          assigned_locations: [...currentLocations, locationId],
        };
      }
    });
  };

  const handleCustomRoleToggle = (roleId) => {
    setFormData((prev) => {
      const currentRoles = prev.custom_roles || [];
      const isSelected = currentRoles.includes(roleId);

      if (isSelected) {
        return {
          ...prev,
          custom_roles: currentRoles.filter(id => id !== roleId),
        };
      } else {
        return {
          ...prev,
          custom_roles: [...currentRoles, roleId],
        };
      }
    });
  };

  const validateForm = () => {
    if (!isEditMode && !formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!isEditMode && !formData.password) {
      setError('Password is required');
      return false;
    }

    if (!formData.role) {
      setError('Role is required');
      return false;
    }

    // Validate password strength
    if (!isEditMode && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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

      const submitData = {
        role: formData.role,
        phone: formData.phone,
        assigned_locations: formData.assigned_locations.map(loc =>
          typeof loc === 'object' ? loc.id : loc
        ),
      };

      if (isEditMode) {
        // Update existing user
        submitData.email = formData.email;
        submitData.first_name = formData.first_name;
        submitData.last_name = formData.last_name;
        submitData.custom_roles = formData.custom_roles || [];

        await usersAPI.updateUser(id, submitData);

        // If editing current user and custom_roles changed, refresh permissions
        if (id === currentUser?.id?.toString()) {
          await refreshPermissions();
        }

        setSuccess('User updated successfully!');
        setTimeout(() => navigate('/dashboard/users'), 1500);
      } else {
        // Create new user
        submitData.username = formData.username;
        submitData.password = formData.password;
        submitData.email = formData.email;
        submitData.first_name = formData.first_name;
        submitData.last_name = formData.last_name;

        await usersAPI.createUser(submitData);
        setSuccess('User created successfully!');
        setTimeout(() => navigate('/dashboard/users'), 1500);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.username?.[0] ||
                          err.response?.data?.detail ||
                          'Failed to save user';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const selectedLocationIds = formData.assigned_locations.map(loc => 
    typeof loc === 'object' ? loc.id : loc
  );

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
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {isEditMode ? 'Update user information and permissions' : 'Add a new user to the system'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isEditMode}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter username"
                required={!isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              )}
            </div>

            {/* Password */}
            {!isEditMode && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="user@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+1234567890"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Role & Permissions</h2>
          
          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            
            {/* Role Descriptions */}
            <div className="mt-2 space-y-1">
              {formData.role === 'SYSTEM_ADMIN' && (
                <p className="text-xs text-blue-600">
                  ℹ️ Full system access - can manage all users, locations, and inventory
                </p>
              )}
              {formData.role === 'LOCATION_HEAD' && (
                <p className="text-xs text-blue-600">
                  ℹ️ Manages a standalone location and can create Stock Incharges
                </p>
              )}
              {formData.role === 'STOCK_INCHARGE' && (
                <p className="text-xs text-blue-600">
                  ℹ️ Manages store inventory - receives, issues, and tracks stock
                </p>
              )}
              {formData.role === 'AUDITOR' && (
                <p className="text-xs text-blue-600">
                  ℹ️ Reviews and audits inspection certificates and inventory
                </p>
              )}
            </div>
          </div>

          {/* Location Assignment */}
          {(formData.role === 'LOCATION_HEAD' || formData.role === 'STOCK_INCHARGE') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Assigned Locations
              </label>
              
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : availableLocations.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                  No locations available for this role
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {availableLocations.map((location) => (
                    <label
                      key={location.id}
                      className="flex items-center gap-3 px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationIds.includes(location.id)}
                        onChange={() => handleLocationToggle(location.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-medium text-gray-900">
                            {location.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">
                          {location.code}
                          {location.is_standalone && ' • Standalone'}
                          {location.is_store && ' • Store'}
                          {location.is_main_store && ' • Main Store'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {formData.role === 'LOCATION_HEAD' 
                  ? 'Location Heads must be assigned to standalone locations'
                  : 'Stock Incharges must be assigned to store locations'}
              </p>
              
              {selectedLocationIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    Selected: {selectedLocationIds.length} location(s)
                  </p>
                </div>
              )}
            </div>
          )}

          {(formData.role === 'SYSTEM_ADMIN' || formData.role === 'AUDITOR') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                {formData.role === 'SYSTEM_ADMIN'
                  ? '🔑 System Admins have access to all locations by default'
                  : '👁️ Auditors can view all locations for audit purposes'}
              </p>
            </div>
          )}

          {/* Custom Roles Section */}
          {canManageCustomRoles() && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom Roles (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Assign additional custom roles to grant granular permissions
              </p>

              {loadingCustomRoles ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : availableCustomRoles.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                  No custom roles available.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/users/custom-roles/new')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Create one
                  </button>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {availableCustomRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 px-2.5 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.custom_roles?.includes(role.id) || false}
                        onChange={() => handleCustomRoleToggle(role.id)}
                        disabled={!role.is_active}
                        className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">
                            {role.name}
                          </span>
                          {!role.is_active && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {role.location_name && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            📍 {role.location_name}
                          </p>
                        )}
                        {role.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {formData.custom_roles && formData.custom_roles.length > 0 && (
                <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-medium text-indigo-700 mb-1">
                    Selected Roles ({formData.custom_roles.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {formData.custom_roles.map((roleId) => {
                      const role = availableCustomRoles.find((r) => r.id === roleId);
                      return role ? (
                        <span
                          key={roleId}
                          className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700"
                        >
                          {role.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
                {isEditMode ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isEditMode ? 'Update User' : 'Create User'}
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

          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                const newPassword = prompt('Enter new password (minimum 6 characters):');
                if (newPassword && newPassword.length >= 6) {
                  usersAPI.resetPassword(id, newPassword)
                    .then(() => alert('Password reset successfully!'))
                    .catch(() => alert('Failed to reset password'));
                } else if (newPassword) {
                  alert('Password must be at least 6 characters');
                }
              }}
              className="ml-auto flex items-center gap-2 px-2.5 py-1.5 border border-amber-300 bg-amber-50 text-amber-700 text-xs rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Key className="w-4 h-4" />
              Reset Password
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;