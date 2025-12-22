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

  // Get role options
  getRoles: () => {
    return [
      { value: 'SYSTEM_ADMIN', label: 'System Admin' },
      { value: 'LOCATION_HEAD', label: 'Location Head' },
      { value: 'STOCK_INCHARGE', label: 'Stock Incharge' },
      { value: 'AUDITOR', label: 'Auditor' },
    ];
  },
};

// Custom Roles API
export const customRolesAPI = {
  // Get all custom roles
  getAll: async (params = {}) => {
    const response = await apiClient.get('/custom-roles/', { params });
    return response.data;
  },

  // Get single custom role
  get: async (id) => {
    const response = await apiClient.get(`/custom-roles/${id}/`);
    return response.data;
  },

  // Create custom role
  create: async (roleData) => {
    const response = await apiClient.post('/custom-roles/', roleData);
    return response.data;
  },

  // Update custom role
  update: async (id, roleData) => {
    const response = await apiClient.put(`/custom-roles/${id}/`, roleData);
    return response.data;
  },

  // Delete custom role
  delete: async (id) => {
    const response = await apiClient.delete(`/custom-roles/${id}/`);
    return response.data;
  },
};

export default usersAPI;