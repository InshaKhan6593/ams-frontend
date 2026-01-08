// src/pages/Users/UserForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Key, UserPlus, Shield, Check, X, ChevronDown, ChevronUp, Store, Building2, Zap, Eye, Package, FileText, Wrench, Users } from 'lucide-react';
import { usersAPI } from '../../api/users';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ==================== PERMISSION PRESETS ====================
// Each preset includes all necessary permissions (including dependencies)
const PERMISSION_PRESETS = [
  {
    id: 'inventory_viewer',
    name: 'Inventory Viewer',
    description: 'View inventory, items, and locations (read-only)',
    icon: Eye,
    color: 'blue',
    permissions: [
      'view_location', 'view_locationinventory', 'view_item', 'view_category',
      'view_itembatch', 'view_iteminstance'
    ]
  },
  {
    id: 'stock_operator',
    name: 'Stock Operator',
    description: 'Issue, receive, transfer stock and manage inventory',
    icon: Package,
    color: 'green',
    permissions: [
      // Core stock operations
      'issue_stock', 'receive_stock', 'transfer_stock', 'acknowledge_stock', 'return_stock',
      'add_stockentry', 'view_stockentry',
      // Dependencies - need to view these to operate
      'view_location', 'view_locationinventory', 'view_item', 'view_category',
      'view_itembatch', 'view_iteminstance', 'change_iteminstance'
    ]
  },
  {
    id: 'inspection_manager',
    name: 'Inspection Manager',
    description: 'Create and manage inspection certificates',
    icon: FileText,
    color: 'purple',
    permissions: [
      'view_inspectioncertificate', 'initiate_inspectioncertificate',
      'change_inspectioncertificate', 'fill_stock_details', 'fill_central_register',
      'submit_to_stock_details', 'submit_to_central_register', 'submit_to_audit_review',
      'link_inspection_items', 'download_inspection_pdf',
      // Dependencies
      'view_location', 'view_item', 'view_category', 'view_locationinventory'
    ]
  },
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'Review and audit inspection certificates',
    icon: FileText,
    color: 'orange',
    permissions: [
      'view_inspectioncertificate', 'review_as_auditor', 'download_inspection_pdf',
      // Dependencies
      'view_location', 'view_item', 'view_category', 'view_locationinventory'
    ]
  },
  {
    id: 'store_requests',
    name: 'Inter-Store Requests',
    description: 'Create and manage requests between stores',
    icon: Package,
    color: 'cyan',
    permissions: [
      'add_interstorerequest', 'view_interstorerequest',
      'fulfill_inter_store_request', 'acknowledge_inter_store_request',
      // Dependencies
      'view_location', 'view_locationinventory', 'view_item', 'view_itembatch'
    ]
  },
  {
    id: 'maintenance_manager',
    name: 'Maintenance Manager',
    description: 'Create and manage maintenance records',
    icon: Wrench,
    color: 'amber',
    permissions: [
      'view_maintenancerecord', 'add_maintenancerecord', 'change_maintenancerecord',
      'complete_maintenance', 'approve_maintenance',
      // Dependencies
      'view_location', 'view_item', 'view_iteminstance'
    ]
  },
  {
    id: 'user_manager',
    name: 'User Manager',
    description: 'Create and manage users',
    icon: Users,
    color: 'indigo',
    permissions: [
      'view_userprofile', 'add_userprofile', 'change_userprofile',
      'assign_permissions', 'view_location'
    ]
  }
];

