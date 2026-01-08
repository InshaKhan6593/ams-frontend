// src/utils/permissions.js
/**
 * Utility functions for checking centralized control permissions
 * Updated to support both Django Groups/Permissions and legacy role system
 *
 * Priority:
 * 1. is_superuser (always has full access)
 * 2. Permission-based checks from permissions object
 * 3. Legacy role-based checks (for backwards compatibility)
 */

/**
 * Check if user is a superuser
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {boolean}
 */
const isSuperuser = (user, permissions) => {
  return user?.is_superuser === true || permissions?.is_superuser === true;
};

/**
 * Check if user has a specific role (supports both legacy and groups)
 * @param {Object} user - User object
 * @param {Object} permissions - Permissions object
 * @param {string} role - Role to check
 * @returns {boolean}
 */
const hasRole = (user, permissions, role) => {
  // Check superuser for SYSTEM_ADMIN
  if (role === 'SYSTEM_ADMIN' && isSuperuser(user, permissions)) {
    return true;
  }

  // Check legacy role field
  if (user?.role === role || permissions?.role === role) {
    return true;
  }

  // Check Django Groups
  const roleToGroupMap = {
    'SYSTEM_ADMIN': 'System Admin',
    'LOCATION_HEAD': 'Location Head',
    'STOCK_INCHARGE': 'Stock Incharge',
    'AUDITOR': 'Auditor',
  };

  const groupName = roleToGroupMap[role];
  if (groupName && permissions?.groups?.includes(groupName)) {
    return true;
  }

  return false;
};

/**
 * Check if user has a Django permission
 * @param {Object} permissions - Permissions object
 * @param {string} permCodename - Permission codename (e.g., 'add_category', 'manage_categories')
 * @returns {boolean}
 */
const hasDjangoPermission = (permissions, permCodename) => {
  if (!permissions?.django_permissions) return false;
  // Check both formats: 'inventory.add_category' and 'add_category'
  return permissions.django_permissions.some(p =>
    p === permCodename ||
    p === `inventory.${permCodename}` ||
    p.endsWith(`.${permCodename}`)
  );
};

/**
 * Check if user can create categories or items
 * Only ROOT Location Head, ROOT Main Store Incharge, or users with custom permission
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {boolean}
 */
export const canCreateCategoriesOrItems = (user, permissions) => {
  // 1. Superuser can always create
  if (isSuperuser(user, permissions)) {
    return true;
  }

  // 2. Check if user has custom permission flag
  if (permissions?.can_create_items) {
    return true;
  }

  // 3. Check for Django permissions (add_category, manage_categories, add_item)
  if (hasDjangoPermission(permissions, 'add_category') ||
      hasDjangoPermission(permissions, 'manage_categories') ||
      hasDjangoPermission(permissions, 'add_item')) {
    return true;
  }

  // 4. Check if user is ROOT Location Head
  if (hasRole(user, permissions, 'LOCATION_HEAD')) {
    // Check if assigned to a root location (no parent_location)
    const responsibleLocation = permissions?.responsible_location;
    if (responsibleLocation && !responsibleLocation.parent_location) {
      return true;
    }

    // Check accessible_standalone_count
    if (user?.accessible_standalone_count > 0 &&
        responsibleLocation?.is_standalone &&
        !responsibleLocation?.parent_location) {
      return true;
    }
  }

  // 5. Check if user is ROOT Main Store Incharge
  if (hasRole(user, permissions, 'STOCK_INCHARGE')) {
    if (permissions?.is_main_store_incharge === true) {
      return true;
    }
  }

  // Default: deny
  return false;
};

/**
 * Check if user can edit categories or items
 * Same logic as create
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {boolean}
 */
