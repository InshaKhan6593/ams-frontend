// src/api/users.js
import apiClient from './client';

export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users/', { params });
    return response.data;
  },

  // Get single user
  getUser: async (id) => {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}/`, userData);
    return response.data;
  },

  // Partial update
  patchUser: async (id, userData) => {
    const response = await apiClient.patch(`/users/${id}/`, userData);
    return response.data;
  },

  // Toggle user active status
  toggleActive: async (id) => {
    const response = await apiClient.post(`/users/${id}/toggle_active/`);
    return response.data;
  },

  // Reset password
  resetPassword: async (id, password) => {
    const response = await apiClient.post(`/users/${id}/reset_password/`, {
      password,
    });
    return response.data;
  },

  // Get my profile
  getMyProfile: async () => {
    const response = await apiClient.get('/users/my_profile/');
    return response.data;
  },

  // Get my pending tasks
  getMyPendingTasks: async () => {
    const response = await apiClient.get('/users/my_pending_tasks/');
    return response.data;
  },

  // Get my permissions
  getMyPermissions: async () => {
    const response = await apiClient.get('/users/my_permissions/');
    return response.data;
  },

  // Update my profile
  updateMyProfile: async (profileData) => {
    const response = await apiClient.patch('/users/my_profile/', profileData);
    return response.data;
  },

  // Get dashboard stats (optimized - replaces 5 separate API calls)
  getDashboardStats: async () => {
    const response = await apiClient.get('/users/dashboard/');
    return response.data;
  },

  // Get role base permissions
  getRolePermissions: async (role) => {
    const response = await apiClient.get('/users/role_permissions/', {
      params: { role }
    });
    return response.data;
  },

  /**
   * Get available Django Groups from backend
   * Falls back to base roles if API fails
   */
  getGroups: async () => {
    try {
      const response = await apiClient.get('/users/groups/');
      return response.data;
    } catch (error) {
      // Fallback to base roles if endpoint doesn't exist
      console.warn('Groups endpoint not available, using base roles');
      return usersAPI.getRoles();
    }
  },

  /**
   * Get role options - base roles that can be assigned to users
   * These map to Django Groups on the backend
   * @returns {Array} Array of role options with value and label
   */
  getRoles: () => {
    return [
      { value: 'SYSTEM_ADMIN', label: 'System Admin', description: 'Full system access' },
      { value: 'LOCATION_HEAD', label: 'Location Head', description: 'Manages standalone locations' },
      { value: 'STOCK_INCHARGE', label: 'Stock Incharge', description: 'Manages store inventory' },
      { value: 'AUDITOR', label: 'Auditor', description: 'Reviews and audits certificates' },
    ];
  },

  /**
   * Get all role options including both base roles and the option for custom-role-only users
   * @returns {Array} Array of role options
   */
  getAllRoleOptions: () => {
    return [
      { value: '', label: 'Custom Role Only', description: 'No base role - assign custom roles', isCustomOnly: true },
      ...usersAPI.getRoles(),
    ];
  },

  /**
   * Assign user to a Django Group
   * @param {number} userId - User ID
   * @param {string} groupName - Group name to assign
   */
  assignGroup: async (userId, groupName) => {
    const response = await apiClient.post(`/users/${userId}/assign_group/`, {
      group_name: groupName
    });
    return response.data;
  },

  /**
   * Remove user from a Django Group
   * @param {number} userId - User ID
   * @param {string} groupName - Group name to remove
   */
  removeGroup: async (userId, groupName) => {
    const response = await apiClient.post(`/users/${userId}/remove_group/`, {
      group_name: groupName
    });
    return response.data;
  },

  /**
   * Get available Django permissions for assignment
   * Returns permissions grouped by category
   */
  getAvailablePermissions: async () => {
    const response = await apiClient.get('/users/available_permissions/');
    return response.data;
  },

  /**
   * Assign Django permissions to a user
   * @param {number} userId - User ID
   * @param {string[]} permissions - Array of permission codenames
   * @param {boolean} replace - If true, replace all existing permissions
   */
  assignPermissions: async (userId, permissions, replace = false) => {
    const response = await apiClient.post(`/users/${userId}/assign_permissions/`, {
      permissions,
      replace
    });
    return response.data;
  },

  /**
   * Get user's current Django permissions
   * @param {number} userId - User ID
   */
  getUserPermissions: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/`);
    return {
      django_permissions: response.data.django_permissions || [],
      groups: response.data.permissions_summary?.groups || []
    };
  },
};

// NOTE: CustomRoles API removed - now using Django Groups/Permissions
// Use groupsAPI for managing user groups

// Groups API (for Django Groups management)
export const groupsAPI = {
  // Get all available groups
  getAll: async () => {
    try {
      const response = await apiClient.get('/groups/');
      return response.data;
    } catch (error) {
      // Fallback to hardcoded groups
      return [
        { id: 1, name: 'Location Head' },
        { id: 2, name: 'Stock Incharge' },
        { id: 3, name: 'Auditor' },
      ];
    }
  },

  // Get group details
  get: async (id) => {
    const response = await apiClient.get(`/groups/${id}/`);
    return response.data;
  },
};

export default usersAPI;