// Stock/Inventory related permissions that require store assignment
// NOTE: View permissions are excluded - only write operations need store assignment
const STOCK_PERMISSIONS = [
  'issue_stock', 'receive_stock', 'transfer_stock', 'acknowledge_stock', 'return_stock',
  'add_stockentry', 'change_stockentry', 'delete_stockentry',
  'add_interstorerequest', 'fulfill_inter_store_request', 'acknowledge_inter_store_request'
];

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser, refreshPermissions } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '',
    role: '', phone: '',
  });

  // Location selection state (for no-role users)
  const [selectedStandalone, setSelectedStandalone] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [standaloneLocations, setStandaloneLocations] = useState([]);
  const [storesUnderStandalone, setStoresUnderStandalone] = useState([]);
  const [loadingStandalones, setLoadingStandalones] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  // For role-based users (LOCATION_HEAD, STOCK_INCHARGE)
  const [availableLocations, setAvailableLocations] = useState([]);
  const [assignedLocations, setAssignedLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionCategories, setPermissionCategories] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const baseRoles = usersAPI.getRoles();

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
  };

  // Check if any stock-related permission is selected
  const hasStockPermissions = selectedPermissions.some(p => STOCK_PERMISSIONS.includes(p));

  useEffect(() => { fetchAvailablePermissions(); }, []);
  useEffect(() => { if (isEditMode) fetchUser(); }, [id]);
  useEffect(() => {
    if (formData.role) {
      fetchAvailableLocations();
    } else {
      fetchStandaloneLocations();
    }
  }, [formData.role]);

  // Fetch stores when standalone is selected
  useEffect(() => {
    if (selectedStandalone && !formData.role) {
      fetchStoresUnderStandalone(selectedStandalone);
    } else {
      setStoresUnderStandalone([]);
    }
  }, [selectedStandalone, formData.role]);

  const fetchAvailablePermissions = async () => {
    try {
      setLoadingPermissions(true);
      const data = await usersAPI.getAvailablePermissions();
      setPermissionCategories(data.permission_categories || {});
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setPermissionCategories({});
    } finally {
      setLoadingPermissions(false);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUser(id);
      setFormData({
        username: data.user.username, email: data.user.email,
        first_name: data.user.first_name, last_name: data.user.last_name,
        role: data.role || '', phone: data.phone || '',
      });

      // Handle assigned locations based on role
      if (data.assigned_locations && data.assigned_locations.length > 0) {
        const locationIds = data.assigned_locations.map(l => typeof l === 'object' ? l.id : l);

        if (data.role) {
          setAssignedLocations(locationIds);
        } else {
          const fullLocations = data.assigned_locations_data || data.assigned_locations;
          const standalone = fullLocations.find(l => l.is_standalone && !l.is_store);
          const stores = fullLocations.filter(l => l.is_store);

          if (standalone) {
            setSelectedStandalone(standalone.id);
          }
          setSelectedStores(stores.map(s => s.id));
        }
      }

      if (data.django_permissions) {
        const perms = data.django_permissions.map(p => p.split('.')[1] || p);
        setSelectedPermissions(perms);
        // Detect which presets are fully selected
        detectSelectedPresets(perms);
      }
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const detectSelectedPresets = (permissions) => {
    const activePresets = PERMISSION_PRESETS.filter(preset =>
      preset.permissions.every(p => permissions.includes(p))
    ).map(p => p.id);
    setSelectedPresets(activePresets);
  };

  const fetchStandaloneLocations = async () => {
    try {
      setLoadingStandalones(true);
      const response = await locationsAPI.getLocations({ is_standalone: true });
      const locations = response.results || response || [];
      setStandaloneLocations(Array.isArray(locations) ? locations : []);
    } catch (err) {
      setStandaloneLocations([]);
    } finally {
      setLoadingStandalones(false);
    }
  };

  const fetchStoresUnderStandalone = async (standaloneId) => {
    try {
      setLoadingStores(true);
      const response = await locationsAPI.getLocations({
        is_store: true,
        parent_standalone: standaloneId
      });
      const stores = response.results || response || [];
      setStoresUnderStandalone(Array.isArray(stores) ? stores : []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setStoresUnderStandalone([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const fetchAvailableLocations = async () => {
    try {
      setLoadingLocations(true);
      let locations = [];
      if (formData.role === 'LOCATION_HEAD') {
        const response = await locationsAPI.getLocations({ is_standalone: true });
        locations = response.results || response;
      } else if (formData.role === 'STOCK_INCHARGE') {
        const response = await locationsAPI.getLocations({ is_store: true });
        locations = response.results || response;
      }
      setAvailableLocations(Array.isArray(locations) ? locations : []);
    } catch (err) {
      setAvailableLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      setFormData(prev => ({ ...prev, role: value }));
      setAssignedLocations([]);
      setSelectedStandalone(null);
      setSelectedStores([]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStandaloneChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedStandalone(value);
    setSelectedStores([]);
  };

  const handleStoreToggle = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleLocationToggle = (locationId) => {
    setAssignedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Toggle a preset - adds or removes all its permissions
  const handlePresetToggle = (presetId) => {
    const preset = PERMISSION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const isCurrentlySelected = selectedPresets.includes(presetId);

    if (isCurrentlySelected) {
      // Remove preset - remove permissions that are ONLY from this preset
      const otherPresetPermissions = PERMISSION_PRESETS
        .filter(p => p.id !== presetId && selectedPresets.includes(p.id))
        .flatMap(p => p.permissions);

      const permissionsToRemove = preset.permissions.filter(
        p => !otherPresetPermissions.includes(p)
      );

      setSelectedPermissions(prev => prev.filter(p => !permissionsToRemove.includes(p)));
      setSelectedPresets(prev => prev.filter(id => id !== presetId));
    } else {
      // Add preset - add all its permissions
      setSelectedPermissions(prev => {
        const newPerms = new Set([...prev, ...preset.permissions]);
        return Array.from(newPerms);
      });
      setSelectedPresets(prev => [...prev, presetId]);
    }
  };

  const handlePermissionToggle = (codename) => {
    setSelectedPermissions(prev => {
      const newPerms = prev.includes(codename)
        ? prev.filter(p => p !== codename)
        : [...prev, codename];

      // Re-detect presets
      detectSelectedPresets(newPerms);
      return newPerms;
    });
  };

  const handleSavePermissions = async () => {
    if (!isEditMode) return;
    try {
      setSavingPermissions(true);
      await usersAPI.assignPermissions(id, selectedPermissions, true);
      setSuccess('Permissions saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!isEditMode && !formData.username.trim()) { setError('Username required'); return; }
    if (!isEditMode && !formData.password) { setError('Password required'); return; }
    if (!isEditMode && formData.password.length < 6) { setError('Password min 6 chars'); return; }

    // Validation for no-role users with stock permissions
    if (!formData.role && hasStockPermissions) {
      if (!selectedStandalone) {
        setError('Please select a standalone location for stock permissions');
        return;
      }
      if (selectedStores.length === 0) {
        setError('Please select at least one store for stock permissions');
        return;
      }
    }

    try {
      setSaving(true);

      let locationIds = [];
      if (formData.role) {
        locationIds = assignedLocations;
      } else {
        if (hasStockPermissions) {
          locationIds = selectedStores;
        } else if (selectedStandalone) {
          locationIds = [selectedStandalone];
        }
      }

      const submitData = {
        role: formData.role,
        phone: formData.phone,
        assigned_locations: locationIds,
      };

      if (isEditMode) {
        submitData.email = formData.email;
        submitData.first_name = formData.first_name;
        submitData.last_name = formData.last_name;
        submitData.user_permissions = selectedPermissions;
        await usersAPI.updateUser(id, submitData);
        if (id === currentUser?.id?.toString()) await refreshPermissions();
        setSuccess('User updated!');
      } else {
        submitData.username = formData.username;
        submitData.password = formData.password;
        submitData.email = formData.email;
        submitData.first_name = formData.first_name;
        submitData.last_name = formData.last_name;
        if (selectedPermissions.length > 0) {
          submitData.user_permissions = selectedPermissions;
        }
        await usersAPI.createUser(submitData);
        setSuccess('User created!');
      }
      setTimeout(() => navigate('/dashboard/users'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.username?.[0] || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center h-64"><LoadingSpinner size="large" /></div>;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/dashboard/users')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-gray-900">{isEditMode ? 'Edit User' : 'Create User'}</h1>
          <p className="text-xs text-gray-600 mt-0.5">{isEditMode ? formData.username : 'Add new user'}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><X className="w-3 h-3" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><Check className="w-3 h-3" />{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Basic Info Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={isEditMode}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50" placeholder="username" />
            </div>
            {!isEditMode && (
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="min 6 chars" />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="+123..." />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="John" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Doe" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Base Role (optional)</label>
              <select name="role" value={formData.role} onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">No base role (use presets below)</option>
                {baseRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Location Assignment */}
          {formData.role ? (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="block text-xs text-gray-600 mb-0.5">
                Assigned {formData.role === 'LOCATION_HEAD' ? 'Locations' : 'Stores'}
              </label>
              {loadingLocations ? <LoadingSpinner size="small" /> : availableLocations.length === 0 ? (
                <p className="text-xs text-gray-400">No locations available</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {availableLocations.map(loc => (
                    <label key={loc.id} className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-xs border ${assignedLocations.includes(loc.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={assignedLocations.includes(loc.id)} onChange={() => handleLocationToggle(loc.id)} className="w-3 h-3 rounded" />
                      {loc.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
              <div>
                <label className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                  <Building2 className="w-3 h-3" />
                  Department (Standalone Location)
                </label>
                {loadingStandalones ? <LoadingSpinner size="small" /> : (
                  <select
                    value={selectedStandalone || ''}
                    onChange={handleStandaloneChange}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select department...</option>
                    {standaloneLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedStandalone && hasStockPermissions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <label className="flex items-center gap-1 text-xs text-blue-700 font-medium mb-1">
                    <Store className="w-3 h-3" />
                    Select Store(s) *
                  </label>
                  <p className="text-xs text-blue-600 mb-1.5">Stock permissions require store assignment</p>
                  {loadingStores ? <LoadingSpinner size="small" /> : storesUnderStandalone.length === 0 ? (
                    <p className="text-xs text-blue-500">No stores found under this department</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {storesUnderStandalone.map(store => (
                        <label key={store.id} className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-xs border ${selectedStores.includes(store.id) ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
                          <input type="checkbox" checked={selectedStores.includes(store.id)} onChange={() => handleStoreToggle(store.id)} className="w-3 h-3 rounded" />
                          {store.name} {store.is_main_store && <span className="text-blue-400">(main)</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedStandalone && !hasStockPermissions && (
                <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  User will have access to all locations under "{standaloneLocations.find(l => l.id === selectedStandalone)?.name}"
                </p>
              )}
            </div>
          )}

          {formData.role === 'SYSTEM_ADMIN' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">Full system access - all locations</p>
            </div>
          )}
          {formData.role === 'AUDITOR' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">Auditor access - can view all locations</p>
            </div>
          )}
        </div>

        {/* Permission Presets - Quick Select */}
        {!formData.role && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-gray-900">Quick Permission Presets</span>
              <span className="text-xs text-gray-500">- Click to toggle</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {PERMISSION_PRESETS.map(preset => {
                const isSelected = selectedPresets.includes(preset.id);
                const c = colorMap[preset.color] || colorMap.gray;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetToggle(preset.id)}
                    className={`flex flex-col items-start p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? `${c.bg} ${c.border} border-2`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? c.text : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${isSelected ? c.text : 'text-gray-700'}`}>
                        {preset.name}
                      </span>
                      {isSelected && <Check className={`w-3 h-3 ${c.text}`} />}
                    </div>
                    <span className="text-xs text-gray-500 line-clamp-1">{preset.description}</span>
                  </button>
                );
              })}
            </div>
            {selectedPresets.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">{selectedPermissions.length}</span> permissions selected from{' '}
                  <span className="font-medium">{selectedPresets.length}</span> preset(s)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Individual Permissions (collapsed by default) */}
        <div className="bg-white rounded-lg border border-gray-200">
          <button type="button" onClick={() => setPermissionsExpanded(!permissionsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-900">
                {formData.role ? 'Additional Permissions' : 'Individual Permissions'}
              </span>
              {selectedPermissions.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  {selectedPermissions.length}
                </span>
              )}
              {hasStockPermissions && !formData.role && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Stock</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">
                {permissionsExpanded ? 'Hide' : 'Show'} details
              </span>
              {permissionsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </div>
          </button>
          {permissionsExpanded && (
            <div className="px-2 pb-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 py-1.5">
                {formData.role ? 'Grant additional permissions beyond the base role' : 'Fine-tune permissions (presets above are recommended)'}
              </p>
              {loadingPermissions ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="small" />
                </div>
              ) : Object.keys(permissionCategories).length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No permissions available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 auto-rows-fr">
                  {Object.entries(permissionCategories).map(([key, cat]) => {
                    const c = colorMap[cat.color] || colorMap.gray;
                    return (
                      <div key={key} className={`${c.bg} ${c.border} border rounded-lg p-1.5 flex flex-col`}>
                        <h4 className={`text-xs font-medium ${c.text} mb-1`}>{cat.label}</h4>
                        <div className="space-y-0.5 flex-1">
                          {cat.permissions.map(p => (
                            <label key={p.codename} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(p.codename)}
                                onChange={() => handlePermissionToggle(p.codename)}
                                className="w-3 h-3 rounded"
                              />
                              <span className="text-xs text-gray-700">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {isEditMode && (
                <button type="button" onClick={handleSavePermissions} disabled={savingPermissions}
                  className="mt-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:bg-gray-400">
                  {savingPermissions ? 'Saving...' : 'Save Permissions'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:bg-gray-400">
            {saving ? <LoadingSpinner size="small" /> : isEditMode ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/users')} className="px-2 py-1 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Cancel</button>
          {isEditMode && (
            <button type="button" onClick={() => {
              const pw = prompt('New password (min 6 chars):');
              if (pw && pw.length >= 6) usersAPI.resetPassword(id, pw).then(() => { setSuccess('Password reset!'); setTimeout(() => setSuccess(''), 2000); }).catch(() => setError('Failed'));
              else if (pw) setError('Min 6 chars');
            }} className="ml-auto flex items-center gap-0.5 px-2 py-1 border border-orange-200 bg-orange-50 text-orange-700 text-xs rounded-lg hover:bg-orange-100">
              <Key className="w-3.5 h-3.5" />Reset Password
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
