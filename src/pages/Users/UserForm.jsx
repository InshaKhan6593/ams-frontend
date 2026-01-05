// src/pages/Users/UserForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Key, UserPlus, MapPin } from 'lucide-react';
import { usersAPI, customRolesAPI } from '../../api/users';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PermissionSelector from '../../components/PermissionSelector';

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

  // Track the selected value in dropdown (can be base role or custom_X)
  const [selectedRoleValue, setSelectedRoleValue] = useState('');

  // Custom permissions (for new users only)
  const [customPermissions, setCustomPermissions] = useState({});

  // Available locations based on role
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Available custom roles
  const [availableCustomRoles, setAvailableCustomRoles] = useState([]);
  const [loadingCustomRoles, setLoadingCustomRoles] = useState(false);

  // Role options - will combine base roles and custom roles
  const baseRoles = usersAPI.getRoles();
  const [allRoles, setAllRoles] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
    fetchAvailableCustomRoles();
  }, [id]);

  useEffect(() => {
    // Combine base roles and custom roles for the dropdown
    const combined = [
      ...baseRoles,
      ...(availableCustomRoles
        .filter(cr => cr.is_active)
        .map(cr => ({
          value: `custom_${cr.id}`,
          label: cr.is_global ? `${cr.name} 🌐` : `${cr.name} 📍 ${cr.location_name}`,
          isCustom: true,
          customRoleId: cr.id,
          customRoleData: cr
        }))
      )
    ];
    setAllRoles(combined);
  }, [availableCustomRoles]);

  useEffect(() => {
    if (formData.role || (formData.custom_roles && formData.custom_roles.length > 0)) {
      fetchAvailableLocations();
    }
  }, [formData.role, formData.custom_roles]);

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
      // Set dropdown value for editing
      setSelectedRoleValue(data.role || '');
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
      // Custom role selected (without base role): show standalone locations
      // This allows flexible assignment to departments/locations
      else if (!formData.role && formData.custom_roles && formData.custom_roles.length > 0) {
        const response = await locationsAPI.getLocations({ is_standalone: true });
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

    // Handle role change specially
    if (name === 'role') {
      setSelectedRoleValue(value);  // Update dropdown display

      // Check if it's a custom role
      if (value.startsWith('custom_')) {
        const customRoleId = parseInt(value.replace('custom_', ''));
        setFormData((prev) => ({
          ...prev,
          role: '',  // Clear base role (backend doesn't need this)
          custom_roles: [customRoleId],  // Set custom role
          assigned_locations: [],  // Clear locations
        }));
      } else {
        // It's a base role
        setFormData((prev) => ({
          ...prev,
          role: value,
          custom_roles: [],  // Clear custom roles when base role selected
          assigned_locations: [],  // Clear locations when role changes
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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

    // Check if either base role or custom role is selected
    if (!formData.role && (!formData.custom_roles || formData.custom_roles.length === 0)) {
      setError('Please select a role (base role or custom role)');
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

      // Filter out empty custom permissions
      const filteredCustomPerms = Object.fromEntries(
        Object.entries(customPermissions).filter(([_, value]) => value === true)
      );

      // Prepare submit data
      const submitData = {
        phone: formData.phone,
        assigned_locations: formData.assigned_locations.map(loc =>
          typeof loc === 'object' ? loc.id : loc
        ),
      };

      // Add role - only if a base role is selected
      // Backend now supports users with only custom roles (role can be null)
      if (formData.role) {
        submitData.role = formData.role;
      }
      // If only custom role selected, don't set a base role (backend allows null)

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

        // Add custom roles if any are selected
        if (formData.custom_roles && formData.custom_roles.length > 0) {
          submitData.custom_roles = formData.custom_roles;
        }

        // Add custom permissions if any are selected
        if (Object.keys(filteredCustomPerms).length > 0) {
          submitData.custom_permissions = filteredCustomPerms;
        }

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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">Role & Permissions</h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              Flexible System
            </span>
          </div>

          {/* Flexibility Notice */}
          <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>Choose your approach:</strong>
            </p>
            <ul className="text-xs text-gray-600 mt-1 space-y-0.5 ml-3">
              <li>• <strong>Base Role</strong> - Predefined role with standard permissions</li>
              <li>• <strong>Custom Role</strong> - Global or location-specific role you created</li>
              <li>• <strong>Individual Permissions</strong> - Grant specific permissions for unique cases</li>
              <li>• <strong>Combine</strong> - Use any combination of the above!</li>
            </ul>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-gray-500">(Base or Custom)</span>
            </label>
            <select
              name="role"
              value={selectedRoleValue}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a role...</option>
              <optgroup label="Base Roles">
                {baseRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </optgroup>
              {availableCustomRoles.length > 0 && (
                <optgroup label="Custom Roles">
                  {availableCustomRoles
                    .filter(cr => cr.is_active)
                    .map((role) => (
                      <option key={`custom_${role.id}`} value={`custom_${role.id}`}>
                        {role.name} {role.is_global ? '🌐' : `📍 ${role.location_name || ''}`}
                      </option>
                    ))}
                </optgroup>
              )}
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
              {!formData.role && formData.custom_roles && formData.custom_roles.length > 0 && (() => {
                const selectedCustomRole = availableCustomRoles.find(cr => cr.id === formData.custom_roles[0]);
                return selectedCustomRole ? (
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs font-medium text-indigo-900">
                      {selectedCustomRole.is_global ? '🌐' : '📍'} Custom Role: {selectedCustomRole.name}
                    </p>
                    {selectedCustomRole.description && (
                      <p className="text-xs text-indigo-700 mt-1">
                        {selectedCustomRole.description}
                      </p>
                    )}
                    {!selectedCustomRole.is_global && selectedCustomRole.location_name && (
                      <p className="text-xs text-indigo-600 mt-1">
                        Location: {selectedCustomRole.location_name}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Location Assignment - show for base roles that need it, or if custom role without base role */}
          {((formData.role === 'LOCATION_HEAD' || formData.role === 'STOCK_INCHARGE') ||
            (!formData.role && formData.custom_roles && formData.custom_roles.length > 0)) && (
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
                  : formData.role === 'STOCK_INCHARGE'
                  ? 'Stock Incharges must be assigned to store locations'
                  : 'Assign this user to departments/locations where they will work'}
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
                  : 'Auditors can view all locations for audit purposes'}
              </p>
            </div>
          )}

          {/* Custom Roles Section */}
          {canManageCustomRoles() && formData.role && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom Roles (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Assign global custom roles to grant additional permissions university-wide
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
                  {availableCustomRoles.filter(role => role.is_active).map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 px-2.5 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.custom_roles?.includes(role.id) || false}
                        onChange={() => handleCustomRoleToggle(role.id)}
                        className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">
                            {role.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            Global
                          </span>
                        </div>
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

          {/* Custom Permissions Section - for unique permission combinations */}
          {!isEditMode && (formData.role || (formData.custom_roles && formData.custom_roles.length > 0)) && (
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 mt-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">
                    Additional Permissions (Optional)
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Grant specific individual permissions for unique requirements not covered by roles.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                  Flexible
                </span>
              </div>

              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                  💡 <strong>Use Case:</strong> Grant one-off permissions without creating a new role.
                  Example: Allow viewing reports without full auditor role.
                </p>
              </div>

              <PermissionSelector
                selectedRole={formData.role || 'STOCK_INCHARGE'}
                value={customPermissions}
                onChange={setCustomPermissions}
              />
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