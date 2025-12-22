// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  // Login
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login/', {
      username,
      password,
    });
    return response.data;
  },

  // Refresh token
  refresh: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/my_profile/');
    return response.data;
  },

  // Get user permissions
  getPermissions: async () => {
    const response = await apiClient.get('/users/my_permissions/');
    return response.data;
  },

  // Get pending tasks
  getPendingTasks: async () => {
    const response = await apiClient.get('/users/my_pending_tasks/');
    return response.data;
  },
};

export default authAPI;