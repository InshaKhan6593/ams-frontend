// src/components/PermissionSelector.jsx
import { useState, useEffect } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import { usersAPI } from '../api/users';

const PermissionSelector = ({ selectedRole, onChange, value = {} }) => {
  const [basePermissions, setBasePermissions] = useState({});
  const [unassignablePermissions, setUnassignablePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    inspections: true,
    inventory: true,
    items: false,
    locations: false,
    users: false,
  });

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions();
    }
  }, [selectedRole]);

  const fetchRolePermissions = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getRolePermissions(selectedRole);
      setBasePermissions(data.base_permissions || {});
      setUnassignablePermissions(data.unassignable_permissions || []);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePermissionChange = (permissionKey, checked) => {
    onChange({
      ...value,
      [permissionKey]: checked
    });
  };

  const permissionGroups = {
    inspections: {
      label: 'Inspection Certificates',
      permissions: [
        { key: 'can_view_inspection_certificates', label: 'View Inspections' },
        { key: 'can_initiate_inspection_certificates', label: 'Initiate Inspections' },
        { key: 'can_edit_inspection_certificates', label: 'Edit Inspections' },
        { key: 'can_submit_inspection_stage', label: 'Submit Inspection Stages' },
        { key: 'can_fill_stock_details', label: 'Fill Stock Details (Stage 2)' },
        { key: 'can_fill_central_register', label: 'Fill Central Register (Stage 3)' },
        { key: 'can_review_as_auditor', label: 'Review as Auditor (Stage 4)' },
        { key: 'can_download_inspection_pdf', label: 'Download Inspection PDF' },
      ]
    },
    inventory: {
      label: 'Stock & Inventory',
      permissions: [
        { key: 'can_view_inventory', label: 'View Inventory' },
        { key: 'can_create_stock_entries', label: 'Create Stock Entries' },
        { key: 'can_issue_stock', label: 'Issue Stock' },
        { key: 'can_receive_stock', label: 'Receive Stock' },
        { key: 'can_transfer_stock', label: 'Transfer Stock' },
        { key: 'can_acknowledge_stock', label: 'Acknowledge Stock' },
        { key: 'can_return_stock', label: 'Return Stock' },
      ]
    },
    items: {
      label: 'Items & Categories',
      permissions: [
        { key: 'can_view_items', label: 'View Items' },
        { key: 'can_create_items', label: 'Create Items' },
        { key: 'can_edit_items', label: 'Edit Items' },
        { key: 'can_delete_items', label: 'Delete Items' },
      ]
    },
    locations: {
      label: 'Locations',
      permissions: [
        { key: 'can_view_locations', label: 'View Locations' },
        { key: 'can_create_locations', label: 'Create Locations' },
        { key: 'can_edit_locations', label: 'Edit Locations' },
        { key: 'can_delete_locations', label: 'Delete Locations' },
      ]
    },
    users: {
      label: 'User Management',
      permissions: [
        { key: 'can_view_users', label: 'View Users' },
        { key: 'can_create_users', label: 'Create Users' },
        { key: 'can_edit_users', label: 'Edit Users' },
        { key: 'can_assign_custom_roles', label: 'Assign Custom Roles' },
      ]
    }
  };

  if (!selectedRole) {
    return (
      <div className="text-xs text-gray-500 text-center py-4">
        Select a role to configure permissions
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-xs text-gray-500 text-center py-4">
        Loading permissions...
      </div>
    );
  }

  const hasRestrictedPermissions = unassignablePermissions.length > 0;

  return (
    <div className="space-y-2">
      <div className="space-y-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Lock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Base role permissions (locked)</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Unlock className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600">Additional custom permissions</span>
          </div>
        </div>
        {hasRestrictedPermissions && (
          <div className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
            <Lock className="w-3 h-3 text-red-500" />
            <span className="text-red-700">
              Some permissions are restricted and can only be assigned by ROOT location heads or System Admins
            </span>
          </div>
        )}
      </div>

      {Object.entries(permissionGroups).map(([groupKey, group]) => {
        const isExpanded = expandedSections[groupKey];
        const hasAnyPermission = group.permissions.some(p =>
          basePermissions[p.key] || value[p.key]
        );

        return (
          <div key={groupKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(groupKey)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">{group.label}</span>
                {hasAnyPermission && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {group.permissions.filter(p => basePermissions[p.key] || value[p.key]).length}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="p-3 space-y-2">
                {group.permissions.map(permission => {
                  const isBasePerm = basePermissions[permission.key] === true;
                  const isRestricted = unassignablePermissions.includes(permission.key);
                  const isChecked = isBasePerm || value[permission.key] === true;
                  const isDisabled = isBasePerm || isRestricted;

                  return (
                    <label
                      key={permission.key}
                      className={`flex items-center gap-2 p-2 rounded transition-colors ${
                        isDisabled
                          ? 'bg-gray-50 cursor-not-allowed border border-gray-200'
                          : isChecked
                          ? 'bg-blue-50 border border-blue-200 cursor-pointer'
                          : 'hover:bg-blue-50 cursor-pointer border border-transparent'
                      }`}
                      title={isRestricted && !isBasePerm ? 'Only ROOT location heads and System Admins can assign this permission' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                        className={`w-3.5 h-3.5 border-gray-300 rounded focus:ring-blue-500 ${
                          isDisabled
                            ? 'text-gray-500 cursor-not-allowed opacity-60'
                            : 'text-blue-600 cursor-pointer'
                        }`}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-xs font-medium ${
                          isDisabled ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {permission.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {isBasePerm && (
                            <>
                              <span className="text-xs text-gray-500 italic">Base Role</span>
                              <Lock className="w-3 h-3 text-gray-400" />
                            </>
                          )}
                          {isRestricted && !isBasePerm && (
                            <>
                              <span className="text-xs text-red-600 italic">Restricted</span>
                              <Lock className="w-3 h-3 text-red-500" />
                            </>
                          )}
                          {!isDisabled && isChecked && (
                            <span className="text-xs text-blue-600 font-medium">Custom</span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionSelector;