export const canEditCategoriesOrItems = (user, permissions) => {
  // Superuser can always edit
  if (isSuperuser(user, permissions)) {
    return true;
  }

  // Check custom permission
  if (permissions?.can_edit_items) {
    return true;
  }

  // Check for Django permissions (change_category, manage_categories, change_item)
  if (hasDjangoPermission(permissions, 'change_category') ||
      hasDjangoPermission(permissions, 'manage_categories') ||
      hasDjangoPermission(permissions, 'change_item')) {
    return true;
  }

  // Check if ROOT Location Head or ROOT Main Store Incharge
  return canCreateCategoriesOrItems(user, permissions);
};

/**
 * Check if user can delete categories or items
 * Only superusers or users with delete permission
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {boolean}
 */
export const canDeleteCategoriesOrItems = (user, permissions) => {
  if (isSuperuser(user, permissions)) {
    return true;
  }

  // Check for Django delete permissions
  if (hasDjangoPermission(permissions, 'delete_category') ||
      hasDjangoPermission(permissions, 'delete_item')) {
    return true;
  }

  return false;
};

/**
 * Get user-friendly message explaining why user can't create categories/items
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {string}
 */
export const getCannotCreateMessage = (user, permissions) => {
  if (!user) {
    return 'You must be logged in to create categories or items.';
  }

  const role = user.role || permissions?.role;
  const groups = permissions?.groups || [];

  if (hasRole(user, permissions, 'LOCATION_HEAD') || groups.includes('Location Head')) {
    return 'Only ROOT Location Heads can create categories and items. Department heads cannot create master catalog entries. Contact your university admin.';
  }

  if (hasRole(user, permissions, 'STOCK_INCHARGE') || groups.includes('Stock Incharge')) {
    return 'Only ROOT Main Store Incharges can create categories and items. Department store incharges cannot create master catalog entries. Contact your central admin.';
  }

  if (hasRole(user, permissions, 'AUDITOR') || groups.includes('Auditor')) {
    return 'Auditors have read-only access. Contact your admin to request custom permissions if needed.';
  }

  return 'You do not have permission to create categories or items. Contact your administrator.';
};

/**
 * Check if user is a ROOT user (for informational purposes)
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {Object} - { isRoot: boolean, type: string }
 */
export const isRootUser = (user, permissions) => {
  if (isSuperuser(user, permissions)) {
    return { isRoot: true, type: 'SUPERUSER' };
  }

  if (hasRole(user, permissions, 'LOCATION_HEAD')) {
    const responsibleLocation = permissions?.responsible_location;
    if (responsibleLocation && !responsibleLocation.parent_location) {
      return { isRoot: true, type: 'ROOT_LOCATION_HEAD' };
    }
  }

  if (hasRole(user, permissions, 'STOCK_INCHARGE')) {
    if (permissions?.is_main_store_incharge === true) {
      return { isRoot: true, type: 'ROOT_MAIN_STORE_INCHARGE' };
    }
  }

  return { isRoot: false, type: null };
};

/**
 * Get display name for user's role(s)
 * @param {Object} user - User object
 * @param {Object} permissions - Permissions object
 * @returns {string}
 */
export const getRoleDisplayName = (user, permissions) => {
  if (isSuperuser(user, permissions)) {
    return 'System Admin';
  }

  // Check groups first
  const groups = permissions?.groups || [];
  if (groups.length > 0) {
    return groups.join(', ');
  }

  // Fall back to legacy role
  const roleMap = {
    'SYSTEM_ADMIN': 'System Admin',
    'LOCATION_HEAD': 'Location Head',
    'STOCK_INCHARGE': 'Stock Incharge',
    'AUDITOR': 'Auditor',
  };

  const role = user?.role || permissions?.role;
  return roleMap[role] || permissions?.role_display || 'No Role';
};

/**
 * Check if user has a specific permission
 * @param {Object} permissions - Permissions object
 * @param {string} permKey - Permission key
 * @returns {boolean}
 */
export const hasPermission = (permissions, permKey) => {
  if (permissions?.is_superuser) {
    return true;
  }
  return permissions?.[permKey] === true;
};
