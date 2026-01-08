// src/hooks/usePermissions.js
import { useAuth } from './useAuth';

/**
 * Custom hook for checking user permissions
 * Updated to support both Django Groups/Permissions and legacy role system
 *
 * Priority:
 * 1. is_superuser (always has all permissions)
 * 2. Permission-based checks from permissions object
 * 3. Legacy role-based checks (for backwards compatibility)
 */
export const usePermissions = () => {
  const { user, permissions } = useAuth();

  /**
   * Check if user is a superuser (has all permissions)
   * @returns {boolean}
   */
  const isSuperuser = () => {
    return user?.is_superuser === true || permissions?.is_superuser === true;
  };

  /**
   * Check if user has a specific permission
   * Superuser always has all permissions
   * @param {string} permissionKey - Permission key from PERMISSIONS constant
   * @returns {boolean}
   */
  const hasPermission = (permissionKey) => {
    // Superuser has all permissions
    if (isSuperuser()) {
      return true;
    }

    // Check permissions object (includes both Django permissions and custom permissions)
    if (permissions && permissions[permissionKey]) {
      return true;
    }

    // Check Django permissions array (format: 'app.codename')
    if (permissions?.django_permissions) {
      // Map frontend permission keys to Django permission codenames
      const djangoPermMap = {
        // Stock operations
        'can_issue_stock': 'inventory.issue_stock',
        'can_receive_stock': 'inventory.receive_stock',
        'can_transfer_stock': 'inventory.transfer_stock',
        'can_acknowledge_stock': 'inventory.acknowledge_stock',
        'can_return_stock': 'inventory.return_stock',
        'can_view_inventory': 'inventory.view_locationinventory',
        'can_create_stock_entries': 'inventory.add_stockentry',
        // Inspection workflow
        'can_view_inspection_certificates': 'inventory.view_inspectioncertificate',
        'can_initiate_inspection_certificates': 'inventory.initiate_inspectioncertificate',
        'can_edit_inspection_certificates': 'inventory.change_inspectioncertificate',
        'can_fill_stock_details': 'inventory.fill_stock_details',
        'can_fill_central_register': 'inventory.fill_central_register',
        'can_review_as_auditor': 'inventory.review_as_auditor',
        'can_download_inspection_pdf': 'inventory.download_inspection_pdf',
        'can_submit_inspection_stage': 'inventory.submit_to_stock_details',
        'can_submit_to_stock_details': 'inventory.submit_to_stock_details',
        'can_submit_to_central_register': 'inventory.submit_to_central_register',
        'can_submit_to_audit_review': 'inventory.submit_to_audit_review',
        'can_link_inspection_items': 'inventory.link_inspection_items',
        'can_reject_inspection_certificates': 'inventory.reject_inspectioncertificate',
        // Items & Categories
        'can_view_items': 'inventory.view_item',
        'can_create_items': 'inventory.add_item',
        'can_edit_items': 'inventory.change_item',
        'can_delete_items': 'inventory.delete_item',
        'can_manage_categories': 'inventory.manage_categories',
        'can_view_categories': 'inventory.view_category',
        'can_create_categories': 'inventory.add_category',
        'can_edit_categories': 'inventory.change_category',
        'can_delete_categories': 'inventory.delete_category',
        // Locations
        'can_view_locations': 'inventory.view_location',
        'can_create_locations': 'inventory.add_location',
        'can_edit_locations': 'inventory.change_location',
        // Users
        'can_view_users': 'user_management.view_userprofile',
        'can_create_users': 'user_management.add_userprofile',
        'can_edit_users': 'user_management.change_userprofile',
        // Maintenance
        'can_view_maintenance': 'inventory.view_maintenancerecord',
        'can_create_maintenance': 'inventory.add_maintenancerecord',
        'can_complete_maintenance': 'inventory.complete_maintenance',
        'can_approve_maintenance': 'inventory.approve_maintenance',
        // Inter-store requests
        'can_create_inter_store_requests': 'inventory.add_interstorerequest',
        'can_fulfill_inter_store_requests': 'inventory.fulfill_inter_store_request',
        'can_acknowledge_inter_store_requests': 'inventory.acknowledge_inter_store_request',
        // Reports
        'can_view_reports': 'inventory.view_all_reports',
        'can_export_data': 'inventory.export_all_data',
      };

      const djangoPerm = djangoPermMap[permissionKey];
      if (djangoPerm && permissions.django_permissions.includes(djangoPerm)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Check if user has ANY of the provided permissions (OR logic)
   * @param {string[]} permissionKeys - Array of permission keys
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionKeys) => {
    if (isSuperuser()) {
      return true;
    }

    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.some((key) => hasPermission(key));
  };

  /**
   * Check if user has ALL of the provided permissions (AND logic)
   * @param {string[]} permissionKeys - Array of permission keys
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionKeys) => {
    if (isSuperuser()) {
      return true;
    }

    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.every((key) => hasPermission(key));
  };

  /**
   * Check if user belongs to a specific group
   * @param {string} groupName - Group name (e.g., 'Stock Incharge', 'Location Head')
   * @returns {boolean}
   */
  const hasGroup = (groupName) => {
    if (permissions?.groups && Array.isArray(permissions.groups)) {
      return permissions.groups.includes(groupName);
    }
    return false;
  };

  /**
   * Check if user has a specific role
   * Supports both legacy role field and Django Groups
   * @param {string} role - Role to check (e.g., 'SYSTEM_ADMIN', 'LOCATION_HEAD')
   * @returns {boolean}
   */
  const hasRole = (role) => {
    // Check superuser
    if (role === 'SYSTEM_ADMIN' && isSuperuser()) {
      return true;
    }

    // Check legacy role field
    if (user?.role === role || permissions?.role === role) {
      return true;
    }

    // Check Django Groups (map role names to group names)
    const roleToGroupMap = {
      'SYSTEM_ADMIN': 'System Admin',
      'LOCATION_HEAD': 'Location Head',
      'STOCK_INCHARGE': 'Stock Incharge',
      'AUDITOR': 'Auditor',
    };

    const groupName = roleToGroupMap[role];
    if (groupName && hasGroup(groupName)) {
      return true;
    }

    return false;
  };

  /**
   * Check if user can manage custom roles
   * System Admin and Location Head can create/manage custom roles
   * @returns {boolean}
   */
  const canManageCustomRoles = () => {
    return isSuperuser() || hasRole('LOCATION_HEAD') || permissions?.can_manage_custom_roles;
  };

  /**
   * Check if user is a System Admin
   * @returns {boolean}
   */
  const isSystemAdmin = () => {
    return isSuperuser() || hasRole('SYSTEM_ADMIN');
  };

  /**
   * Check if user is a Location Head
   * @returns {boolean}
   */
  const isLocationHead = () => {
    return hasRole('LOCATION_HEAD');
  };

  /**
   * Check if user is a Stock Incharge
   * @returns {boolean}
   */
  const isStockIncharge = () => {
    return hasRole('STOCK_INCHARGE');
  };

  /**
   * Check if user is an Auditor
   * @returns {boolean}
   */
  const isAuditor = () => {
    return hasRole('AUDITOR');
  };

  /**
   * Check if user is main store incharge (central store)
   * @returns {boolean}
   */
  const isMainStoreIncharge = () => {
    return permissions?.is_main_store_incharge === true;
  };

  /**
   * Check if user is Central Store Incharge (by group membership or permission)
   * @returns {boolean}
   */
  const isCentralStoreIncharge = () => {
    // Check if superuser
    if (isSuperuser()) {
      return true;
    }
    // Check group membership
    if (hasGroup('Central Store Incharge')) {
      return true;
    }
    // Check permission
    if (hasPermission('can_fill_central_register')) {
      return true;
    }
    // Check is_main_store_incharge flag
    if (permissions?.is_main_store_incharge === true) {
      return true;
    }
    return false;
  };

  /**
   * Get user's groups
   * @returns {string[]}
   */
  const getGroups = () => {
    return permissions?.groups || [];
  };

  /**
   * Get user's Django permissions
   * @returns {string[]}
   */
  const getDjangoPermissions = () => {
    return permissions?.django_permissions || [];
  };

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Group checks
    hasGroup,
    getGroups,
    getDjangoPermissions,

    // Role checks (supports both legacy and new system)
    hasRole,
    isSystemAdmin,
    isLocationHead,
    isStockIncharge,
    isAuditor,
    isSuperuser,
    isMainStoreIncharge,
    isCentralStoreIncharge,

    // Custom role management
    canManageCustomRoles,

    // Raw data access
    permissions,
    user,
  };
};

export default usePermissions;
