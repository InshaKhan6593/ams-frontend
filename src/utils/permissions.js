// src/utils/permissions.js
/**
 * Utility functions for checking centralized control permissions
 * Matches backend logic for ROOT-only access to category/item creation
 */

/**
 * Check if user can create categories or items
 * Only ROOT Location Head, ROOT Main Store Incharge, or users with custom permission
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {boolean}
 */
export const canCreateCategoriesOrItems = (user, permissions) => {
  // 1. SYSTEM_ADMIN can always create
  if (user?.role === 'SYSTEM_ADMIN') {
    return true;
  }

  // 2. Check if user has custom permission
  if (permissions?.can_create_items) {
    return true;
  }

  // 3. Check if user is ROOT Location Head
  // ROOT locations have no parent (stored in assigned_locations or accessible_locations)
  if (user?.role === 'LOCATION_HEAD') {
    // Check if user has any standalone root locations in assigned_locations
    const assignedLocations = user?.assigned_locations || [];
    const accessibleLocations = user?.accessible_locations || [];

    // Look for root locations in assigned locations (locations without parent)
    // In backend, root locations have parent_location=null and is_standalone=true
    // Frontend may not have full location objects, so we check responsible_location
    const responsibleLocation = user?.responsible_location;

    if (responsibleLocation) {
      // If user is assigned to a root location (no parent_location)
      // Backend sends this in permissions.responsible_location
      if (permissions?.responsible_location && !permissions.responsible_location.parent_location) {
        return true;
      }
    }

    // Fallback: check if accessible_standalone_count exists and responsible location is root
    // This indicates user is ROOT location head
    if (user?.accessible_standalone_count > 0 &&
        permissions?.responsible_location?.is_standalone &&
        !permissions?.responsible_location?.parent_location) {
      return true;
    }
  }

  // 4. Check if user is ROOT Main Store Incharge
  if (user?.role === 'STOCK_INCHARGE') {
    // Backend sends is_main_store_incharge flag in permissions
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
  // SYSTEM_ADMIN can always edit
  if (user?.role === 'SYSTEM_ADMIN') {
    return true;
  }

  // Check custom permission
  if (permissions?.can_edit_items) {
    return true;
  }

  // Check if ROOT Location Head or ROOT Main Store Incharge
  return canCreateCategoriesOrItems(user, permissions);
};

/**
 * Check if user can delete categories or items
 * Only SYSTEM_ADMIN can delete
 *
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export const canDeleteCategoriesOrItems = (user) => {
  return user?.role === 'SYSTEM_ADMIN';
};

/**
 * Get user-friendly message explaining why user can't create categories/items
 *
 * @param {Object} user - User object from AuthContext
 * @returns {string}
 */
export const getCannotCreateMessage = (user) => {
  if (!user) {
    return 'You must be logged in to create categories or items.';
  }

  switch (user.role) {
    case 'LOCATION_HEAD':
      return 'Only ROOT Location Heads can create categories and items. Department heads cannot create master catalog entries. Contact your university admin.';
    case 'STOCK_INCHARGE':
      return 'Only ROOT Main Store Incharges can create categories and items. Department store incharges cannot create master catalog entries. Contact your central admin.';
    case 'AUDITOR':
      return 'Auditors have read-only access. Contact your admin to request custom permissions if needed.';
    default:
      return 'You do not have permission to create categories or items. Contact your administrator.';
  }
};

/**
 * Check if user is a ROOT user (for informational purposes)
 *
 * @param {Object} user - User object from AuthContext
 * @param {Object} permissions - Permissions object from AuthContext
 * @returns {Object} - { isRoot: boolean, type: string }
 */
export const isRootUser = (user, permissions) => {
  if (user?.role === 'SYSTEM_ADMIN') {
    return { isRoot: true, type: 'SYSTEM_ADMIN' };
  }

  if (user?.role === 'LOCATION_HEAD') {
    if (permissions?.responsible_location && !permissions.responsible_location.parent_location) {
      return { isRoot: true, type: 'ROOT_LOCATION_HEAD' };
    }
  }

  if (user?.role === 'STOCK_INCHARGE') {
    if (permissions?.is_main_store_incharge === true) {
      return { isRoot: true, type: 'ROOT_MAIN_STORE_INCHARGE' };
    }
  }

  return { isRoot: false, type: null };
};
