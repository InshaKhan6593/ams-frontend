// src/hooks/usePermissions.js
import { useAuth } from './useAuth';

/**
 * Custom hook for checking user permissions
 * Provides a centralized way to check permissions throughout the application
 */
export const usePermissions = () => {
  const { user, permissions } = useAuth();

  /**
   * Check if user has a specific permission
   * System Admin always has all permissions
   * @param {string} permissionKey - Permission key from PERMISSIONS constant
   * @returns {boolean}
   */
  const hasPermission = (permissionKey) => {
    // System Admin has all permissions
    if (user?.role === 'SYSTEM_ADMIN') {
      return true;
    }

    // Check custom permissions from aggregated roles
    if (permissions && permissions[permissionKey]) {
      return true;
    }

    return false;
  };

  /**
   * Check if user has ANY of the provided permissions (OR logic)
   * @param {string[]} permissionKeys - Array of permission keys
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionKeys) => {
    if (user?.role === 'SYSTEM_ADMIN') {
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
    if (user?.role === 'SYSTEM_ADMIN') {
      return true;
    }

    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.every((key) => hasPermission(key));
  };

  /**
   * Legacy role-based check (for backward compatibility)
   * @param {string} role - Role to check (e.g., 'SYSTEM_ADMIN', 'LOCATION_HEAD')
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Check if user can manage custom roles
   * Only System Admin and Location Head can create/manage custom roles
   * @returns {boolean}
   */
  const canManageCustomRoles = () => {
    return user?.role === 'SYSTEM_ADMIN' || user?.role === 'LOCATION_HEAD';
  };

  /**
   * Check if user is a System Admin
   * @returns {boolean}
   */
  const isSystemAdmin = () => {
    return user?.role === 'SYSTEM_ADMIN';
  };

  /**
   * Check if user is a Location Head
   * @returns {boolean}
   */
  const isLocationHead = () => {
    return user?.role === 'LOCATION_HEAD';
  };

  /**
   * Check if user is a Stock Incharge
   * @returns {boolean}
   */
  const isStockIncharge = () => {
    return user?.role === 'STOCK_INCHARGE';
  };

  /**
   * Check if user is an Auditor
   * @returns {boolean}
   */
  const isAuditor = () => {
    return user?.role === 'AUDITOR';
  };

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role checks
    hasRole,
    isSystemAdmin,
    isLocationHead,
    isStockIncharge,
    isAuditor,

    // Custom role management
    canManageCustomRoles,

    // Raw data access
    permissions,
    user,
  };
};

export default usePermissions;
